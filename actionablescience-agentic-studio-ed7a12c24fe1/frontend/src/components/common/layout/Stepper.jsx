import React from 'react';
import './Stepper.css'; // Add your own CSS for styling

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="stepper-container">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className={`step-item ${currentStep === index + 1 ? 'active' : ''}`}
        >
          <div className="step-number">{index + 1}</div>
          <div className="step-label">{step}</div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;