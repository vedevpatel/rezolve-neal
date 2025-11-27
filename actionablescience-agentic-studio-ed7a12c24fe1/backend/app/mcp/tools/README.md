# MCP Tools Development Guide

This directory is where you implement your custom MCP (Model Context Protocol) tools that agents can use.

## Overview

The MCP framework in this application provides a standardized way to create tools that AI agents can execute. Each tool is a Python class that inherits from `BaseTool` and implements the `execute` method.

## Quick Start

### 1. Create a New Tool

Create a new Python file in this directory (e.g., `my_custom_tool.py`):

```python
from typing import Any, Dict
from app.mcp.base_tool import BaseTool, ToolMetadata, ToolParameter, ToolExecutionResult

class MyCustomTool(BaseTool):
    """
    A custom tool that does something useful.
    """

    def __init__(self, config: Dict[str, Any] = None):
        metadata = ToolMetadata(
            name="my_custom_tool",
            description="Brief description of what this tool does",
            version="1.0.0",
            author="Your Name",
            parameters=[
                ToolParameter(
                    name="input_param",
                    type="string",
                    description="Description of the parameter",
                    required=True
                ),
                ToolParameter(
                    name="optional_param",
                    type="number",
                    description="An optional parameter",
                    required=False,
                    default=10
                )
            ]
        )
        super().__init__(metadata, config)

    def execute(self, **kwargs) -> ToolExecutionResult:
        """
        Execute the tool with the provided parameters.

        Args:
            **kwargs: Tool parameters defined in metadata

        Returns:
            ToolExecutionResult with success status and output data
        """
        try:
            # Extract parameters
            input_param = kwargs.get('input_param')
            optional_param = kwargs.get('optional_param', 10)

            # Perform tool logic here
            result = f"Processed {input_param} with value {optional_param}"

            return ToolExecutionResult(
                success=True,
                output={"result": result, "status": "completed"},
                error=None
            )
        except Exception as e:
            return ToolExecutionResult(
                success=False,
                output=None,
                error=str(e)
            )
```

### 2. Register Your Tool

Add your tool to `__init__.py` in this directory:

```python
from app.mcp.registry import get_tool_registry
from .my_custom_tool import MyCustomTool

# Register the tool when the module is imported
registry = get_tool_registry()
registry.register_tool("my_custom_tool", MyCustomTool)
```

### 3. Use Your Tool

Your tool is now automatically available:
- Through the API at `/api/v1/tools/`
- In agent configurations (Step 2 of agent builder)
- In workflow executions via LangGraph

## Tool Components

### ToolMetadata

Defines the tool's identity and interface:

```python
ToolMetadata(
    name="tool_name",           # Unique identifier
    description="What it does",  # Used by LLM to understand the tool
    version="1.0.0",             # Version tracking
    author="Your Name",          # Tool creator
    parameters=[...]             # List of ToolParameter objects
)
```

### ToolParameter

Defines input parameters:

```python
ToolParameter(
    name="param_name",
    type="string",              # "string", "number", "boolean", "array", "object"
    description="What this parameter does",
    required=True,              # Is this parameter mandatory?
    default=None,               # Default value if not provided
    enum=["option1", "option2"] # Optional: restrict to specific values
)
```

### ToolExecutionResult

Return value from tool execution:

```python
ToolExecutionResult(
    success=True,               # Did the tool execute successfully?
    output={"key": "value"},    # Result data (any JSON-serializable object)
    error=None                  # Error message if success=False
)
```

## Best Practices

### 1. Error Handling

Always wrap your tool logic in try-except blocks:

```python
def execute(self, **kwargs) -> ToolExecutionResult:
    try:
        # Your tool logic
        return ToolExecutionResult(success=True, output=result, error=None)
    except Exception as e:
        return ToolExecutionResult(success=False, output=None, error=str(e))
```

### 2. Configuration

Use the `config` parameter for API keys, endpoints, etc.:

```python
def __init__(self, config: Dict[str, Any] = None):
    super().__init__(metadata, config)
    self.api_key = config.get('api_key') if config else None
```

Configuration can be passed when registering the tool or set in agent configurations.

### 3. Parameter Validation

Let the framework handle parameter validation, but add custom validation if needed:

```python
def execute(self, **kwargs) -> ToolExecutionResult:
    email = kwargs.get('email')
    if not self._is_valid_email(email):
        return ToolExecutionResult(
            success=False,
            output=None,
            error="Invalid email format"
        )
```

### 4. Descriptive Metadata

Write clear descriptions - the LLM uses these to decide when to use your tool:

```python
ToolMetadata(
    name="send_email",
    description="Sends an email to a recipient with a subject and body. Use this when the user asks to send an email or notify someone.",
    # ...
)
```

### 5. Structured Output

Return structured data that's easy to parse:

```python
return ToolExecutionResult(
    success=True,
    output={
        "status": "sent",
        "message_id": "12345",
        "timestamp": "2024-01-01T00:00:00Z",
        "recipient": email
    },
    error=None
)
```

## Tool Examples

### Simple Tool: Text Transformer

```python
class UpperCaseTool(BaseTool):
    def __init__(self, config: Dict[str, Any] = None):
        metadata = ToolMetadata(
            name="uppercase",
            description="Converts text to uppercase",
            version="1.0.0",
            parameters=[
                ToolParameter(
                    name="text",
                    type="string",
                    description="Text to convert",
                    required=True
                )
            ]
        )
        super().__init__(metadata, config)

    def execute(self, **kwargs) -> ToolExecutionResult:
        try:
            text = kwargs.get('text', '')
            return ToolExecutionResult(
                success=True,
                output={"result": text.upper()},
                error=None
            )
        except Exception as e:
            return ToolExecutionResult(success=False, output=None, error=str(e))
```

### API Integration Tool

```python
import requests

class WeatherTool(BaseTool):
    def __init__(self, config: Dict[str, Any] = None):
        metadata = ToolMetadata(
            name="get_weather",
            description="Gets current weather for a city",
            version="1.0.0",
            parameters=[
                ToolParameter(
                    name="city",
                    type="string",
                    description="City name",
                    required=True
                )
            ]
        )
        super().__init__(metadata, config)
        self.api_key = config.get('api_key') if config else None

    def execute(self, **kwargs) -> ToolExecutionResult:
        try:
            city = kwargs.get('city')
            response = requests.get(
                f"https://api.weather.com/v1/current?city={city}&key={self.api_key}"
            )
            response.raise_for_status()
            return ToolExecutionResult(
                success=True,
                output=response.json(),
                error=None
            )
        except Exception as e:
            return ToolExecutionResult(success=False, output=None, error=str(e))
```

## Advanced Features

### Tool Discovery

Tools are automatically discovered through the registry:

```python
from app.mcp.registry import get_tool_registry

registry = get_tool_registry()
all_tools = registry.list_tools()  # Returns list of tool metadata
```

### OpenAI Function Calling Format

Tools automatically convert to OpenAI function calling format:

```python
tool = MyCustomTool()
openai_format = tool.to_openai_function()
# Returns: {"name": "...", "description": "...", "parameters": {...}}
```

### Tool Execution via API

Tools can be executed directly via REST API:

```bash
POST /api/v1/tools/execute
{
  "tool_id": "my_custom_tool",
  "parameters": {
    "input_param": "value",
    "optional_param": 20
  }
}
```

### Tool Configuration in Agents

Agents can enable/disable tools and provide configuration in Step 2 of the agent builder:

```json
{
  "enabled_tools": ["my_custom_tool", "another_tool"],
  "tool_configs": {
    "my_custom_tool": {
      "api_key": "...",
      "timeout": 30
    }
  }
}
```

## Testing Your Tools

Create a simple test script:

```python
from app.mcp.tools.my_custom_tool import MyCustomTool

# Initialize tool
tool = MyCustomTool(config={"api_key": "test_key"})

# Test execution
result = tool.execute(input_param="test", optional_param=15)

print(f"Success: {result.success}")
print(f"Output: {result.output}")
print(f"Error: {result.error}")
```

## Additional Resources

- **Base Tool Implementation**: `app/mcp/base_tool.py`
- **Tool Registry**: `app/mcp/registry.py`
- **Tool Executor**: `app/mcp/executor.py`
- **LangGraph Integration**: `app/langgraph/executor.py`
- **API Routes**: `app/routes/tools.py`

## Need Help?

- Check existing tool implementations in this directory
- Review the base tool class for available methods
- Examine how tools are registered in `__init__.py`
- Look at LangGraph executor to see how tools are invoked by agents

Happy tool building!
