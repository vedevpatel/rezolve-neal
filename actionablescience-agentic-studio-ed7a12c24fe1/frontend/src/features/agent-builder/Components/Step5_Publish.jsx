import React from 'react';
import '../styles/Form.css'; // Reusing the shared form styles
import './Step5.css';       // New styles for this component

const Step5_Publish = ({ data, setData }) => {
  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <p>Step 5 of 5</p>
        <h2>Publish & Deploy</h2>
      </div>

      <div className="form-card">
        <div className="card-section-title">Agent Summary</div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Name:</span>
            <span className="summary-value">{data.agentName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Channel:</span>
            <span className="summary-value">{data.deploymentChannel}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Description:</span>
            <span className="summary-value">{data.description}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Outcome:</span>
            <span className="summary-value">{data.expectedOutcome}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Inputs:</span>
            <span className="summary-value">{data.inputs.length} configured</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Outputs:</span>
            <span className="summary-value">{data.outputs.length} configured</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Tools:</span>
            <span className="summary-value">{data.toolsEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Memory:</span>
            <span className="summary-value">{data.memoryEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        <div className="card-section-title deployment-options-title">Deployment Options</div>
        <div className="deployment-options">
          <div className="deployment-toggle">
            <label className="switch">
              <input type="checkbox" name="autoDeploy" checked={data.autoDeploy} onChange={handleToggle} />
              <span className="slider round"></span>
            </label>
            <span>Auto-deploy after creation</span>
          </div>
          <div className="deployment-toggle">
            <label className="switch">
              <input type="checkbox" name="enableMonitoring" checked={data.enableMonitoring} onChange={handleToggle} />
              <span className="slider round"></span>
            </label>
            <span>Enable monitoring and analytics</span>
          </div>
          <div className="deployment-toggle">
            <label className="switch">
              <input type="checkbox" name="sendNotifications" checked={data.sendNotifications} onChange={handleToggle} />
              <span className="slider round"></span>
            </label>
            <span>Send deployment notifications</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5_Publish;
