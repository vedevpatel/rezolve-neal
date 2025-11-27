"""
Multi-Agent Workflow API Routes

Handles CRUD operations and execution for multi-agent workflows.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from ..db import get_db
from ..models import MultiAgentWorkflow, MultiAgentWorkflowExecution, MultiAgentWorkflowStatus, MultiAgentWorkflowExecutionStatus
from ..schemas import (
    MultiAgentWorkflowCreate,
    MultiAgentWorkflowUpdate,
    MultiAgentWorkflow as MultiAgentWorkflowSchema,
    MultiAgentWorkflowExecuteRequest,
    MultiAgentWorkflowExecution as MultiAgentWorkflowExecutionSchema,
)

router = APIRouter(
    prefix="/api/multi-agent-workflows",
    tags=["multi-agent-workflows"]
)


@router.post("/", response_model=MultiAgentWorkflowSchema)
async def create_workflow(
    workflow_data: MultiAgentWorkflowCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new multi-agent workflow.
    Initially created with draft status and empty or provided workflow definition.
    """
    # Convert workflow_definition to dict if provided
    workflow_def_dict = {}
    if workflow_data.workflow_definition:
        workflow_def_dict = workflow_data.workflow_definition.model_dump()

    db_workflow = MultiAgentWorkflow(
        name=workflow_data.name,
        description=workflow_data.description,
        workflow_definition=workflow_def_dict,
        status=MultiAgentWorkflowStatus.DRAFT
    )

    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@router.get("/", response_model=List[MultiAgentWorkflowSchema])
async def list_workflows(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all multi-agent workflows, ordered by most recently updated.
    """
    workflows = db.query(MultiAgentWorkflow)\
        .order_by(desc(MultiAgentWorkflow.updated_at))\
        .offset(skip)\
        .limit(limit)\
        .all()

    return workflows


@router.get("/{workflow_id}", response_model=MultiAgentWorkflowSchema)
async def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific multi-agent workflow by ID.
    """
    workflow = db.query(MultiAgentWorkflow)\
        .filter(MultiAgentWorkflow.id == workflow_id)\
        .first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow


@router.put("/{workflow_id}", response_model=MultiAgentWorkflowSchema)
async def update_workflow(
    workflow_id: int,
    workflow_update: MultiAgentWorkflowUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing multi-agent workflow.
    Can update name, description, workflow_definition, or status.
    """
    workflow = db.query(MultiAgentWorkflow)\
        .filter(MultiAgentWorkflow.id == workflow_id)\
        .first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Update fields if provided
    if workflow_update.name is not None:
        workflow.name = workflow_update.name

    if workflow_update.description is not None:
        workflow.description = workflow_update.description

    if workflow_update.workflow_definition is not None:
        workflow.workflow_definition = workflow_update.workflow_definition.model_dump()

        # Automatically set status to ACTIVE if workflow has nodes and is currently DRAFT
        # Only apply auto-activation if status wasn't explicitly provided
        if workflow_update.status is None:
            if (workflow.status == MultiAgentWorkflowStatus.DRAFT and
                workflow.workflow_definition.get('nodes') and
                len(workflow.workflow_definition['nodes']) > 0):
                workflow.status = MultiAgentWorkflowStatus.ACTIVE

    # Explicit status updates always take precedence over auto-activation
    if workflow_update.status is not None:
        workflow.status = MultiAgentWorkflowStatus(workflow_update.status)

    workflow.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(workflow)

    return workflow


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete a multi-agent workflow and all its executions.

    Parameters:
    - force: If True, cancels running executions and deletes anyway
             If False, prevents deletion if there are running executions
    """
    workflow = db.query(MultiAgentWorkflow)\
        .filter(MultiAgentWorkflow.id == workflow_id)\
        .first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Check for running executions
    running_executions = db.query(MultiAgentWorkflowExecution)\
        .filter(
            MultiAgentWorkflowExecution.workflow_id == workflow_id,
            MultiAgentWorkflowExecution.status.in_([
                MultiAgentWorkflowExecutionStatus.PENDING,
                MultiAgentWorkflowExecutionStatus.RUNNING
            ])
        )

    running_count = running_executions.count()

    if running_count > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete workflow '{workflow.name}'. It has {running_count} running execution(s). Use force=true to cancel and delete anyway."
        )

    # If force=true, cancel all running executions first
    if running_count > 0 and force:
        running_executions.update({
            "status": MultiAgentWorkflowExecutionStatus.FAILED,
            "error": "Execution canceled due to workflow deletion",
            "completed_at": datetime.utcnow()
        }, synchronize_session=False)

    # Store workflow name before expunging
    workflow_name = workflow.name

    # Delete all executions first (including completed ones)
    db.query(MultiAgentWorkflowExecution)\
        .filter(MultiAgentWorkflowExecution.workflow_id == workflow_id)\
        .delete(synchronize_session=False)

    # Expunge the workflow from session to prevent relationship tracking
    db.expunge(workflow)

    # Delete the workflow using bulk delete instead of session delete
    db.query(MultiAgentWorkflow)\
        .filter(MultiAgentWorkflow.id == workflow_id)\
        .delete(synchronize_session=False)

    db.commit()

    return {"message": f"Workflow '{workflow_name}' deleted successfully"}


@router.post("/{workflow_id}/execute", response_model=MultiAgentWorkflowExecutionSchema)
async def execute_workflow(
    workflow_id: int,
    execute_request: MultiAgentWorkflowExecuteRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a multi-agent workflow.
    Creates an execution record and processes the workflow.
    """
    # Get workflow
    workflow = db.query(MultiAgentWorkflow)\
        .filter(MultiAgentWorkflow.id == workflow_id)\
        .first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Create execution record
    execution = MultiAgentWorkflowExecution(
        workflow_id=workflow_id,
        status=MultiAgentWorkflowExecutionStatus.PENDING,
        input_data=execute_request.input_data,
        node_results={},
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Import executor here to avoid circular imports
    from ..langgraph.multi_agent_executor import MultiAgentWorkflowExecutor

    # Execute workflow
    executor = MultiAgentWorkflowExecutor(db)

    try:
        execution.status = MultiAgentWorkflowExecutionStatus.RUNNING
        execution.started_at = datetime.utcnow()
        db.commit()

        result = await executor.execute_workflow(
            workflow=workflow,
            execution=execution,
            input_data=execute_request.input_data
        )

        # Update execution with results
        execution.status = MultiAgentWorkflowExecutionStatus.COMPLETED
        execution.output_data = result.get("output_data")
        execution.node_results = result.get("node_results")
        execution.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(execution)

    except Exception as e:
        # Handle execution failure
        execution.status = MultiAgentWorkflowExecutionStatus.FAILED
        execution.error = str(e)
        execution.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(execution)

        raise HTTPException(
            status_code=500,
            detail=f"Workflow execution failed: {str(e)}"
        )

    return execution


@router.get("/{workflow_id}/executions", response_model=List[MultiAgentWorkflowExecutionSchema])
async def get_workflow_executions(
    workflow_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all executions for a specific workflow.
    """
    executions = db.query(MultiAgentWorkflowExecution)\
        .filter(MultiAgentWorkflowExecution.workflow_id == workflow_id)\
        .order_by(desc(MultiAgentWorkflowExecution.created_at))\
        .offset(skip)\
        .limit(limit)\
        .all()

    return executions


@router.get("/executions/{execution_id}", response_model=MultiAgentWorkflowExecutionSchema)
async def get_execution(
    execution_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific workflow execution by ID.
    """
    execution = db.query(MultiAgentWorkflowExecution)\
        .filter(MultiAgentWorkflowExecution.id == execution_id)\
        .first()

    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    return execution


@router.post("/{workflow_id}/executions/{execution_id}/cancel")
async def cancel_execution(
    workflow_id: int,
    execution_id: int,
    db: Session = Depends(get_db)
):
    """
    Cancel a running or pending workflow execution.
    Changes status to FAILED with cancellation message.
    """
    execution = db.query(MultiAgentWorkflowExecution)\
        .filter(
            MultiAgentWorkflowExecution.id == execution_id,
            MultiAgentWorkflowExecution.workflow_id == workflow_id
        )\
        .first()

    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # Only allow canceling PENDING or RUNNING executions
    if execution.status not in [
        MultiAgentWorkflowExecutionStatus.PENDING,
        MultiAgentWorkflowExecutionStatus.RUNNING
    ]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel execution with status '{execution.status}'. Only PENDING or RUNNING executions can be canceled."
        )

    # Update execution status to FAILED with cancellation message
    execution.status = MultiAgentWorkflowExecutionStatus.FAILED
    execution.error = "Execution canceled by user"
    execution.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(execution)

    return {"message": f"Execution {execution_id} canceled successfully", "execution": execution}
