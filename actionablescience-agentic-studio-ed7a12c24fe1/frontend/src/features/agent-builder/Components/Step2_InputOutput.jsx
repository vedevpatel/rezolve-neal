import React, { useState } from 'react';
import DynamicField from './DynamicField';
import ToolsSection from './ToolsSection';
import './Step2.css'; 

const Step2_InputOutput = ({ data, setData }) => {
  const [activeTab, setActiveTab] = useState('input');

  const handleFieldChange = (type, index, event) => {
    const { name, value } = event.target;
    const newFields = [...data[type]];
    newFields[index][name] = value;
    setData(prev => ({ ...prev, [type]: newFields }));
  };

  const addField = (type) => {
    const newField = { id: Date.now(), label: '', type: 'Text', description: '' };
    setData(prev => ({ ...prev, [type]: [...prev[type], newField] }));
  };

  const removeField = (type, index) => {
    const newFields = data[type].filter((_, i) => i !== index);
    setData(prev => ({ ...prev, [type]: newFields }));
  };
  
  const inputOptions = ["Text", "Number", "Email", "URL", "File", "Date"];
  const outputOptions = ["Text", "JSON", "HTML", "Markdown", "File"];

  return (
    <div className="form-container">
      <div className="form-header">
        <p>Step 2 of 5</p>
        <h2>Input & Output</h2>
      </div>

      <div className="io-card">
        <div className="io-tabs">
          <button
            className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            Input
          </button>
          <button
            className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
        </div>

        {activeTab === 'input' && (
          <div className="tab-content">
            <div className="fields-header">
              <h3>Input Fields</h3>
              <button className="add-btn" onClick={() => addField('inputs')}>
                + Add Input
              </button>
            </div>
            {data.inputs.map((field, index) => (
              <DynamicField
                key={field.id}
                index={index}
                fieldData={field}
                onChange={(e) => handleFieldChange('inputs', index, e)}
                onRemove={() => removeField('inputs', index)}
                options={inputOptions}
              />
            ))}
            <ToolsSection data={data} setData={setData} />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="tab-content">
            <div className="fields-header">
              <h3>Output Fields</h3>
              <button className="add-btn" onClick={() => addField('outputs')}>
                + Add Output
              </button>
            </div>
            {data.outputs.map((field, index) => (
              <DynamicField
                key={field.id}
                index={index}
                fieldData={field}
                onChange={(e) => handleFieldChange('outputs', index, e)}
                onRemove={() => removeField('outputs', index)}
                options={outputOptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2_InputOutput;