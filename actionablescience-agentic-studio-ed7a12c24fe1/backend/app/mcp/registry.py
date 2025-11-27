"""
Tool Registry

Registry for discovering, registering, and managing all available tools.
"""

from typing import Dict, List, Optional, Type
from .base_tool import BaseTool, ToolMetadata, ToolExecutionResult


class ToolRegistry:
    """
    Singleton registry for all MCP tools.

    Provides methods to register, discover, and instantiate tools.
    """

    _instance: Optional["ToolRegistry"] = None
    _tools: Dict[str, Type[BaseTool]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._tools = {}
        return cls._instance

    def register(self, tool_class: Type[BaseTool]) -> None:
        """
        Register a tool class in the registry.

        Args:
            tool_class: Class inheriting from BaseTool

        Raises:
            ValueError: If tool with same ID already registered
        """
        temp_instance = tool_class()
        metadata = temp_instance.get_metadata()

        if metadata.id in self._tools:
            raise ValueError(f"Tool with ID '{metadata.id}' already registered")

        self._tools[metadata.id] = tool_class
        print(f"✓ Registered tool: {metadata.id} ({metadata.name})")



    def unregister(self, tool_id: str) -> None:
        """
        Unregister a tool from the registry.

        Args:
            tool_id: ID of tool to unregister
        """
        if tool_id in self._tools:
            del self._tools[tool_id]
            print(f"✓ Unregistered tool: {tool_id}")



    def get_tool_class(self, tool_id: str) -> Optional[Type[BaseTool]]:
        """
        Get tool class by ID.

        Args:
            tool_id: Tool identifier

        Returns:
            Tool class if found, None otherwise
        """
        return self._tools.get(tool_id)
    



    def instantiate_tool(self, tool_id: str, config: Optional[Dict] = None) -> Optional[BaseTool]:
        """
        Creates an instance of a tool with given configuration.

        Args:
            tool_id: Tool identifier
            config: Tool-specific configuration

        Returns:
            Tool instance if found, None otherwise
        """
        tool_class = self.get_tool_class(tool_id)
        if tool_class:
            return tool_class(config=config)
        return None
    
    
    
    async def execute_tool(self, tool_id: str, config: Optional[Dict] = None, **kwargs) -> ToolExecutionResult:
        """
        Execute a tool by ID with given parameters.

        Args:
            tool_id: Tool identifier
            config: Tool-specific configuration
            kwargs: Parameters to pass to tool's execute method

        Returns:
            ToolExecutionResult from tool execution

        Raises:
            ValueError: If tool not found
        """

        # Load config if not provided
        if config is None:
            import os
            config = {
                "FIRECRAWL_API_KEY": os.getenv("FIRECRAWL_API_KEY")
            }

        # Get the tool instance
        tool_instance = self.instantiate_tool(tool_id, config=config)
        if not tool_instance:
            raise ValueError(f"Tool with ID '{tool_id}' not found")
        
        result = await tool_instance.execute(**kwargs)
        
        return result



    def list_tools(self, category: Optional[str] = None, enabled_only: bool = True) -> List[ToolMetadata]:
        """
        List all registered tools with their metadata.

        Args:
            category: Filter by category (itsm, crm, etc)
            enabled_only: Only return enabled tools

        Returns:
            List of ToolMetadata objects
        """
        metadata_list = []

        for tool_id, tool_class in self._tools.items():
            temp_instance = tool_class()
            metadata = temp_instance.get_metadata()

            # Apply filters
            if enabled_only and not metadata.is_enabled:
                continue

            if category and metadata.category != category:
                continue

            metadata_list.append(metadata)

        return metadata_list

    def get_tool_metadata(self, tool_id: str) -> Optional[ToolMetadata]:
        """
        Get metadata for a specific tool.

        Args:
            tool_id: Tool identifier

        Returns:
            ToolMetadata if found, None otherwise
        """
        tool_class = self.get_tool_class(tool_id)
        if tool_class:
            temp_instance = tool_class()
            return temp_instance.get_metadata()
        return None
    

    def get_openai_tools(self, tool_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Get tools formatted for OpenAI Assistants API.

        Args:
            tool_ids: List of tool IDs to include (None = all tools)

        Returns:
            List of tool definitions in OpenAI format
        """
        openai_tools = []

        if tool_ids:
            # Get specific tools
            for tool_id in tool_ids:
                tool_class = self.get_tool_class(tool_id)
                if tool_class:
                    temp_instance = tool_class()
                    openai_tools.append(temp_instance.to_openai_tool())
        else:
            # Get all enabled tools
            for tool_id, tool_class in self._tools.items():
                temp_instance = tool_class()
                metadata = temp_instance.get_metadata()
                if metadata.is_enabled:
                    openai_tools.append(temp_instance.to_openai_tool())

        return openai_tools

    def clear(self) -> None:
        """Clear all registered tools (useful for testing)"""
        self._tools.clear()

    def __len__(self) -> int:
        """Return number of registered tools"""
        return len(self._tools)

    def __contains__(self, tool_id: str) -> bool:
        """Check if tool is registered"""
        return tool_id in self._tools


# Global registry instance
registry = ToolRegistry()
