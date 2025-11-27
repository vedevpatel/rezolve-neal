import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CanvasHeader.css';

const CanvasHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="canvas-header">
      <div className="header-left">
        <button className="back-btn" onClick={() => navigate('/agent-builder')}>
          &larr; Back to Templates
        </button>
        <div className="header-divider"></div>
        <h3>Agent Builder</h3>
        <div className="header-divider"></div>
        <button className="header-action-btn">Save</button>
        <button className="header-action-btn">Settings</button>
        <button className="header-action-btn preview-btn">Preview</button>
        <button className="header-action-btn deploy-btn">Deploy</button>
      </div>
    </header>
  );
};

export default CanvasHeader;