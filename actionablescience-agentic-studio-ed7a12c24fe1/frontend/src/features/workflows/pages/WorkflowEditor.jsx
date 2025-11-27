import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';

import AgentNode from '../components/AgentNode';
import { getTemplateData } from '../../agent-builder/data/templates';
import './WorkflowEditor.css';

const nodeTypes = {
  agentNode: AgentNode,
};

const WorkflowEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflow, setWorkflow] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [selectorTab, setSelectorTab] = useState('my-agents'); // 'my-agents' or 'templates'

  // Template agents data
  const templateAgents = [
    {
      id: 'template-intake-routing',
      agent_name: 'Intake & Routing Agent',
      description: 'Automatically categorizes incoming tickets, assigns priority, and routes to the optimal queue based on content analysis and team capacity.',
      templateId: 'intake-routing',
      isTemplate: true,
      tags: ['Triage', 'Routing', 'Categorization'],
      tools_enabled: false,
      tools: {},
      temperature: 0.7,
      max_tokens: 2048,
      status: 'template',
      inputs: [{ id: '1', label: 'New Ticket Webhook', type: 'JSON', description: 'Incoming ticket data from webhook' }],
      outputs: [
        { id: '1', label: 'Assign to Team Queue', type: 'Text', description: 'Target team queue assignment' },
        { id: '2', label: 'Set Ticket Priority', type: 'Text', description: 'Calculated priority level' }
      ],
    },
    {
      id: 'template-solution-identification',
      agent_name: 'Solution Identification Agent',
      description: 'Analyzes ticket content and searches historical resolutions, KB articles, and runbooks to provide ranked solution recommendations.',
      templateId: 'solution-identification',
      isTemplate: true,
      tags: ['Knowledge', 'Resolution', 'Learning'],
      tools_enabled: true,
      tools: { 'Knowledge Base': true, 'Historical Tickets': true },
      temperature: 0.7,
      max_tokens: 2048,
      status: 'template',
      inputs: [{ id: '1', label: 'Ticket Content Input', type: 'Text', description: 'Ticket description and details' }],
      outputs: [
        { id: '1', label: 'Ranked Solutions', type: 'JSON', description: 'List of potential solutions ranked by relevance' },
        { id: '2', label: 'KB Article Links', type: 'URL', description: 'Related knowledge base articles' }
      ],
    },
    {
      id: 'template-major-incident-swarmer',
      agent_name: 'Major Incident Swarmer AI',
      description: 'Rapidly assembles teams, analyzes data, and orchestrates P1 incident response.',
      templateId: 'major-incident-swarmer',
      isTemplate: true,
      tags: ['Incident Response', 'P1', 'Orchestration'],
      tools_enabled: true,
      tools: { 'Confluence': true, 'SharePoint': true },
      temperature: 0.7,
      max_tokens: 2048,
      status: 'template',
      inputs: [{ id: '1', label: 'Webhook: New P1 Incident', type: 'JSON', description: 'P1 incident alert data' }],
      outputs: [
        { id: '1', label: 'Create MS Teams Channel', type: 'Text', description: 'Teams channel URL' },
        { id: '2', label: 'Notify Stakeholders', type: 'Text', description: 'Notification status' }
      ],
    },
  ];

  useEffect(() => {
    loadWorkflow();
    loadAgents();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/multi-agent-workflows/${id}`);
      const workflowData = response.data;
      setWorkflow(workflowData);

      // Load existing nodes and edges if workflow definition exists
      if (workflowData.workflow_definition && workflowData.workflow_definition.nodes) {
        // Fetch agent details for each node
        const agentsResponse = await axios.get('http://localhost:8000/api/v1/agents/');
        const agentsMap = new Map(agentsResponse.data.map(a => [a.id, a]));

        const flowNodes = workflowData.workflow_definition.nodes.map(node => {
          const agent = agentsMap.get(node.agent_id);
          return {
            id: node.id,
            type: 'agentNode',
            position: node.position,
            data: {
              agentId: node.agent_id,
              label: node.label || agent?.agent_name || `Agent ${node.agent_id}`,
              description: agent?.description || '',
              status: agent?.status || 'unknown',
              temperature: agent?.temperature || 0.7,
              maxTokens: agent?.max_tokens || 2048,
              toolsEnabled: agent?.tools_enabled || false,
              tools: agent?.tools || {},
              inputs: agent?.inputs || [],
              outputs: agent?.outputs || [],
            },
          };
        });
        setNodes(flowNodes);

        const flowEdges = workflowData.workflow_definition.edges?.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })) || [];
        setEdges(flowEdges);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      alert('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/agents/');
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addAgentNode = (agent) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'agentNode',
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: {
        agentId: agent.id,
        label: agent.agent_name,
        description: agent.description,
        status: agent.status,
        temperature: agent.temperature,
        maxTokens: agent.max_tokens,
        toolsEnabled: agent.tools_enabled,
        tools: agent.tools || {},
        inputs: agent.inputs || [],
        outputs: agent.outputs || [],
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setShowAgentSelector(false);
  };

  const handleEditAgent = (agent) => {
    navigate('/agent-builder/create', {
      state: {
        agentData: agent,
        isEditMode: !agent.isTemplate, // Templates create new agents, not edit mode
        agentId: agent.isTemplate ? null : agent.id,
      }
    });
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      // Convert ReactFlow state to workflow definition format
      const workflowDefinition = {
        nodes: nodes.map(node => ({
          id: node.id,
          agent_id: node.data.agentId,
          position: node.position,
          label: node.data.label,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };

      await axios.put(`http://localhost:8000/api/multi-agent-workflows/${id}`, {
        workflow_definition: workflowDefinition,
      });

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Please add at least one agent to the workflow before executing.');
      return;
    }

    const userInput = prompt('Enter input for the workflow:');
    if (!userInput) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/api/multi-agent-workflows/${id}/execute`,
        {
          input_data: { message: userInput },
        }
      );

      alert(`Workflow executed successfully!\n\nExecution ID: ${response.data.id}`);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow');
    }
  };

  if (loading) {
    return <div className="editor-loading">Loading workflow...</div>;
  }

  return (
    <div className="workflow-editor">
      <div className="editor-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/workflows')}>
            ← Back
          </button>
          <div className="workflow-info">
            <h1>{workflow?.name}</h1>
            <p>{workflow?.description}</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="add-agent-btn"
            onClick={() => setShowAgentSelector(!showAgentSelector)}
          >
            + Add Agent
          </button>
          <button
            className="save-btn"
            onClick={saveWorkflow}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
          <button
            className="execute-btn"
            onClick={executeWorkflow}
          >
            Run Workflow
          </button>
        </div>
      </div>

      {showAgentSelector && (
        <div className="agent-selector-panel">
          <div className="selector-header">
            <h3>Select an Agent to Add</h3>
            <div className="selector-tabs">
              <button
                className={`selector-tab ${selectorTab === 'my-agents' ? 'active' : ''}`}
                onClick={() => setSelectorTab('my-agents')}
              >
                My Agents ({agents.length})
              </button>
              <button
                className={`selector-tab ${selectorTab === 'templates' ? 'active' : ''}`}
                onClick={() => setSelectorTab('templates')}
              >
                Templates ({templateAgents.length})
              </button>
            </div>
          </div>

          <div className="agent-list">
            {selectorTab === 'my-agents' && agents.length === 0 && (
              <p className="no-agents">
                No agents available. <a href="/agent-builder/create">Create one first</a>
              </p>
            )}

            {selectorTab === 'my-agents' && agents.map((agent) => {
              const isExpanded = expandedAgentId === agent.id;
              const enabledTools = agent.tools_enabled && agent.tools
                ? Object.entries(agent.tools).filter(([_, enabled]) => enabled)
                : [];

              return (
                <div
                  key={agent.id}
                  className={`agent-item ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="agent-item-header">
                    <div
                      className="agent-item-main"
                      onClick={() => addAgentNode(agent)}
                    >
                      <h4>{agent.agent_name}</h4>
                      <p>{agent.description}</p>
                    </div>
                    <button
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAgentId(isExpanded ? null : agent.id);
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="agent-item-details">
                      <div className="detail-section">
                        <strong>Status:</strong> <span className={`agent-status ${agent.status}`}>{agent.status}</span>
                      </div>
                      <div className="detail-section">
                        <strong>Temperature:</strong> {agent.temperature}
                      </div>
                      <div className="detail-section">
                        <strong>Max Tokens:</strong> {agent.max_tokens}
                      </div>
                      <div className="detail-section">
                        <strong>Tools:</strong>
                        {agent.tools_enabled ? (
                          enabledTools.length > 0 ? (
                            <div className="tools-list">
                              {enabledTools.map(([toolName, _]) => (
                                <span key={toolName} className="tool-badge">
                                  {toolName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-tools">No tools configured</span>
                          )
                        ) : (
                          <span className="no-tools">Tools disabled</span>
                        )}
                      </div>
                      <div className="agent-actions">
                        <button
                          className="edit-agent-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAgent(agent);
                          }}
                        >
                          ✏️ Edit Agent
                        </button>
                        <button
                          className="add-this-agent-btn"
                          onClick={() => addAgentNode(agent)}
                        >
                          Add to Workflow
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {selectorTab === 'templates' && templateAgents.map((agent) => {
              const isExpanded = expandedAgentId === agent.id;
              const enabledTools = agent.tools_enabled && agent.tools
                ? Object.entries(agent.tools).filter(([_, enabled]) => enabled)
                : [];

              return (
                <div
                  key={agent.id}
                  className={`agent-item template-agent-item ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="agent-item-header">
                    <div
                      className="agent-item-main"
                      onClick={() => addAgentNode(agent)}
                    >
                      <div className="template-badge">Template</div>
                      <h4>{agent.agent_name}</h4>
                      <p>{agent.description}</p>
                      {agent.tags && (
                        <div className="template-tags">
                          {agent.tags.map(tag => (
                            <span key={tag} className="template-tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAgentId(isExpanded ? null : agent.id);
                      }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="agent-item-details">
                      <div className="detail-section">
                        <strong>Inputs:</strong>
                        {agent.inputs && agent.inputs.length > 0 ? (
                          <div className="io-preview-list">
                            {agent.inputs.map((input, idx) => (
                              <span key={idx} className="io-preview-badge">{input.label}</span>
                            ))}
                          </div>
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                      <div className="detail-section">
                        <strong>Outputs:</strong>
                        {agent.outputs && agent.outputs.length > 0 ? (
                          <div className="io-preview-list">
                            {agent.outputs.map((output, idx) => (
                              <span key={idx} className="io-preview-badge">{output.label}</span>
                            ))}
                          </div>
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                      <div className="detail-section">
                        <strong>Tools:</strong>
                        {agent.tools_enabled ? (
                          enabledTools.length > 0 ? (
                            <div className="tools-list">
                              {enabledTools.map(([toolName, _]) => (
                                <span key={toolName} className="tool-badge">
                                  {toolName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-tools">No tools configured</span>
                          )
                        ) : (
                          <span className="no-tools">Tools disabled</span>
                        )}
                      </div>
                      <div className="agent-actions">
                        <button
                          className="edit-agent-btn template-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAgent(agent);
                          }}
                        >
                          ✏️ Customize Template
                        </button>
                        <button
                          className="add-this-agent-btn template-add-btn"
                          onClick={() => addAgentNode(agent)}
                        >
                          Add Template to Workflow
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowEditor;
