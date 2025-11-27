"""
Tool Executor

Handles execution of tools with error handling, logging, and metrics.
"""

import time
import logging
from typing import Any, Dict, Optional, Union, List, cast
from .base_tool import ToolExecutionResult
from .registry import ToolRegistry

logger = logging.getLogger(__name__)


class ToolExecutor:
    """
    Executes tools with proper error handling and metrics collection.
    """

    def __init__(self, registry: Optional[ToolRegistry] = None):
        """
        Initialize executor with tool registry.

        Args:
            registry: ToolRegistry instance (uses global if not provided)
        """
        self.registry = registry or ToolRegistry()

    async def execute_tool(
        self,
        tool_id: str,
        parameters: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None
    ) -> ToolExecutionResult:
        """
        Execute a tool by ID with given parameters.

        Args:
            tool_id: Tool identifier
            parameters: Tool execution parameters
            config: Tool configuration (API keys, endpoints, etc)

        Returns:
            ToolExecutionResult with success/failure and data/error
        """
        start_time = time.time()

        try:
            # Get tool instance
            tool = self.registry.instantiate_tool(tool_id, config)
            if not tool:
                logger.error(f"Tool not found: {tool_id}")
                return ToolExecutionResult(
                    success=False,
                    error=f"Tool '{tool_id}' not found in registry"
                )

            # Validate parameters
            try:
                await tool.validate_parameters(**parameters)
            except ValueError as e:
                logger.error(f"Parameter validation failed for {tool_id}: {str(e)}")
                return ToolExecutionResult(
                    success=False,
                    error=f"Invalid parameters: {str(e)}"
                )

            # Execute tool
            logger.info(f"Executing tool: {tool_id} with params: {parameters}")
            result = await tool.execute(**parameters)

            # Add execution metadata
            execution_time = time.time() - start_time
            if result.metadata is None:
                result.metadata = {}
            result.metadata["execution_time_ms"] = round(execution_time * 1000, 2)
            result.metadata["tool_id"] = tool_id

            logger.info(f"Tool {tool_id} executed successfully in {execution_time:.2f}s")
            return result

        except Exception as e:
            execution_time = time.time() - start_time
            logger.exception(f"Error executing tool {tool_id}: {str(e)}")
            return ToolExecutionResult(
                success=False,
                error=f"Execution error: {str(e)}",
                metadata={
                    "execution_time_ms": round(execution_time * 1000, 2),
                    "tool_id": tool_id,
                    "error_type": type(e).__name__
                }
            )

    async def execute_openai_tool_call(
        self,
        tool_call: Dict[str, Any],
        tool_configs: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> ToolExecutionResult:
        """
        Execute a tool call from OpenAI Assistants API.

        Args:
            tool_call: Tool call object from OpenAI
                      Format: {"id": "call_123", "type": "function", "function": {"name": "tool_id", "arguments": "{...}"}}
            tool_configs: Dictionary mapping tool_id -> config

        Returns:
            ToolExecutionResult
        """
        import json

        try:
            # Parse OpenAI tool call format
            if tool_call.get("type") != "function":
                return ToolExecutionResult(
                    success=False,
                    error=f"Unsupported tool call type: {tool_call.get('type')}"
                )

            function = tool_call.get("function", {})
            tool_id = function.get("name")
            arguments_str = function.get("arguments", "{}")

            # Parse arguments JSON
            try:
                parameters = json.loads(arguments_str)
            except json.JSONDecodeError as e:
                return ToolExecutionResult(
                    success=False,
                    error=f"Invalid arguments JSON: {str(e)}"
                )

            # Get tool config if provided
            config = None
            if tool_configs and tool_id in tool_configs:
                config = tool_configs[tool_id]

            # Execute tool
            result = await self.execute_tool(tool_id, parameters, config)

            # Add OpenAI-specific metadata
            if result.metadata is None:
                result.metadata = {}
            result.metadata["tool_call_id"] = tool_call.get("id")

            return result

        except Exception as e:
            logger.exception(f"Error processing OpenAI tool call: {str(e)}")
            return ToolExecutionResult(
                success=False,
                error=f"Tool call processing error: {str(e)}",
                metadata={"error_type": type(e).__name__}
            )

    async def batch_execute(
        self,
        tool_calls: list[Dict[str, Any]],
        tool_configs: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> list[ToolExecutionResult]:
        """
        Execute multiple tools in parallel.

        Args:
            tool_calls: List of tool calls
            tool_configs: Dictionary mapping tool_id -> config

        Returns:
            List of ToolExecutionResults in same order as input
        """
        import asyncio

        tasks = [
            self.execute_tool(
                tool_call["tool_id"],
                tool_call["parameters"],
                tool_configs.get(tool_call["tool_id"]) if tool_configs else None
            )
            for tool_call in tool_calls
        ]

        results: List[Union[ToolExecutionResult, BaseException]] = await asyncio.gather(
            *tasks, return_exceptions=True
        )

        formatted_results: List[ToolExecutionResult] = []
        for result in results:
            if isinstance(result, Exception):
                formatted_results.append(
                    ToolExecutionResult(
                        success=False,
                        error=f"Execution error: {str(result)}",
                        metadata={"error_type": type(result).__name__}
                    )
                )
            else:
                formatted_results.append(cast(ToolExecutionResult, result))

        return formatted_results
