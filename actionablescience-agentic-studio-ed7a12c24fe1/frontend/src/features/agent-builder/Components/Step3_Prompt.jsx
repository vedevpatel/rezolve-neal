import React from 'react';
import '../styles/Form.css'; // Reusing the shared form styles

const Step3_Prompt = ({ data, setData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prevData => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <p>Step 3 of 5</p>
        <h2>Prompt & Instructions</h2>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label htmlFor="systemPrompt">System Prompt *</label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            value={data.systemPrompt}
            onChange={handleChange}
            placeholder="You are a helpful assistant that..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="userPromptTemplate">User Prompt Template</label>
          <textarea
            id="userPromptTemplate"
            name="userPromptTemplate"
            value={data.userPromptTemplate}
            onChange={handleChange}
            placeholder="Template for user prompts with variables like {input}"
            rows={5}
          />
        </div>

        <div className="form-group">
          <label htmlFor="additionalInstructions">Additional Instructions</label>
          <textarea
            id="additionalInstructions"
            name="additionalInstructions"
            value={data.additionalInstructions}
            onChange={handleChange}
            placeholder="Any additional instructions or constraints"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default Step3_Prompt;