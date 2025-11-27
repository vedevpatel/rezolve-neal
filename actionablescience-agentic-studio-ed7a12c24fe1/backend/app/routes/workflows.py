"""
Workflows API Routes

Handles execution of autonomous agent workflows and tool invocations.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
from ..mcp.registry import registry  # Import the singleton registry only
from .. import models, schemas
from ..db import get_db
from ..services import LLMService

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


class ToolExecutionRequest(BaseModel):
    """Request model for executing a tool within a workflow"""
    parameters: Dict[str, Any]


@router.get("/", response_model=List[schemas.Workflow])
async def list_workflows(db: Session = Depends(get_db)):
    """List all workflow executions"""
    workflows = db.query(models.Workflow).all()
    return workflows


@router.get("/agent/{agent_id}", response_model=List[schemas.Workflow])
async def list_agent_workflows(agent_id: int, db: Session = Depends(get_db)):
    """List all workflow executions for a specific agent"""
    workflows = db.query(models.Workflow).filter(models.Workflow.agent_id == agent_id).all()
    return workflows


@router.get("/workflow/{workflow_id}", response_model=schemas.Workflow)
async def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Get a specific workflow execution by ID"""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.get("/tools")
async def list_available_tools():
    """List all registered MCP tools available for workflows"""
    tools = registry.list_tools()
    return {
        "tools": [
            {
                "id": tool.id,
                "name": tool.name,
                "description": tool.description,
                "category": tool.category,
                "tags": tool.tags,
                "parameters": [
                    {
                        "name": param.name,
                        "type": param.type.value,
                        "description": param.description,
                        "required": param.required,
                        "default": param.default,
                    }
                    for param in tool.parameters
                ],
            }
            for tool in tools
        ]
    }


@router.post("/execute/{tool_id}")
async def execute_tool_route(tool_id: str, request: ToolExecutionRequest):
    """Execute a specific tool by ID with given parameters"""
    try:
        result = await registry.execute_tool(tool_id, **request.parameters)
        return {
            "success": result.success,
            "data": result.data,
            "error": result.error,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent/{agent_id}/execute", response_model=schemas.Workflow)
async def execute_agent_workflow(
    agent_id: int,
    request: schemas.WorkflowExecuteRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a deployed agent as a workflow with given input data.
    This endpoint handles web scraping or other tool-enabled agents.
    """
    # Get the agent
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if agent is deployed
    if agent.status != models.AgentStatus.DEPLOYED:
        raise HTTPException(
            status_code=400,
            detail=f"Agent must be deployed before execution. Current status: {agent.status}"
        )

    # Create workflow record
    workflow = models.Workflow(
        agent_id=agent_id,
        status=models.WorkflowStatus.PENDING,
        input_data=request.input_data,
        created_at=datetime.utcnow()
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)

    # Update workflow status to running
    workflow.status = models.WorkflowStatus.RUNNING
    workflow.started_at = datetime.utcnow()
    db.commit()

    try:
        # Initialize LLM service
        llm_service = LLMService()

        # Execute agent workflow with LLM integration
        result = await llm_service.execute_agent_workflow(
            agent=agent,
            user_input=request.input_data,
            conversation_history=None  # TODO: Implement conversation history from DB
        )

        # Prepare output data
        output_data = {
            "content": result["content"],
            "tool_results": result.get("tool_results", {}),
            "processing_mode": result.get("processing_mode", "direct"),
            "input_data": request.input_data,
            "agent_name": agent.agent_name,
        }

        # Mark workflow as completed
        workflow.status = models.WorkflowStatus.COMPLETED
        workflow.output_data = output_data
        workflow.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(workflow)

        return workflow

    except Exception as e:
        # Handle execution errors
        workflow.status = models.WorkflowStatus.FAILED
        workflow.error = str(e)
        workflow.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(workflow)
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")
