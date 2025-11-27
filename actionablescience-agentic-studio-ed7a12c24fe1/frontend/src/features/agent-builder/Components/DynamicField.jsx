import React from 'react';

const DynamicField = ({ index, fieldData, onChange, onRemove, options }) => {
  return (
    <div className="field-card">
      <div className="field-row">
        <div className="form-group">
          <label>Label</label>
          <input
            type="text"
            name="label"
            value={fieldData.label}
            onChange={onChange}
            placeholder="Input label"
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select name="type" value={fieldData.type} onChange={onChange}>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          name="description"
          value={fieldData.description}
          onChange={onChange}
          placeholder="Input description"
        />
      </div>
      <div className="field-footer">
        <button className="remove-btn" onClick={onRemove}>
          &times; Remove
        </button>
      </div>
    </div>
  );
};

export default DynamicField;