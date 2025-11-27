import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './AgentNode.css';

const AgentNode = ({ data }) => {
  const {
    label,
    description,
    status,
    temperature,
    maxTokens,
    toolsEnabled,
    tools,
    inputs,
    outputs,
  } = data;

  // Get enabled tools
  const enabledTools = toolsEnabled && tools
    ? Object.entries(tools).filter(([_, enabled]) => enabled).map(([name, _]) => name)
    : [];

  return (
    <div className="agent-node">
      <Handle type="target" position={Position.Top} className="node-handle" />

      <div className="agent-node-header">
        <div className="agent-node-title">{label}</div>
        {status && <span className={`agent-node-status ${status}`}>{status}</span>}
      </div>

      {description && (
        <div className="agent-node-description">{description}</div>
      )}

      <div className="agent-node-details">
        <div className="agent-node-param">
          <span className="param-label">Temp:</span>
          <span className="param-value">{temperature || 0.7}</span>
        </div>
        <div className="agent-node-param">
          <span className="param-label">Tokens:</span>
          <span className="param-value">{maxTokens || 2048}</span>
        </div>
      </div>

      {inputs && inputs.length > 0 && (
        <div className="agent-node-io">
          <div className="io-label">Inputs:</div>
          <div className="io-list">
            {inputs.map((input, idx) => (
              <div key={idx} className="io-item">{input.label}</div>
            ))}
          </div>
        </div>
      )}

      {outputs && outputs.length > 0 && (
        <div className="agent-node-io">
          <div className="io-label">Outputs:</div>
          <div className="io-list">
            {outputs.map((output, idx) => (
              <div key={idx} className="io-item">{output.label}</div>
            ))}
          </div>
        </div>
      )}

      {enabledTools.length > 0 && (
        <div className="agent-node-tools">
          <div className="tools-label">Tools:</div>
          <div className="tools-badges">
            {enabledTools.map((tool, idx) => (
              <span key={idx} className="tool-badge">{tool}</span>
            ))}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
};

export default memo(AgentNode);
