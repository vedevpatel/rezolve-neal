import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';

const CustomNode = ({ data }) => {
  return (
    <div className="custom-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-header">{data.name}</div>
      <div className="node-body">
        <strong>Instructions:</strong>
        <p>{data.instructions}</p>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(CustomNode);