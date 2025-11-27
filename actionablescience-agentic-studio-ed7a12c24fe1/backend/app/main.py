from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from .routes import agents, tools, workflows, multi_agent_workflows
import time
from sqlalchemy.exc import OperationalError

# Import MCP registry for tool registration
from .mcp import ToolRegistry

app = FastAPI(title="Rezolve Agentic Studio API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(agents.router)  # Prefix already defined in router
app.include_router(tools.router, prefix="/api/v1/tools", tags=["tools"])
app.include_router(workflows.router)  # Prefix already defined in router
app.include_router(multi_agent_workflows.router)  # Multi-agent workflow routes

@app.on_event("startup")
def startup_event():
    """Initialize database tables and register MCP tools on startup"""
    # Database initialization with retry logic
    max_retries = 5
    retry_interval = 2

    for attempt in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            print("✓ Database tables created successfully")
            break
        except OperationalError:
            if attempt < max_retries - 1:
                print(f"Database connection failed (attempt {attempt + 1}/{max_retries}). Retrying in {retry_interval}s...")
                time.sleep(retry_interval)
            else:
                print(f"Failed to connect to database after {max_retries} attempts")
                raise

    # Register MCP tools
    print("\n=== MCP Tool Registry Initialized ===")
    registry = ToolRegistry()

    # Tools will be auto-discovered and registered here
    # Import your custom tools in app/mcp/tools/__init__.py and register them here
    # Example:
    # from .mcp.tools import YourCustomTool
    # registry.register(YourCustomTool)

    print(f"✓ Tool registry ready. {len(registry)} tools registered\n")

@app.get("/")
def read_root():
    return {"message": "Agentic Studio Backend is running"}