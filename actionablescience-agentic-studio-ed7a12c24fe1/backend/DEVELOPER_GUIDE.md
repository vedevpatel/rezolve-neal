# Developer Guide: MCP Tools in Rezolve

Quick guide for adding custom MCP tools to the Rezolve backend.

## Quick Start

**Prerequisites:** Python 3.10+, dependencies installed (`pip install -r requirements.txt`)

**Steps:**
1. Create tool file in `app/mcp/tools/`
2. Extend `BaseTool`, implement `get_metadata()` and `execute()`
3. Register in `app/main.py` startup event
4. Test via `/api/v1/tools/execute`

## Architecture

```
User → API → LLMService → LangGraph → MCP Tool → Result
```

**Key Components:**
- **BaseTool**: Abstract base for all tools
- **ToolRegistry**: Tool registration and discovery
- **LangGraphExecutor**: Bridges tools with LangGraph state machines


## Creating a Tool

### 1. Create Tool File (`app/mcp/tools/slack_tool.py`)

```python
from typing import Dict, Any, Optional
from ..base_tool import BaseTool, ToolMetadata, ToolParameter, ToolExecutionResult
import httpx

class SlackTool(BaseTool):
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.webhook_url = config.get("SLACK_WEBHOOK_URL") if config else None

    def get_metadata(self) -> ToolMetadata:
        return ToolMetadata(
            id="slack_messenger",
            name="Slack Messenger",
            description="Send messages to Slack channels",
            version="1.0.0",
            category="productivity",
            tags=["slack", "messaging"],
            parameters=[
                ToolParameter(
                    name="message",
                    type="string",
                    description="Message to send",
                    required=True
                ),
                ToolParameter(
                    name="channel",
                    type="string",
                    description="Slack channel",
                    required=False,
                    default="#general"
                )
            ],
            requires_auth=True,
            auth_type="webhook",
            is_enabled=True
        )

    async def execute(self, **kwargs) -> ToolExecutionResult:
        try:
            if not await self.validate_parameters(**kwargs):
                return ToolExecutionResult(success=False, error="Invalid parameters")

            message = kwargs.get("message")
            channel = kwargs.get("channel", "#general")

            if not self.webhook_url:
                return ToolExecutionResult(success=False, error="SLACK_WEBHOOK_URL not configured")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json={"channel": channel, "text": message},
                    timeout=30.0
                )

                if response.status_code == 200:
                    return ToolExecutionResult(
                        success=True,
                        data={"message": "Sent", "channel": channel}
                    )
                else:
                    return ToolExecutionResult(
                        success=False,
                        error=f"Slack error: {response.status_code}"
                    )

        except Exception as e:
            return ToolExecutionResult(success=False, error=str(e))
```

### 2. Register Tool (`app/main.py`)

```python
@app.on_event("startup")
def startup_event():
    registry = ToolRegistry()
    from .mcp.tools.slack_tool import SlackTool
    registry.register(SlackTool)
```

### 3. Frontend Mapping (if needed in `app/langgraph/executor.py`)

```python
tool_id_map = {
    "slackMessenger": "slack_messenger",
}
```

## Tool Structure

**Required Methods:**
- `get_metadata()` → Returns `ToolMetadata` (id, name, description, parameters)
- `execute(**kwargs)` → Returns `ToolExecutionResult` (success, data/error)

**ToolMetadata Fields:**
```python
ToolMetadata(
    id="tool_id",                     # Unique ID
    name="Display Name",              # UI display name
    description="What it does",       # LLM uses this to decide when to call
    parameters=[ToolParameter(...)],  # Input parameters
    requires_auth=True,               # Needs credentials?
    is_enabled=True                   # Active?
)
```

**ToolParameter:**
```python
ToolParameter(
    name="param_name",
    type="string",        # string, number, integer, boolean, array, object
    description="...",
    required=True,
    default=None
)
```

**ToolExecutionResult:**
```python
# Success
return ToolExecutionResult(success=True, data={"key": "value"})

# Failure
return ToolExecutionResult(success=False, error="Error message")
```

## Testing

### 1. Direct Tool Execution

```bash
# List tools
curl http://localhost:8000/api/v1/tools

# Execute tool
curl -X POST http://localhost:8000/api/v1/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "slack_messenger",
    "parameters": {"message": "Hello!", "channel": "#general"},
    "config": {"SLACK_WEBHOOK_URL": "https://hooks.slack.com/..."}
  }'
```

### 2. Agent Workflow Test

```bash
# Create agent with tool
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "Notification Agent",
    "tools": {"slackMessenger": true},
    "tools_enabled": true,
    "auto_deploy": true
  }'

# Execute agent
curl -X POST http://localhost:8000/api/workflows/agent/1/execute \
  -H "Content-Type: application/json" \
  -d '{"input_data": {"message": "Test"}}'
```

## Best Practices

**1. Error Handling** - Always wrap in try-except:
```python
try:
    result = await operation()
    return ToolExecutionResult(success=True, data=result)
except Exception as e:
    return ToolExecutionResult(success=False, error=str(e))
```

**2. Configuration** - Use config dict for credentials:
```python
def __init__(self, config: Optional[Dict[str, Any]] = None):
    super().__init__(config)
    self.api_key = config.get("API_KEY") if config else os.getenv("API_KEY")
```

**3. Async HTTP** - Use httpx.AsyncClient:
```python
async with httpx.AsyncClient() as client:
    response = await client.get(url, timeout=30.0)
```

**4. Validation** - Validate parameters:
```python
if not await self.validate_parameters(**kwargs):
    return ToolExecutionResult(success=False, error="Invalid parameters")
```

**5. Descriptions** - LLMs use descriptions to decide when to call tools:
```python
description="Sends email notifications. Use when user wants to email someone."
```

## Example Tools

### Database Query Tool
```python
class PostgresTool(BaseTool):
    def get_metadata(self) -> ToolMetadata:
        return ToolMetadata(
            id="postgres_query",
            name="PostgreSQL Query",
            description="Execute SELECT queries on PostgreSQL",
            parameters=[
                ToolParameter(name="query", type="string", required=True),
                ToolParameter(name="limit", type="integer", default=100)
            ],
            requires_auth=True
        )

    async def execute(self, **kwargs) -> ToolExecutionResult:
        try:
            query = kwargs.get("query")
            if not query.strip().upper().startswith("SELECT"):
                return ToolExecutionResult(success=False, error="Only SELECT allowed")

            # Execute query...
            return ToolExecutionResult(success=True, data={"rows": rows})
        except Exception as e:
            return ToolExecutionResult(success=False, error=str(e))
```

### Jira Ticket Tool
```python
class JiraTool(BaseTool):
    def get_metadata(self) -> ToolMetadata:
        return ToolMetadata(
            id="jira_ticket",
            name="Jira Manager",
            parameters=[
                ToolParameter(
                    name="action",
                    type="string",
                    enum=["create", "update", "get"],
                    required=True
                ),
                ToolParameter(name="summary", type="string"),
                ToolParameter(name="ticket_id", type="string")
            ],
            requires_auth=True
        )

    async def execute(self, **kwargs) -> ToolExecutionResult:
        action = kwargs.get("action")
        if action == "create":
            return await self._create_ticket(**kwargs)
        # ...
```

### Authentication Patterns

**API Key:**
```python
headers = {"Authorization": f"Bearer {self.api_key}"}
```

**Basic Auth:**
```python
import base64
creds = base64.b64encode(f"{user}:{pass}".encode()).decode()
headers = {"Authorization": f"Basic {creds}"}
```

## Troubleshooting

**Tool not appearing:**
- Check registration in `main.py` startup
- Verify `is_enabled=True` in metadata
- Restart server

**Tool not called by agent:**
- Improve description (LLM uses this to decide)
- Verify tool enabled in agent config
- Check frontend-to-backend ID mapping in `executor.py`

**Execution errors:**
- Check logs for stack trace
- Test directly: `POST /api/v1/tools/execute`
- Verify config/credentials

---

## Summary

**4 Steps to Add a Tool:**
1. Create tool class extending `BaseTool`
2. Implement `get_metadata()` and `execute()`
3. Register in `app/main.py` startup
4. Test via `/api/v1/tools/execute`

LangGraph handles state management, orchestration, and error handling. Focus on your tool's logic.
