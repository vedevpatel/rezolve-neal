"""
Multi-Agent Workflow Executor

Orchestrates execution of multiple agents in a workflow using LangGraph.
Handles sequential and parallel agent execution based on workflow definition.
"""

from typing import Dict, Any, List, Optional, Annotated, Sequence
from sqlalchemy.orm import Session

try:
    from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
    from langgraph.graph import StateGraph, END
    from typing_extensions import TypedDict
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    BaseMessage = None  # type: ignore
    HumanMessage = None  # type: ignore
    AIMessage = None  # type: ignore
    StateGraph = None  # type: ignore
    END = None  # type: ignore
    TypedDict = None  # type: ignore


def add_messages(existing: Sequence[BaseMessage], new: Sequence[BaseMessage]) -> List[BaseMessage]:
    """Reducer function for message list"""
    return list(existing) + list(new)


class MultiAgentWorkflowState(TypedDict):
    """
    State for multi-agent workflow execution.
    Tracks data flow between agents.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    initial_input: Dict[str, Any]
    node_results: Dict[str, Any]  # Stores output from each agent node
    current_node_id: Optional[str]
    final_output: Optional[Any]
    error: Optional[str]


class MultiAgentWorkflowExecutor:
    """
    Executes multi-agent workflows using LangGraph.

    Takes a workflow definition (nodes + edges) and orchestrates
    execution of multiple agents, passing data between them.
    """

    def __init__(self, db: Session):
        self.db = db

    async def execute_workflow(
        self,
        workflow,  # MultiAgentWorkflow model
        execution,  # MultiAgentWorkflowExecution model
        input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a multi-agent workflow.

        Args:
            workflow: MultiAgentWorkflow model instance
            execution: MultiAgentWorkflowExecution model instance
            input_data: Initial input data for the workflow

        Returns:
            Dictionary containing:
                - output_data: Final workflow output
                - node_results: Results from each agent node
        """
        if not LANGCHAIN_AVAILABLE:
            raise RuntimeError("LangChain not installed. Run: pip install -r requirements.txt")

        # Parse workflow definition
        workflow_def = workflow.workflow_definition
        nodes = workflow_def.get("nodes", [])
        edges = workflow_def.get("edges", [])

        if not nodes:
            raise ValueError("Workflow has no nodes defined")

        # Build and execute the workflow graph
        graph = self._build_workflow_graph(nodes, edges)

        # Initialize state
        initial_state = {
            "messages": [],
            "initial_input": input_data,
            "node_results": {},
            "current_node_id": None,
            "final_output": None,
            "error": None
        }

        # Execute the workflow
        try:
            final_state = await graph.ainvoke(initial_state)

            return {
                "output_data": final_state.get("final_output"),
                "node_results": final_state.get("node_results", {})
            }

        except Exception as e:
            raise Exception(f"Workflow execution failed: {str(e)}")

    def _build_workflow_graph(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]]
    ):
        """
        Build a LangGraph StateGraph from workflow definition.

        Args:
            nodes: List of workflow nodes with agent_id
            edges: List of workflow edges defining connections

        Returns:
            Compiled LangGraph StateGraph
        """
        from ..models import Agent
        from .executor import LangGraphExecutor

        # Create graph
        graph = StateGraph(MultiAgentWorkflowState)

        # Create executor for running individual agents
        agent_executor = LangGraphExecutor()

        # Add nodes to graph
        for node in nodes:
            node_id = node["id"]
            agent_id = node["agent_id"]

            # Create async function for this agent node
            async def create_agent_node(node_id=node_id, agent_id=agent_id):
                async def agent_node(state: MultiAgentWorkflowState) -> Dict[str, Any]:
                    """Execute a single agent within the workflow"""
                    try:
                        # Get agent from database
                        agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
                        if not agent:
                            return {
                                "error": f"Agent {agent_id} not found",
                                "node_results": {
                                    **state["node_results"],
                                    node_id: {"error": f"Agent {agent_id} not found"}
                                }
                            }

                        # Prepare input for this agent
                        # Use output from previous node or initial input
                        agent_input = self._prepare_agent_input(state, node_id, edges)

                        # Execute the agent
                        result = await agent_executor.execute_agent(
                            agent_model=agent,
                            user_input=agent_input,
                            conversation_history=None,
                            tool_config=None
                        )

                        # Store result for this node
                        node_results = state["node_results"].copy()
                        node_results[node_id] = {
                            "agent_id": agent_id,
                            "agent_name": agent.agent_name,
                            "output": result.get("content"),
                            "tool_results": result.get("tool_results", {}),
                            "error": result.get("error")
                        }

                        # Create message for this agent's output
                        new_message = AIMessage(content=result.get("content", ""))

                        return {
                            "messages": [new_message],
                            "node_results": node_results,
                            "current_node_id": node_id,
                            "final_output": result.get("content")  # Last agent output becomes final
                        }

                    except Exception as e:
                        node_results = state["node_results"].copy()
                        node_results[node_id] = {
                            "agent_id": agent_id,
                            "error": str(e)
                        }
                        return {
                            "error": str(e),
                            "node_results": node_results
                        }

                return agent_node

            # Add node to graph
            graph.add_node(node_id, await create_agent_node())

        # Add edges to graph
        if not edges:
            # No edges defined - create simple sequential flow
            for i in range(len(nodes) - 1):
                graph.add_edge(nodes[i]["id"], nodes[i + 1]["id"])
            # Last node goes to END
            graph.add_edge(nodes[-1]["id"], END)
        else:
            # Use defined edges
            for edge in edges:
                source = edge["source"]
                target = edge["target"]
                graph.add_edge(source, target)

            # Find nodes with no outgoing edges and connect them to END
            source_nodes = {edge["source"] for edge in edges}
            target_nodes = {edge["target"] for edge in edges}
            all_node_ids = {node["id"] for node in nodes}
            terminal_nodes = all_node_ids - source_nodes

            for terminal_node in terminal_nodes:
                graph.add_edge(terminal_node, END)

        # Set entry point to first node
        if nodes:
            graph.set_entry_point(nodes[0]["id"])

        # Compile and return
        return graph.compile()

    def _prepare_agent_input(
        self,
        state: MultiAgentWorkflowState,
        current_node_id: str,
        edges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Prepare input for an agent based on previous node outputs.

        For now, uses simple strategy:
        - If this is the first node, use initial_input
        - Otherwise, find the previous node and use its output

        Args:
            state: Current workflow state
            current_node_id: ID of the node being executed
            edges: List of workflow edges

        Returns:
            Dictionary of input data for the agent
        """
        # Find incoming edges to this node
        incoming_edges = [e for e in edges if e["target"] == current_node_id]

        if not incoming_edges:
            # This is an entry node - use initial input
            return state["initial_input"]

        # Get the previous node's output
        # For simplicity, if multiple incoming edges, use the first one
        previous_node_id = incoming_edges[0]["source"]
        previous_result = state["node_results"].get(previous_node_id)

        if previous_result and "output" in previous_result:
            # Pass previous output as input to this agent
            return {
                "message": previous_result["output"],
                "previous_agent": previous_result.get("agent_name"),
                "context": state["initial_input"]  # Keep original context available
            }
        else:
            # Fallback to initial input
            return state["initial_input"]
