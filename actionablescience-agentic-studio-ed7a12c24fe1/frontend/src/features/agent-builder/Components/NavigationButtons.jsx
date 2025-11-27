import React from 'react';
import './NavigationButtons.css';

// Accept a new prop: isNextDisabled
const NavigationButtons = ({ currentStep, totalSteps, onPrevious, onNext, isNextDisabled }) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="nav-buttons-container">
      <button
        className="nav-button prev-button"
        onClick={onPrevious}
        disabled={isFirstStep}
      >
        &larr; Previous
      </button>

      <button
        className="nav-button next-button"
        onClick={onNext}
        // Use the new prop here
        disabled={isNextDisabled}
      >
        {isLastStep ? 'Publish' : 'Next'} &rarr;
      </button>
    </div>
  );
};

export default NavigationButtons;