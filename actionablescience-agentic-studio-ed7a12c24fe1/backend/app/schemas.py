from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

class AgentBase(BaseModel):
    agent_name: str
    description: str
    expected_outcome: str
    deployment_channel: str

    inputs: List[Dict[str, Any]]
    outputs: List[Dict[str, Any]]
    tools: Dict[str, Any]
    tools_enabled: bool
    web_scraper_config: Optional[Dict[str, Any]] = None

    system_prompt: str
    user_prompt_template: str
    additional_instructions: str

    memory_enabled: bool
    temperature: float
    max_tokens: int

    auto_deploy: bool
    enable_monitoring: bool
    send_notifications: bool

    status: Optional[str] = 'draft' # Make it optional on creation

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Workflow Schemas
class WorkflowExecuteRequest(BaseModel):
    """Request to execute a deployed agent workflow"""
    input_data: Dict[str, Any]

class WorkflowBase(BaseModel):
    agent_id: int
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class WorkflowCreate(WorkflowBase):
    pass

class Workflow(WorkflowBase):
    id: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Multi-Agent Workflow Schemas

class WorkflowNode(BaseModel):
    """Individual node in the workflow graph"""
    id: str
    agent_id: Union[int, str]  # int for database agents, str for template agents (e.g., "template-intake-routing")
    position: Dict[str, float]  # {"x": 100, "y": 200}
    label: Optional[str] = None  # Display name for the node

class WorkflowEdge(BaseModel):
    """Connection between nodes in the workflow"""
    id: str
    source: str  # source node id
    target: str  # target node id

class WorkflowDefinition(BaseModel):
    """Complete workflow definition structure"""
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class MultiAgentWorkflowCreate(BaseModel):
    """Create a new multi-agent workflow"""
    name: str
    description: str
    workflow_definition: Optional[WorkflowDefinition] = None  # Can be empty on creation

class MultiAgentWorkflowUpdate(BaseModel):
    """Update an existing workflow"""
    name: Optional[str] = None
    description: Optional[str] = None
    workflow_definition: Optional[WorkflowDefinition] = None
    status: Optional[str] = None

class MultiAgentWorkflow(BaseModel):
    """Multi-agent workflow response"""
    id: int
    name: str
    description: str
    workflow_definition: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MultiAgentWorkflowExecuteRequest(BaseModel):
    """Request to execute a multi-agent workflow"""
    input_data: Dict[str, Any]

class MultiAgentWorkflowExecution(BaseModel):
    """Multi-agent workflow execution response"""
    id: int
    workflow_id: int
    status: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    node_results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)