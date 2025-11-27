import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { agentApi } from '../../../services/api';
import AgentCard from '../Components/AgentCard';
import './AgentBuilderLandingPage.css';

// TemplateCard Component (for "Create Agent" tab)
const TemplateCard = ({ title, description, value, tags, templateId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleUseTemplate = () => {
    navigate(`/agent-builder/canvas/template/${templateId}`);
  };

  return (
    <div 
      className="template-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="template-card-overlay">
          <button className="use-template-btn" onClick={handleUseTemplate}>
            Use this template
          </button>
        </div>
      )}
      <div className="card-header"><h4>{title}</h4></div>
      <div className="card-body">
        <p>{description}</p>
        <div className="card-value"><span>Value:</span> {value}</div>
      </div>
      <div className="card-footer">{tags.map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
    </div>
  );
};


const AgentBuilderLandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'create');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'myAgents') {
      fetchAgents();
    }
  }, [activeTab]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAgents = await agentApi.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
      setError('Failed to load agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAgentClick = () => {
    navigate('/agent-builder/create');
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div>
          <h2>Rezolve Agentic Studio</h2>
          <p>Build intelligent ITSM agents from scratch or templates</p>
        </div>
        <button className="new-agent-btn" onClick={handleNewAgentClick}>+ New Agent</button>
      </header>

      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Agent
        </button>
        <button 
          className={`tab-button ${activeTab === 'myAgents' ? 'active' : ''}`}
          onClick={() => setActiveTab('myAgents')}
        >
          My Agents
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="template-grid">
          <TemplateCard 
            title="Intake & Routing Agent"
            description="Automatically categorizes incoming tickets, assigns priority, and routes to the optimal queue based on content analysis and team capacity."
            value="60-80% reduction in manual triage time"
            tags={['Triage', 'Routing', 'Categorization']}
            templateId="intake-routing"
          />
          <TemplateCard 
            title="Solution Identification Agent"
            description="Analyzes ticket content and searches historical resolutions, KB articles, and runbooks to provide ranked solution recommendations."
            value="Faster resolution times, reduced repetitive research"
            tags={['Knowledge', 'Resolution', 'Learning']}
            templateId="solution-identification"
          />
        </div>
      )}

      {activeTab === 'myAgents' && (
        <div className="my-agents-view">
          {loading && <p>Loading your agents...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && agents.length === 0 && (
            <div className="empty-state">
              <h3>No custom agents yet</h3>
              <p>Create your first custom agent to get started</p>
              <button className="new-agent-btn" onClick={handleNewAgentClick}>+ Create New Agent</button>
            </div>
          )}
          {!loading && !error && agents.length > 0 && (
            <div className="template-grid"> 
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentBuilderLandingPage;