# Rezolve Agentic Studio

Platform for building AI agents and multi-agent workflows with MCP tool integration.

## Quick Start

```bash
# Clone and run with Docker
cd agentic-studio
docker-compose up --build
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Setup

1. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

2. **Start services:**
```bash
docker-compose up --build
```

## Project Structure

```
agentic-studio/
├── frontend/              # React + Vite
│   ├── src/features/
│   │   ├── agent-builder/ # 5-step agent creation
│   │   └── workflows/     # Multi-agent workflows
│   └── package.json
│
├── backend/               # FastAPI + LangGraph
│   ├── app/
│   │   ├── mcp/          # Tool framework
│   │   │   └── tools/    # Add your tools here
│   │   ├── langgraph/    # Agent orchestration
│   │   └── routes/       # API endpoints
│   ├── DEVELOPER_GUIDE.md # MCP tool development
│   └── requirements.txt
│
└── docker-compose.yml
```

## Adding MCP Tools

Create `backend/app/mcp/tools/your_tool.py`:

```python
from ..base_tool import BaseTool

class YourTool(BaseTool):
    name = "your_tool"
    description = "What your tool does"
    
    def execute(self, **kwargs):
        # Your implementation
        return {"result": "success"}
```

Register in `backend/app/mcp/registry.py`:

```python
from .tools.your_tool import YourTool
registry.register(YourTool())
```

**See [backend/DEVELOPER_GUIDE.md](backend/DEVELOPER_GUIDE.md) for complete documentation.**

## Features

- **Agent Builder**: Visual multi-step form for agent configuration
- **Workflow Editor**: Node-based canvas for multi-agent orchestration
- **MCP Tools**: Extensible tool framework for any integration
- **LangGraph**: State-based agent execution with automatic data flow

## API Endpoints

**Agents:**
- `POST /api/v1/agents/` - Create agent
- `GET /api/v1/agents/` - List all agents
- `GET /api/v1/agents/{id}` - Get agent details

**Workflows:**
- `POST /api/multi-agent-workflows/` - Create workflow
- `POST /api/multi-agent-workflows/{id}/execute` - Execute workflow

## Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Tech Stack

- **Frontend**: React 18, ReactFlow, Vite
- **Backend**: FastAPI, LangGraph, LangChain
- **Database**: PostgreSQL 14
- **LLM**: OpenAI GPT-4

## Documentation

- [Backend Developer Guide](backend/DEVELOPER_GUIDE.md) - MCP tool development
- [API Docs](http://localhost:8000/docs) - Interactive OpenAPI docs
