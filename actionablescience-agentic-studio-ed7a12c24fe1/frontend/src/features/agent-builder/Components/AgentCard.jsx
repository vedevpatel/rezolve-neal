import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import './AgentCard.css';

// A simple robot icon component
const RobotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8V8H12Z" />
    <path d="M16 8V4H12V8H16Z" />
    <path d="M12 18H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7Z" />
    <path d="M6 18v2" />
    <path d="M18 18v2" />
  </svg>
);


const AgentCard = ({ agent }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate(); // 2. Initialize the navigate function

  const handleCardClick = () => {
    // 3. Navigate to the dynamic canvas route for this agent
    navigate(`/agent-builder/canvas/agent/${agent.id}`);
  };

  return (
    // 4. Add the onClick handler to the main div
    <div 
      className="agent-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {isHovered && (
        <div className="agent-card-overlay">
          {/* The button can also use the same onClick if needed */}
          <button className="use-agent-btn" onClick={handleCardClick}>Use this agent</button>
        </div>
      )}

      <div className="agent-card-header">
        <div className="agent-icon-wrapper">
          <RobotIcon />
        </div>
        <h4>{agent.agent_name}</h4>
      </div>
      <p className="agent-description">{agent.description}</p>
      <div className="agent-card-tags">
        <span className="tag">{agent.deployment_channel}</span>
        <span className="tag custom-tag">Custom</span>
      </div>
    </div>
  );
};

export default AgentCard;

