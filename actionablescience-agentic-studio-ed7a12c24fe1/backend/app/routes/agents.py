from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..db import get_db

router = APIRouter(
    prefix="/api/v1/agents",
    tags=["agents"],
)

@router.post("/", response_model=schemas.Agent, status_code=201)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
    """
    Create a new agent and save it to the database.
    If auto_deploy is enabled, automatically deploy the agent.
    """
    # .model_dump() is the correct Pydantic V2 method.
    agent_data = agent.model_dump()

    # Set initial status based on auto_deploy flag
    if agent_data.get('auto_deploy', False):
        agent_data['status'] = models.AgentStatus.DEPLOYED
    else:
        agent_data['status'] = models.AgentStatus.DRAFT

    db_agent = models.Agent(**agent_data)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

@router.get("/", response_model=List[schemas.Agent])
def get_all_agents(db: Session = Depends(get_db)):
    """
    Retrieve a list of all agents from the database.
    """
    agents = db.query(models.Agent).all()
    return agents

# endpoint for getting an agent by its ID.
@router.get("/{agent_id}", response_model=schemas.Agent)
def get_agent_by_id(agent_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single agent from the database by its unique ID.
    """
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent


@router.put("/{agent_id}", response_model=schemas.Agent)
def update_agent(agent_id: int, agent_update: schemas.AgentCreate, db: Session = Depends(get_db)):
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Update the agent's fields
    update_data = agent_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_agent, key, value)

    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.post("/{agent_id}/deploy", response_model=schemas.Agent)
def deploy_agent(agent_id: int, db: Session = Depends(get_db)):
    """
    Deploy an agent manually (change status from DRAFT to DEPLOYED).
    """
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    if db_agent.status == models.AgentStatus.DEPLOYED:
        raise HTTPException(status_code=400, detail="Agent is already deployed")

    db_agent.status = models.AgentStatus.DEPLOYED
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.delete("/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    """
    Delete an agent. Prevents deletion if:
    1. Agent has running workflows
    2. Agent is used in any active multi-agent workflows
    """
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check for running single-agent workflows
    running_workflows = db.query(models.Workflow).filter(
        models.Workflow.agent_id == agent_id,
        models.Workflow.status.in_([models.WorkflowStatus.PENDING, models.WorkflowStatus.RUNNING])
    ).count()

    if running_workflows > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete agent. It has {running_workflows} running workflow(s). Please wait for them to complete."
        )

    # Check if agent is used in any active multi-agent workflows
    active_multi_workflows = db.query(models.MultiAgentWorkflow).filter(
        models.MultiAgentWorkflow.status == models.MultiAgentWorkflowStatus.ACTIVE
    ).all()

    workflows_using_agent = []
    for workflow in active_multi_workflows:
        workflow_def = workflow.workflow_definition
        if workflow_def and 'nodes' in workflow_def:
            for node in workflow_def['nodes']:
                if node.get('agent_id') == agent_id:
                    workflows_using_agent.append(workflow.name)
                    break

    if workflows_using_agent:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete agent. It is used in active workflow(s): {', '.join(workflows_using_agent)}. Please remove it from these workflows first."
        )

    # Check for running multi-agent workflow executions that use this agent
    running_executions = db.query(models.MultiAgentWorkflowExecution).join(
        models.MultiAgentWorkflow
    ).filter(
        models.MultiAgentWorkflowExecution.status.in_([
            models.MultiAgentWorkflowExecutionStatus.PENDING,
            models.MultiAgentWorkflowExecutionStatus.RUNNING
        ])
    ).all()

    for execution in running_executions:
        workflow = execution.workflow
        if workflow.workflow_definition and 'nodes' in workflow.workflow_definition:
            for node in workflow.workflow_definition['nodes']:
                if node.get('agent_id') == agent_id:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot delete agent. Workflow '{workflow.name}' is currently executing with this agent."
                    )

    # Safe to delete
    db.delete(db_agent)
    db.commit()
    return {"message": f"Agent '{db_agent.agent_name}' deleted successfully"}