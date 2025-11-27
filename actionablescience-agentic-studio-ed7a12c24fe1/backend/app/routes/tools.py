"""
Tools API Routes

Endpoints for managing and executing MCP tools/connectors.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ..mcp import ToolRegistry, ToolExecutor, ToolMetadata
from ..mcp.base_tool import ToolExecutionResult

router = APIRouter()

# Initialize registry and executor
registry = ToolRegistry()
executor = ToolExecutor(registry)


# Request/Response Models
class ToolExecuteRequest(BaseModel):
    """Request model for tool execution"""
    tool_id: str
    parameters: Dict[str, Any]
    config: Optional[Dict[str, Any]] = None


class ToolExecuteResponse(BaseModel):
    """Response model for tool execution"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# API Endpoints

@router.get("/", response_model=List[ToolMetadata])
async def list_tools(
    category: Optional[str] = None,
    enabled_only: bool = True
):
    """
    List all available tools.

    Args:
        category: Filter by category (itsm, crm, productivity, integration)
        enabled_only: Only return enabled tools

    Returns:
        List of tool metadata
    """
    tools = registry.list_tools(category=category, enabled_only=enabled_only)
    return tools


@router.get("/{tool_id}", response_model=ToolMetadata)
async def get_tool(tool_id: str):
    """
    Get metadata for a specific tool.

    Args:
        tool_id: Tool identifier

    Returns:
        Tool metadata

    Raises:
        404: If tool not found
    """
    metadata = registry.get_tool_metadata(tool_id)
    if not metadata:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found")
    return metadata


@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_tool(request: ToolExecuteRequest):
    """
    Execute a tool with given parameters.

    Args:
        request: Tool execution request with tool_id, parameters, and optional config

    Returns:
        Tool execution result
    """
    result = await executor.execute_tool(
        tool_id=request.tool_id,
        parameters=request.parameters,
        config=request.config
    )

    return ToolExecuteResponse(
        success=result.success,
        data=result.data,
        error=result.error,
        metadata=result.metadata
    )


@router.get("/openai/format")
async def get_openai_tools(tool_ids: Optional[str] = None):
    """
    Get tools formatted for OpenAI Assistants API.

    Args:
        tool_ids: Comma-separated list of tool IDs (optional, returns all if not provided)

    Returns:
        List of tools in OpenAI format
    """
    tool_id_list = None
    if tool_ids:
        tool_id_list = [tid.strip() for tid in tool_ids.split(",")]

    openai_tools = registry.get_openai_tools(tool_ids=tool_id_list)
    return {"tools": openai_tools}


@router.get("/registry/stats")
async def get_registry_stats():
    """
    Get statistics about the tool registry.

    Returns:
        Registry statistics
    """
    all_tools = registry.list_tools(enabled_only=False)
    enabled_tools = registry.list_tools(enabled_only=True)

    categories = {}
    for tool in all_tools:
        categories[tool.category] = categories.get(tool.category, 0) + 1

    return {
        "total_tools": len(all_tools),
        "enabled_tools": len(enabled_tools),
        "disabled_tools": len(all_tools) - len(enabled_tools),
        "categories": categories
    }
