import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateWorkflowModal from '../components/CreateWorkflowModal';
import { multiAgentWorkflowApi } from '../../../services/api';
import './WorkflowsPage.css';

const WorkflowsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workflows on mount and whenever the location changes
  useEffect(() => {
    fetchWorkflows();
  }, [location]);

  const fetchWorkflows = async () => {
    try {
      const data = await multiAgentWorkflowApi.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (workflowData) => {
    try {
      const createdWorkflow = await multiAgentWorkflowApi.createWorkflow(workflowData);

      // Navigate to the workflow editor with the new workflow ID
      navigate(`/workflows/editor/${createdWorkflow.id}`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow. Please try again.');
    }
  };

  const handleDeleteWorkflow = async (workflow, event) => {
    // Prevent navigation to editor
    event.stopPropagation();

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${workflow.name}"?\n\nThis will also delete all execution history.\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await multiAgentWorkflowApi.deleteWorkflow(workflow.id);
      // Refresh the workflows list
      fetchWorkflows();
      alert(`Workflow "${workflow.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete workflow. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="workflows-container">
      <header className="workflows-header">
        <div>
          <h2>Workflows</h2>
          <p>Create and manage multi-agent workflows</p>
        </div>
        <button
          className="create-workflow-btn"
          onClick={() => setShowModal(true)}
        >
          Create Workflow
        </button>
      </header>

      <div className="workflows-content">
        {loading ? (
          <div className="workflows-loading">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="workflows-placeholder">
            <div className="placeholder-icon">🔄</div>
            <h3>No Workflows Yet</h3>
            <p>
              Create your first multi-agent workflow by clicking the "Create Workflow" button above.
            </p>
            <div className="placeholder-info">
              <h4>What are Multi-Agent Workflows?</h4>
              <p>
                Workflows allow you to connect multiple agents together to solve complex problems.
                Each agent performs a specific task, and data flows between them.
              </p>
              <h4>Getting Started:</h4>
              <ol>
                <li>Create individual agents in the Agent Builder</li>
                <li>Click "Create Workflow" to design a multi-agent workflow</li>
                <li>Connect your agents in a node-based editor</li>
                <li>Execute the workflow and monitor results</li>
              </ol>
            </div>
            <div className="placeholder-links">
              <a href="/agent-builder/create" className="link-button primary">
                Create New Agent
              </a>
              <button
                className="link-button secondary"
                onClick={() => setShowModal(true)}
              >
                Create Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="workflow-card"
                onClick={() => navigate(`/workflows/editor/${workflow.id}`)}
              >
                <div className="workflow-card-header">
                  <div className="workflow-card-title">
                    <h3>{workflow.name}</h3>
                    <button
                      className="delete-workflow-btn"
                      onClick={(e) => handleDeleteWorkflow(workflow, e)}
                      title="Delete workflow"
                    >
                      🗑️
                    </button>
                  </div>
                  <span className={`workflow-status ${workflow.status}`}>
                    {workflow.status}
                  </span>
                </div>
                <p className="workflow-description">{workflow.description}</p>
                <div className="workflow-meta">
                  <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(workflow.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateWorkflowModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
};

export default WorkflowsPage;
