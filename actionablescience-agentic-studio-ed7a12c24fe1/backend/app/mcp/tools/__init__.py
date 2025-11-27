"""
MCP Tools/Connectors

This package is where you implement custom tools that agents can use.

## How to Add a Tool

1. Create a new Python file in this directory (e.g., `my_tool.py`)
2. Implement your tool by extending the `BaseTool` class
3. Import and register your tool in this file

Example:
    from app.mcp.registry import get_tool_registry
    from .my_tool import MyCustomTool

    registry = get_tool_registry()
    registry.register_tool("my_custom_tool", MyCustomTool)

## Tool Framework

All tools must:
- Inherit from `app.mcp.base_tool.BaseTool`
- Implement the `execute(**kwargs)` method
- Define `ToolMetadata` with name, description, and parameters
- Return `ToolExecutionResult` with success, output, and error fields

## Documentation

See README.md in this directory for a complete guide on creating MCP tools.

## Example Tools

No example tools are included in this scaffolding. Implement your own tools
based on your application's needs. Common tool types include:
- API integrations (REST, GraphQL)
- Data processors (CSV, JSON, XML)
- External services (email, SMS, webhooks)
- Database operations
- File operations
- Web scraping/crawling

"""

__all__ = []

# Import and register your tools here
# Example:
# from app.mcp.registry import get_tool_registry
# from .example_tool import ExampleTool
#
# registry = get_tool_registry()
# registry.register_tool("example_tool", ExampleTool)
