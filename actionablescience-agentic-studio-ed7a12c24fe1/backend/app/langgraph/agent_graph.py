"""
LangGraph Agent State Graph

Defines the agent execution flow using LangGraph's StateGraph.
This provides structured state management and tool orchestration.
"""

from typing import TypedDict, Annotated, Sequence, Any, Dict, List, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
import operator


class AgentState(TypedDict):
    """
    State for the agent execution graph.

    Attributes:
        messages: Conversation history with message append semantics
        agent_config: Configuration from the Agent model (temperature, max_tokens, etc.)
        tool_results: Dictionary storing raw tool execution results
        user_input: Original user input data
        final_output: Processed final response
        error: Any error that occurred during execution
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    agent_config: Dict[str, Any]
    tool_results: Dict[str, Any]
    user_input: Dict[str, Any]
    final_output: Optional[str]
    error: Optional[str]


def create_agent_graph(agent_model, available_tools: List[Any]):
    """
    Create a LangGraph StateGraph for agent execution.

    Args:
        agent_model: SQLAlchemy Agent model instance with configuration
        available_tools: List of LangChain-compatible tool instances

    Returns:
        Compiled StateGraph ready for execution
    """

    # Initialize LLM with agent configuration
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=agent_model.temperature,
        max_tokens=agent_model.max_tokens,
    )

    # Bind tools to LLM if available
    if available_tools:
        llm_with_tools = llm.bind_tools(available_tools)
    else:
        llm_with_tools = llm

    # Define the agent node
    def agent_node(state: AgentState) -> AgentState:
        """
        Main agent node - invokes LLM with current state.
        """
        try:
            response = llm_with_tools.invoke(state["messages"])
            return {
                "messages": [response],
            }
        except Exception as e:
            return {
                "error": f"Agent execution error: {str(e)}"
            }

    # Define tool execution node
    def tool_node(state: AgentState) -> AgentState:
        """
        Tool execution node - processes tool calls from LLM.
        """
        try:
            last_message = state["messages"][-1]

            # Extract tool results for storage
            tool_results = {}
            if hasattr(last_message, "tool_calls") and last_message.tool_calls:
                for tool_call in last_message.tool_calls:
                    tool_name = tool_call.get("name")
                    if tool_name:
                        # Store tool call info
                        tool_results[tool_name] = {
                            "args": tool_call.get("args", {}),
                            "id": tool_call.get("id"),
                        }

            return {
                "tool_results": {**state.get("tool_results", {}), **tool_results}
            }
        except Exception as e:
            return {
                "error": f"Tool execution error: {str(e)}"
            }

    # Define output processing node
    def output_node(state: AgentState) -> AgentState:
        """
        Final output processing node.
        Extracts the final response from messages.
        """
        try:
            last_message = state["messages"][-1]
            content = getattr(last_message, "content", "")

            return {
                "final_output": content
            }
        except Exception as e:
            return {
                "error": f"Output processing error: {str(e)}"
            }

    # Define routing logic
    def should_continue(state: AgentState) -> str:
        """
        Determines whether to continue to tools or end.

        Returns:
            "tools" if the last message has tool calls
            "output" if no tool calls (ready to finalize)
        """
        # Check for errors
        if state.get("error"):
            return "output"

        messages = state.get("messages", [])
        if not messages:
            return "output"

        last_message = messages[-1]

        # If there are tool calls, route to tools
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"

        # Otherwise, we're done
        return "output"

    # Build the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    workflow.add_node("output", output_node)

    # Set entry point
    workflow.set_entry_point("agent")

    # Add conditional edges
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "output": "output",
        }
    )

    # After tools, go back to agent for next iteration
    workflow.add_edge("tools", "agent")

    # After output, end
    workflow.add_edge("output", END)

    # Compile and return
    return workflow.compile()


def build_initial_state(
    agent_model,
    user_input: Dict[str, Any],
    conversation_history: Optional[List[Dict]] = None
) -> AgentState:
    """
    Build the initial state for agent execution.

    Args:
        agent_model: SQLAlchemy Agent model instance
        user_input: User input data
        conversation_history: Optional previous conversation messages

    Returns:
        Initial AgentState ready for graph execution
    """
    messages = []

    # Add system prompt
    if agent_model.system_prompt:
        from langchain_core.messages import SystemMessage
        messages.append(SystemMessage(content=agent_model.system_prompt))

    # Add conversation history if memory is enabled
    if agent_model.memory_enabled and conversation_history:
        for msg in conversation_history:
            role = msg.get("role")
            content = msg.get("content", "")

            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    # Add current user message
    # Render user prompt template with input data
    user_prompt = agent_model.user_prompt_template
    try:
        # Simple template rendering - replace {key} with values
        for key, value in user_input.items():
            placeholder = f"{{{key}}}"
            if placeholder in user_prompt:
                user_prompt = user_prompt.replace(placeholder, str(value))
    except Exception:
        # If template rendering fails, use raw input
        user_prompt = str(user_input)

    messages.append(HumanMessage(content=user_prompt))

    # Build agent config
    agent_config = {
        "temperature": agent_model.temperature,
        "max_tokens": agent_model.max_tokens,
        "memory_enabled": agent_model.memory_enabled,
    }

    return AgentState(
        messages=messages,
        agent_config=agent_config,
        tool_results={},
        user_input=user_input,
        final_output=None,
        error=None,
    )
