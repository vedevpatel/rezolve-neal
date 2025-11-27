"""
LangGraph Executor

High-level executor for running agents with LangGraph.
Handles tool conversion, state initialization, and result extraction.
"""

from typing import Dict, Any, List, Optional
from .agent_graph import create_agent_graph, build_initial_state
from ..mcp import ToolRegistry
from ..mcp.base_tool import BaseTool

try:
    from langchain_core.messages import HumanMessage, AIMessage
    from langchain_core.tools import StructuredTool
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    HumanMessage = None  # type: ignore
    AIMessage = None  # type: ignore
    StructuredTool = None  # type: ignore


class LangGraphExecutor:
    """
    Executor for LangGraph-based agent workflows.

    This class bridges the MCP tool system with LangGraph,
    converting MCP tools to LangChain format and managing agent execution.
    """

    def __init__(self):
        self.registry = ToolRegistry()

    def _mcp_tool_to_langchain(self, mcp_tool: BaseTool) -> Any:
        """
        Convert an MCP tool to LangChain-compatible format.

        Args:
            mcp_tool: BaseTool instance

        Returns:
            LangChain-compatible tool wrapper
        """
        from pydantic import Field, create_model

        if not LANGCHAIN_AVAILABLE:
            raise RuntimeError("LangChain not installed. Run: pip install -r requirements.txt")

        # Get tool metadata
        metadata = mcp_tool.get_metadata()

        # Build Pydantic model for parameters - use **kwargs for create_model
        field_definitions: Dict[str, Any] = {}

        for param in metadata.parameters:
            # Determine the type for this parameter and create field definition
            if param.type == "number":
                if param.required:
                    field_definitions[param.name] = (float, Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (float, Field(default=getattr(param, "default", None), description=param.description))
            elif param.type == "integer":
                if param.required:
                    field_definitions[param.name] = (int, Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (int, Field(default=getattr(param, "default", None), description=param.description))
            elif param.type == "boolean":
                if param.required:
                    field_definitions[param.name] = (bool, Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (bool, Field(default=getattr(param, "default", None), description=param.description))
            elif param.type == "array":
                if param.required:
                    field_definitions[param.name] = (List[Any], Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (List[Any], Field(default=getattr(param, "default", None), description=param.description))
            elif param.type == "object":
                if param.required:
                    field_definitions[param.name] = (Dict[str, Any], Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (Dict[str, Any], Field(default=getattr(param, "default", None), description=param.description))
            else:  # default to string
                if param.required:
                    field_definitions[param.name] = (str, Field(..., description=param.description))
                else:
                    field_definitions[param.name] = (str, Field(default=getattr(param, "default", None), description=param.description))

        # Create dynamic Pydantic model
        InputSchema = create_model(
            f"{metadata.name.replace(' ', '')}Input",
            **field_definitions
        )

        # Create wrapper function
        async def tool_func(**kwargs: Any) -> Any:
            """Execute the MCP tool"""
            result = await mcp_tool.execute(**kwargs)
            if result.success:
                return result.data
            else:
                return f"Error: {result.error}"

        # Create LangChain tool
        return StructuredTool(  # type: ignore
            name=metadata.id,
            description=metadata.description,
            args_schema=InputSchema,
            func=tool_func,
            coroutine=tool_func,
        )

    async def execute_agent(
        self,
        agent_model,
        user_input: Dict[str, Any],
        conversation_history: Optional[List[Dict]] = None,
        tool_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute an agent workflow using LangGraph.

        Args:
            agent_model: SQLAlchemy Agent model instance
            user_input: User input data
            conversation_history: Optional conversation history
            tool_config: Optional configuration for tools

        Returns:
            Dictionary containing:
                - content: Final agent response
                - tool_results: Dictionary of tool execution results
                - messages: Full conversation messages
                - error: Error message if execution failed
        """
        try:
            # Get enabled tools from agent configuration
            enabled_tools = []

            if agent_model.tools_enabled and agent_model.tools:
                for tool_name, enabled in agent_model.tools.items():
                    if not enabled:
                        continue

                    # Map frontend tool names to backend tool IDs
                    # Add your tool mappings here when you register new tools
                    # Example:
                    # tool_id_map = {
                    #     "slackMessenger": "slack_messenger",
                    #     "jiraTicket": "jira_ticket",
                    # }
                    tool_id_map: Dict[str, str] = {}

                    tool_id = tool_id_map.get(tool_name, tool_name)

                    # Get tool class and instantiate
                    tool_class = self.registry.get_tool_class(tool_id)
                    if tool_class:
                        # Instantiate with config
                        config = tool_config.get(tool_name, {}) if tool_config else {}
                        mcp_tool = tool_class(config=config)

                        # Convert to LangChain format
                        lc_tool = self._mcp_tool_to_langchain(mcp_tool)
                        enabled_tools.append(lc_tool)

            # Build initial state
            initial_state = build_initial_state(
                agent_model=agent_model,
                user_input=user_input,
                conversation_history=conversation_history
            )

            # Create and run agent graph
            graph = create_agent_graph(agent_model, enabled_tools)
            final_state = await graph.ainvoke(initial_state)

            # Extract results
            return {
                "content": final_state.get("final_output", ""),
                "tool_results": final_state.get("tool_results", {}),
                "messages": [
                    {
                        "role": "assistant" if hasattr(msg, "content") and not isinstance(msg, HumanMessage) else "user",
                        "content": getattr(msg, "content", "")
                    }
                    for msg in final_state.get("messages", [])
                ],
                "error": final_state.get("error"),
                "processing_mode": "langgraph"
            }

        except Exception as e:
            return {
                "content": "",
                "tool_results": {},
                "messages": [],
                "error": f"Agent execution failed: {str(e)}",
                "processing_mode": "langgraph"
            }

    def get_available_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of all available tools in the registry.

        Returns:
            List of tool metadata dictionaries
        """
        tools = []
        for tool_metadata in self.registry.list_tools():
            tools.append({
                "id": tool_metadata.id,
                "name": tool_metadata.name,
                "description": tool_metadata.description,
                "category": tool_metadata.category,
                "parameters": [
                    {
                        "name": p.name,
                        "type": p.type,
                        "description": p.description,
                        "required": p.required
                    }
                    for p in tool_metadata.parameters
                ]
            })
        return tools
