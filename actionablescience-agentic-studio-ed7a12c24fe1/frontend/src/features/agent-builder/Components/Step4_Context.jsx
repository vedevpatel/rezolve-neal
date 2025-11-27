import React from 'react';
import '../styles/Form.css'; // Reusing the shared form styles
import './Step4.css';       // New styles for this component

const Step4_Context = ({ data, setData }) => {
  const handleToggle = (e) => {
    setData(prev => ({ ...prev, memoryEnabled: e.target.checked }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Use parseFloat for numbers, but keep it as a string while editing
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Convert to number on blur to ensure correct data type
    setData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <p>Step 4 of 5</p>
        <h2>Context & Memory</h2>
      </div>

      <div className="form-card">
        <div className="card-section-title">Context & Memory Settings</div>
        
        {/* Enable Memory Toggle */}
        <div className="toggle-section-step4">
          <label className="switch">
            <input
              type="checkbox"
              name="memoryEnabled"
              checked={data.memoryEnabled}
              onChange={handleToggle}
            />
            <span className="slider round"></span>
          </label>
          <span>Enable Memory</span>
        </div>

        {/* Memory Size Input (Conditional) */}
        {data.memoryEnabled && (
          <div className="form-group">
            <label htmlFor="memorySize">Memory Size (Tokens)</label>
            <input
              type="number"
              id="memorySize"
              name="memorySize"
              // Note: You may need to add memorySize to your agentData state
              // value={data.memorySize || 1000} 
              // onChange={handleChange}
              // onBlur={handleBlur}
              placeholder="1000"
            />
          </div>
        )}

        {/* Temperature Input */}
        <div className="form-group">
          <label htmlFor="temperature">Temperature</label>
          <input
            type="number"
            id="temperature"
            name="temperature"
            min="0"
            max="1"
            step="0.1"
            value={data.temperature}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        {/* Max Tokens Input */}
        <div className="form-group">
          <label htmlFor="maxTokens">Max Tokens</label>
          <input
            type="number"
            id="maxTokens"
            name="maxTokens"
            min="256"
            max="4096"
            step="1"
            value={data.maxTokens}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  );
};

export default Step4_Context;