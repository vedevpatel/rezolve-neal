import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import './ProfessionalNode.css';

const ProfessionalNode = ({ id, data, isConnectable }) => {
  const { variant } = data;
  const [isExpanded, setIsExpanded] = useState(false);
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const nodeRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(250, Math.min(600, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  // Render content based on variant type
  const renderContent = () => {
    if (variant === 'agent') {
      const { agentName, instructions, tools, inputType } = data;
      return (
        <>
          <div className="node-header">
            <div className="node-title-group">
              <div className="node-title">Agent</div>
              <div className="node-subtitle">{agentName || 'Untitled Agent'}</div>
            </div>
            <button className="expand-btn" onClick={toggleExpand}>
              {isExpanded ? '−' : '+'}
            </button>
          </div>

          {isExpanded && (
            <div className="node-expanded-content">
              <div className="node-field">
                <label>Agent Name</label>
                <div className="field-value">{agentName || 'N/A'}</div>
              </div>

              <div className="node-field">
                <label>Instructions</label>
                <div className="field-value">{instructions || 'No instructions provided'}</div>
              </div>

              {tools && tools.length > 0 && (
                <div className="node-field">
                  <label>Selected Tools</label>
                  <div className="tools-list">
                    {tools.map((tool, idx) => (
                      <span key={idx} className="tool-badge">{tool}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="node-field">
                <label>Input Type</label>
                <div className="field-value">{inputType || 'Web'}</div>
              </div>
            </div>
          )}
        </>
      );
    } else if (variant === 'input') {
      const { inputType, label, description, payload, query } = data;
      return (
        <>
          <div className="node-header">
            <div className="node-title-group">
              <div className="node-title">{inputType || 'Input'}</div>
              <div className="node-subtitle">{label || 'Input Field'}</div>
            </div>
            <button className="expand-btn" onClick={toggleExpand}>
              {isExpanded ? '−' : '+'}
            </button>
          </div>

          {isExpanded && (
            <div className="node-expanded-content">
              <div className="node-field">
                <label>Label</label>
                <div className="field-value">{label || 'N/A'}</div>
              </div>

              <div className="node-field">
                <label>Type</label>
                <div className="field-value">{inputType || 'Text'}</div>
              </div>

              {description && (
                <div className="node-field">
                  <label>Description</label>
                  <div className="field-value">{description}</div>
                </div>
              )}

              {payload && (
                <div className="node-field">
                  <label>Payload</label>
                  <div className="code-box">{payload}</div>
                </div>
              )}

              {query && (
                <div className="node-field">
                  <label>Query</label>
                  <div className="code-box">{query}</div>
                </div>
              )}
            </div>
          )}
        </>
      );
    } else if (variant === 'output') {
      const { outputType, label, description, tool, toolDetails } = data;
      return (
        <>
          <div className="node-header">
            <div className="node-title-group">
              <div className="node-title">{outputType || 'Output'}</div>
              <div className="node-subtitle">{label || 'Output Field'}</div>
            </div>
            <button className="expand-btn" onClick={toggleExpand}>
              {isExpanded ? '−' : '+'}
            </button>
          </div>

          {isExpanded && (
            <div className="node-expanded-content">
              <div className="node-field">
                <label>Label</label>
                <div className="field-value">{label || 'N/A'}</div>
              </div>

              <div className="node-field">
                <label>Type</label>
                <div className="field-value">{outputType || 'Text'}</div>
              </div>

              {description && (
                <div className="node-field">
                  <label>Description</label>
                  <div className="field-value">{description}</div>
                </div>
              )}

              {tool && (
                <div className="node-field">
                  <label>Using Tool</label>
                  <div className="field-value tool-highlight">{tool}</div>
                </div>
              )}

              {toolDetails && (
                <div className="node-field">
                  <label>Tool Details</label>
                  <div className="field-value">{toolDetails}</div>
                </div>
              )}
            </div>
          )}
        </>
      );
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`professional-node variant-${variant} ${isExpanded ? 'expanded' : 'collapsed'} ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${width}px` }}
    >
      <Handle type="target" position={Position.Left} className="handle" isConnectable={isConnectable} />

      <div className="node-content">
        {renderContent()}
      </div>

      {/* Horizontal resize handle */}
      <div
        className="resize-handle-horizontal"
        onMouseDown={handleResizeStart}
      />

      <Handle type="source" position={Position.Right} className="handle" isConnectable={isConnectable} />
    </div>
  );
};

export default memo(ProfessionalNode);

