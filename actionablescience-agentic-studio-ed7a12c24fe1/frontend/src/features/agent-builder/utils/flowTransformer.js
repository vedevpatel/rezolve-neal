// This function converts raw agent data into a professional-looking flow
export const transformAgentToFlow = (agentData) => {
  if (!agentData) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];
  const baseSpacingY = 180; // Vertical spacing
  const baseSpacingX = 350; // Horizontal spacing

  // Helper function to get enabled tools as an array
  const getEnabledTools = (tools) => {
    if (!tools) return [];
    return Object.entries(tools)
      .filter(([_, enabled]) => enabled)
      .map(([toolName, _]) => toolName);
  };

  // Central Agent Node
  const enabledTools = getEnabledTools(agentData.tools);
  nodes.push({
    id: 'agent-center',
    type: 'professional', // Use our new node type
    position: { x: baseSpacingX, y: 200 },
    data: {
      variant: 'agent',
      agentName: agentData.agent_name,
      instructions: agentData.system_prompt || agentData.additional_instructions || '',
      tools: enabledTools,
      inputType: agentData.deployment_channel || 'Web',
    },
  });

  // Input Nodes
  (agentData.inputs || []).forEach((input, index) => {
    const id = `input-${index}`;
    nodes.push({
      id,
      type: 'professional',
      position: { x: 0, y: 100 + index * baseSpacingY },
      data: {
        variant: 'input',
        inputType: input.type || 'Text',
        label: input.label || 'Input Field',
        description: input.description || '',
        payload: input.payload || `{${input.label || 'data'}}`,
        query: input.query || '',
      }
    });
    edges.push({ id: `e-${id}-agent`, source: id, target: 'agent-center', type: 'smoothstep' });
  });

  // Output Nodes
  (agentData.outputs || []).forEach((output, index) => {
    const id = `output-${index}`;
    nodes.push({
      id,
      type: 'professional',
      position: { x: baseSpacingX * 2, y: 100 + index * baseSpacingY },
      data: {
        variant: 'output',
        outputType: output.type || 'Text',
        label: output.label || 'Output Field',
        description: output.description || '',
        tool: output.tool || null,
        toolDetails: output.toolDetails || '',
      }
    });
    edges.push({ id: `e-agent-${id}`, source: 'agent-center', target: id, type: 'smoothstep' });
  });

  return { nodes, edges };
};