"""
LLM Service for processing agent workflows with LangGraph orchestration.
Provides a clean interface for executing agents with integrated tool calling.
"""
import os
from typing import Dict, Any, List, Optional
from ..langgraph import LangGraphExecutor
from ..models import Agent


class LLMService:
    """
    Service for LLM-powered agent execution using LangGraph.

    This service provides a high-level interface for executing agents
    with automatic tool orchestration, state management, and conversation flow.
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize LLM service with LangGraph executor."""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")

        # Set API key for LangChain/OpenAI
        os.environ["OPENAI_API_KEY"] = self.api_key

        self.executor = LangGraphExecutor()

    async def execute_agent_workflow(
        self,
        agent: Agent,
        user_input: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Execute an agent workflow using LangGraph.

        Args:
            agent: The Agent model instance with configuration
            user_input: User's input data
            conversation_history: Optional conversation history for context

        Returns:
            Dict containing:
                - content: Final agent response
                - tool_results: Dictionary of tool execution results
                - messages: Full conversation messages
                - error: Error message if execution failed
                - processing_mode: Always "langgraph"
        """
        # Prepare tool configuration
        tool_config = self._build_tool_config(agent)

        # Execute agent using LangGraph
        result = await self.executor.execute_agent(
            agent_model=agent,
            user_input=user_input,
            conversation_history=conversation_history,
            tool_config=tool_config
        )

        return result

    def _build_tool_config(self, agent: Agent) -> Dict[str, Any]:
        """
        Build tool configuration from agent settings and environment.

        Args:
            agent: Agent model instance

        Returns:
            Dictionary of tool configurations
        """
        tool_config = {}

        # Extract web scraper config if available
        if agent.web_scraper_config:
            tool_config["webScraper"] = agent.web_scraper_config

        # Add any other tool-specific configs here as needed

        return tool_config

    def get_available_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of all available tools in the registry.

        Returns:
            List of tool metadata dictionaries
        """
        return self.executor.get_available_tools()
