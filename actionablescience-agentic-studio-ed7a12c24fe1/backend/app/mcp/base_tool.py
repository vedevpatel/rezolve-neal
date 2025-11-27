"""
Base Tool Interface

All MCP tools/connectors inherit from BaseTool and implement the execute method.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ParameterType(str, Enum):
    """Supported parameter types for tool inputs"""
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"


class ToolParameter(BaseModel):
    """
    Defines a single parameter for a tool.
    Maps to OpenAI function calling parameter format.
    """
    name: str
    type: ParameterType
    description: str
    required: bool = True
    default: Optional[Any] = None
    enum: Optional[List[Any]] = None  # For restricted values

    # For array/object types
    items: Optional[Dict[str, Any]] = None
    properties: Optional[Dict[str, Any]] = None


class ToolMetadata(BaseModel):
    """
    Metadata describing a tool's capabilities and configuration.
    """
    # Identification
    id: str = Field(..., description="Unique tool identifier (e.g., 'servicenow_incident')")
    name: str = Field(..., description="Human-readable tool name")
    description: str = Field(..., description="What this tool does")
    version: str = Field(default="1.0.0", description="Tool version")

    # Categorization
    category: str = Field(default="general", description="Tool category (itsm, crm, productivity, etc)")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")

    # Configuration
    parameters: List[ToolParameter] = Field(default_factory=list, description="Tool input parameters")
    requires_auth: bool = Field(default=False, description="Whether tool needs authentication")
    auth_type: Optional[str] = Field(default=None, description="Auth type: api_key, oauth2, basic")

    # Usage
    is_enabled: bool = Field(default=True, description="Whether tool is active")
    use_count: int = Field(default=0, description="Number of times tool has been used")

    def to_openai_function(self) -> Dict[str, Any]:
        """
        Convert tool metadata to OpenAI function calling format.

        Returns:
            Dict formatted for OpenAI Assistants API tools parameter
        """
        properties: Dict[str, Any] = {}
        required: List[str] = []

        for param in self.parameters:
            param_schema: Dict[str, Any] = {
                "type": param.type.value,
                "description": param.description
            }

            if param.enum is not None:
                param_schema["enum"] = param.enum

            if param.items is not None:
                param_schema["items"] = param.items

            if param.properties is not None:
                param_schema["properties"] = param.properties

            properties[param.name] = param_schema

            if param.required:
                required.append(param.name)

        parameters_schema: Dict[str, Any] = {
            "type": "object",
            "properties": properties,
            "required": required,
        }

        return {
            "type": "function",
            "function": {
                "name": self.id,
                "description": self.description,
                "parameters": parameters_schema,
            },
        }


class ToolExecutionResult(BaseModel):
    """Result of a tool execution"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None  # Extra info like execution time, tokens used, etc


class BaseTool(ABC):
    """
    Abstract base class for all MCP tools.

    All connectors (ServiceNow, JIRA, etc.) inherit from this class
    and implement the execute method.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialize tool with configuration.

        Args:
            config: Tool-specific configuration (API keys, endpoints, etc.)
        """
        self.config: Dict[str, Any] = config or {}
        self._metadata: Optional[ToolMetadata] = None

    @abstractmethod
    def get_metadata(self) -> ToolMetadata:
        """
        Return tool metadata describing capabilities and parameters.

        Returns:
            ToolMetadata object with tool information
        """
        raise NotImplementedError

    @abstractmethod
    async def execute(self, **kwargs: Any) -> ToolExecutionResult:
        """
        Execute the tool with given parameters.

        Args:
            **kwargs: Tool-specific parameters as defined in metadata

        Returns:
            ToolExecutionResult with success/failure and data/error
        """
        raise NotImplementedError

    async def validate_parameters(self, **kwargs: Any) -> bool:
        """
        Validate input parameters against tool metadata.

        Args:
            **kwargs: Parameters to validate

        Returns:
            True if valid, raises ValueError if invalid
        """
        metadata = self.get_metadata()
        required_params = [p.name for p in metadata.parameters if p.required]

        # Check required parameters
        for param_name in required_params:
            if param_name not in kwargs:
                raise ValueError(f"Missing required parameter: {param_name}")

        # Type validation
        for param in metadata.parameters:
            if param.name in kwargs:
                value = kwargs[param.name]

                if param.type == ParameterType.STRING and not isinstance(value, str):
                    raise ValueError(f"Parameter '{param.name}' must be a string")
                elif param.type == ParameterType.NUMBER and not isinstance(value, (int, float)):
                    raise ValueError(f"Parameter '{param.name}' must be a number")
                elif param.type == ParameterType.INTEGER and not isinstance(value, int):
                    raise ValueError(f"Parameter '{param.name}' must be an integer")
                elif param.type == ParameterType.BOOLEAN and not isinstance(value, bool):
                    raise ValueError(f"Parameter '{param.name}' must be a boolean")

        return True

    def to_openai_tool(self) -> Dict[str, Any]:
        """
        Convert this tool to OpenAI Assistants API format.

        Returns:
            Dict formatted for OpenAI tools parameter
        """
        metadata = self.get_metadata()
        return metadata.to_openai_function()
