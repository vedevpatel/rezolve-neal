import React from 'react';
import '../styles/Form.css'; 

const Step1_BasicInfo = ({ data, setData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prevData => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <p>Step {1} of 5</p>
        <h2>Basic Information</h2>
      </div>
      
      <div className="form-card">
        <div className="form-group">
          <label htmlFor="agentName">Agent Name *</label>
          <input
            type="text"
            id="agentName"
            name="agentName"
            value={data.agentName}
            onChange={handleChange}
            placeholder="Enter agent name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={data.description}
            onChange={handleChange}
            placeholder="Describe what your agent does"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="expectedOutcome">Expected Outcome *</label>
          <textarea
            id="expectedOutcome"
            name="expectedOutcome"
            value={data.expectedOutcome}
            onChange={handleChange}
            placeholder="What should this agent accomplish?"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="deploymentChannel">Deployment Channel *</label>
          <select
            id="deploymentChannel"
            name="deploymentChannel"
            value={data.deploymentChannel}
            onChange={handleChange}
          >
            <option value="">Select deployment channel</option>
            <option value="slack">Slack</option>
            <option value="msteams">MS Teams</option>
            <option value="discord">Discord</option>
            <option value="webchat">Web Chat</option>
            <option value="api">HTTPS API</option>
            <option value="whatsapp">Whatsapp</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Step1_BasicInfo;