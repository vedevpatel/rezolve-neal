import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const agentApi = {
  getAgents: async () => {
    try {
      const response = await apiClient.get('/api/v1/agents/');
      return response.data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  // get a single agent by its ID
  getAgentById: async (agentId) => {
    try {
      const response = await apiClient.get(`/api/v1/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent with ID ${agentId}:`, error);
      throw error;
    }
  },

  createAgent: async (agentData) => {
    try {
      const response = await apiClient.post('/api/v1/agents/', agentData);
      return response.data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  },


  updateAgent: async (agentId, agentData) => {
    try {
      const response = await apiClient.put(`/api/v1/agents/${agentId}`, agentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating agent with ID ${agentId}:`, error);
      throw error;
    }
  },

  deleteAgent: async (agentId) => {
    try {
      const response = await apiClient.delete(`/api/v1/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting agent with ID ${agentId}:`, error);
      throw error;
    }
  },

  deployAgent: async (agentId) => {
    try {
      const response = await apiClient.post(`/api/v1/agents/${agentId}/deploy`);
      return response.data;
    } catch (error) {
      console.error(`Error deploying agent with ID ${agentId}:`, error);
      throw error;
    }
  },
};

export const workflowApi = {
  getWorkflows: async () => {
    try {
      const response = await apiClient.get('/api/workflows/');
      return response.data;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw error;
    }
  },

  getAgentWorkflows: async (agentId) => {
    try {
      const response = await apiClient.get(`/api/workflows/agent/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflows for agent ${agentId}:`, error);
      throw error;
    }
  },

  getWorkflowById: async (workflowId) => {
    try {
      const response = await apiClient.get(`/api/workflows/workflow/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow ${workflowId}:`, error);
      throw error;
    }
  },

  executeAgent: async (agentId, input) => {
    try {
      const response = await apiClient.post(`/api/workflows/agent/${agentId}/execute`, { input_data: input });
      return response.data;
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);
      throw error;
    }
  },

  executeTool: async (toolId, parameters) => {
    try {
      const response = await apiClient.post(`/api/workflows/execute/${toolId}`, { parameters });
      return response.data;
    } catch (error) {
      console.error(`Error executing tool ${toolId}:`, error);
      throw error;
    }
  },
};

export const multiAgentWorkflowApi = {
  createWorkflow: async (workflowData) => {
    try {
      const response = await apiClient.post('/api/multi-agent-workflows/', workflowData);
      return response.data;
    } catch (error) {
      console.error('Error creating multi-agent workflow:', error);
      throw error;
    }
  },

  getWorkflows: async () => {
    try {
      const response = await apiClient.get('/api/multi-agent-workflows/');
      return response.data;
    } catch (error) {
      console.error('Error fetching multi-agent workflows:', error);
      throw error;
    }
  },

  getWorkflowById: async (workflowId) => {
    try {
      const response = await apiClient.get(`/api/multi-agent-workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching multi-agent workflow ${workflowId}:`, error);
      throw error;
    }
  },

  updateWorkflow: async (workflowId, workflowData) => {
    try {
      const response = await apiClient.put(`/api/multi-agent-workflows/${workflowId}`, workflowData);
      return response.data;
    } catch (error) {
      console.error(`Error updating multi-agent workflow ${workflowId}:`, error);
      throw error;
    }
  },

  deleteWorkflow: async (workflowId, force = false) => {
    try {
      const response = await apiClient.delete(`/api/multi-agent-workflows/${workflowId}`, {
        params: { force }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting multi-agent workflow ${workflowId}:`, error);
      throw error;
    }
  },

  executeWorkflow: async (workflowId, input) => {
    try {
      const response = await apiClient.post(`/api/multi-agent-workflows/${workflowId}/execute`, { input_data: input });
      return response.data;
    } catch (error) {
      console.error(`Error executing multi-agent workflow ${workflowId}:`, error);
      throw error;
    }
  },

  getWorkflowExecutions: async (workflowId) => {
    try {
      const response = await apiClient.get(`/api/multi-agent-workflows/${workflowId}/executions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching executions for workflow ${workflowId}:`, error);
      throw error;
    }
  },

  getExecutionById: async (executionId) => {
    try {
      const response = await apiClient.get(`/api/multi-agent-workflows/executions/${executionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching execution ${executionId}:`, error);
      throw error;
    }
  },

  cancelExecution: async (workflowId, executionId) => {
    try {
      const response = await apiClient.post(`/api/multi-agent-workflows/${workflowId}/executions/${executionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling execution ${executionId}:`, error);
      throw error;
    }
  },
};

export const toolsApi = {
  getTools: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/v1/tools/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }
  },

  getToolById: async (toolId) => {
    try {
      const response = await apiClient.get(`/api/v1/tools/${toolId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tool ${toolId}:`, error);
      throw error;
    }
  },

  executeTool: async (toolId, parameters, config = {}) => {
    try {
      const response = await apiClient.post('/api/v1/tools/execute', {
        tool_id: toolId,
        parameters,
        config
      });
      return response.data;
    } catch (error) {
      console.error(`Error executing tool ${toolId}:`, error);
      throw error;
    }
  },

  getToolsOpenAIFormat: async () => {
    try {
      const response = await apiClient.get('/api/v1/tools/openai/format');
      return response.data;
    } catch (error) {
      console.error('Error fetching tools in OpenAI format:', error);
      throw error;
    }
  },

  getRegistryStats: async () => {
    try {
      const response = await apiClient.get('/api/v1/tools/registry/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching registry stats:', error);
      throw error;
    }
  },
};

