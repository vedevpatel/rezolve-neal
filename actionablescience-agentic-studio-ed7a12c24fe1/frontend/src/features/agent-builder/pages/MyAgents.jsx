import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentApi } from '../../../services/api';
import AgentCard from '../Components/AgentCard';
import './MyAgents.css';

const MyAgents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getAgents();
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    navigate('/agent-builder/create');
  };

  const handleEditAgent = (agentId) => {
    navigate(`/agent-builder/create?id=${agentId}`);
  };

  const handleDeleteAgent = async (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await agentApi.deleteAgent(agentId);
        fetchAgents();
      } catch (err) {
        console.error('Error deleting agent:', err);
        alert('Failed to delete agent');
      }
    }
  };

  if (loading) {
    return (
      <div className="my-agents-container">
        <div className="loading">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-agents-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-agents-container">
      <div className="my-agents-header">
        <h1>My Agents</h1>
        <button className="create-agent-btn" onClick={handleCreateAgent}>
          + Create New Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <h2>No agents yet</h2>
          <p>Create your first AI agent to get started</p>
          <button className="create-agent-btn-large" onClick={handleCreateAgent}>
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEditAgent}
              onDelete={handleDeleteAgent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAgents;
