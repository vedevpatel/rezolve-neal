import enum
from datetime import datetime
from sqlalchemy import (
    Integer, String, Boolean, Float, Text, Enum, DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Dict, List, Any, Optional
from .db import Base

# Define the possible statuses using Python's enum
class AgentStatus(str, enum.Enum):
    DRAFT = "draft"
    DEPLOYED = "deployed"
    ARCHIVED = "archived"

class WorkflowStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class MultiAgentWorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class MultiAgentWorkflowExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class Agent(Base):
    __tablename__ = "agents"

    # Modern SQLAlchemy 2.0 syntax with type annotations
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    agent_name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(Text)
    expected_outcome: Mapped[str] = mapped_column(Text)
    deployment_channel: Mapped[str] = mapped_column(String)
    
    # Step 2 Data
    inputs: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB)
    outputs: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB)
    tools: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    tools_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    web_scraper_config: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    
    # Step 3 Data
    system_prompt: Mapped[str] = mapped_column(Text)
    user_prompt_template: Mapped[str] = mapped_column(Text)
    additional_instructions: Mapped[str] = mapped_column(Text)
    
    # Step 4 Data
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=2048)
    
    # Step 5 Data
    auto_deploy: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_monitoring: Mapped[bool] = mapped_column(Boolean, default=True)
    send_notifications: Mapped[bool] = mapped_column(Boolean, default=True)

    # Status column using the Enum
    status: Mapped[AgentStatus] = mapped_column(Enum(AgentStatus), default=AgentStatus.DRAFT, nullable=False)

    # Relationship to workflows
    workflows: Mapped[List["Workflow"]] = relationship("Workflow", back_populates="agent")


class Workflow(Base):
    """
    Workflow execution instances for deployed agents.
    Each execution of an agent creates a workflow record.
    """
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    agent_id: Mapped[int] = mapped_column(ForeignKey("agents.id"), nullable=False)

    # Execution details
    status: Mapped[WorkflowStatus] = mapped_column(Enum(WorkflowStatus), default=WorkflowStatus.PENDING)
    input_data: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationship back to agent
    agent: Mapped["Agent"] = relationship("Agent", back_populates="workflows")


class MultiAgentWorkflow(Base):
    """
    Multi-agent workflow template/definition.
    Stores the workflow structure with multiple agents connected in a graph.
    """
    __tablename__ = "multi_agent_workflows"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(Text)

    # Workflow definition stored as JSON
    # Structure: {
    #   "nodes": [{"id": "node1", "agent_id": 123, "position": {"x": 100, "y": 200}}],
    #   "edges": [{"id": "edge1", "source": "node1", "target": "node2"}]
    # }
    workflow_definition: Mapped[Dict[str, Any]] = mapped_column(JSONB)

    # Status and metadata
    status: Mapped[MultiAgentWorkflowStatus] = mapped_column(
        Enum(MultiAgentWorkflowStatus),
        default=MultiAgentWorkflowStatus.DRAFT
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to executions
    executions: Mapped[List["MultiAgentWorkflowExecution"]] = relationship(
        "MultiAgentWorkflowExecution",
        back_populates="workflow"
    )


class MultiAgentWorkflowExecution(Base):
    """
    Execution instance of a multi-agent workflow.
    Tracks the runtime execution of a workflow template.
    """
    __tablename__ = "multi_agent_workflow_executions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("multi_agent_workflows.id"), nullable=False)

    # Execution status and data
    status: Mapped[MultiAgentWorkflowExecutionStatus] = mapped_column(
        Enum(MultiAgentWorkflowExecutionStatus),
        default=MultiAgentWorkflowExecutionStatus.PENDING
    )

    # Input/output for the entire workflow
    input_data: Mapped[Dict[str, Any]] = mapped_column(JSONB)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Node-level results stored as: {"node1": {...}, "node2": {...}}
    node_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Error tracking
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationship back to workflow template
    workflow: Mapped["MultiAgentWorkflow"] = relationship(
        "MultiAgentWorkflow",
        back_populates="executions"
    )

