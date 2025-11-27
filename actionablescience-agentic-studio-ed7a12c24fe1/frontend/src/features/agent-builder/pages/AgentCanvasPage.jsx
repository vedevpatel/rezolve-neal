import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ReactFlow, { useNodesState, useEdgesState, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import './AgentCanvasPage.css';

import { agentApi } from '../../../services/api';
import { getTemplateData } from '../data/templates';
import { transformAgentToFlow } from '../utils/flowTransformer';

// 1. Import the new, professional components
import CanvasHeader from '../components/canvas/CanvasHeader';
import ProfessionalNode from '../components/canvas/ProfessionalNode';
import AgentExecutionPanel from '../components/canvas/AgentExecutionPanel';

// 2. Register the 'professional' node type so React Flow knows how to render it
const nodeTypes = { professional: ProfessionalNode };

const AgentCanvasPage = () => {
  // 3. Extract id from params and type from the path
  const { id } = useParams();
  const location = useLocation();
  const type = location.pathname.includes('/template/') ? 'template' : 'agent';
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState(null);

  useEffect(() => {
    const loadFlowData = async () => {
      setLoading(true);
      try {
        let agentData;
        if (type === 'agent') {
          agentData = await agentApi.getAgentById(id);
        } else if (type === 'template') {
          agentData = getTemplateData(id);
        }
        
        if (agentData) {
          setAgentData(agentData); // Store agent data for execution panel

          const { nodes: flowNodes, edges: flowEdges } = transformAgentToFlow(agentData);

          // Add arrow markers to edges
          const edgesWithMarkers = flowEdges.map(edge => ({
            ...edge,
            markerEnd: {
              type: 'arrowclosed',
              color: '#b1b1b7',
            },
            style: { strokeWidth: 2, stroke: '#b1b1b7' }
          }));

          setNodes(flowNodes);
          setEdges(edgesWithMarkers);
        } else {
          console.error("No data found for this agent or template.");
        }
      } catch (error) {
        console.error("Failed to load flow data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFlowData();
  }, [type, id, setNodes, setEdges]);

  // Enhanced animation logic with green arrows
  const onNodeClick = useCallback((event, node) => {
    // Determine if this is an input, agent, or output node
    const nodeData = nodes.find(n => n.id === node.id)?.data;
    const variant = nodeData?.variant;

    let edgesToAnimate = [];

    if (variant === 'input') {
      // Input clicked: animate edge from input to agent (green arrow looping)
      edgesToAnimate = edges.filter((edge) => edge.source === node.id && edge.target === 'agent-center');
    } else if (variant === 'agent') {
      // Agent clicked: animate all edges from agent to outputs (green arrows looping)
      edgesToAnimate = edges.filter((edge) => edge.source === node.id);
    } else if (variant === 'output') {
      // Output clicked: animate edge from agent to this output
      edgesToAnimate = edges.filter((edge) => edge.target === node.id && edge.source === 'agent-center');
    }

    // Update edges with green animated arrows
    const updatedEdges = edges.map(edge => {
      const shouldAnimate = edgesToAnimate.some(e => e.id === edge.id);
      return {
        ...edge,
        animated: shouldAnimate,
        style: shouldAnimate
          ? { strokeWidth: 3, stroke: '#28a745' }
          : { strokeWidth: 2, stroke: '#b1b1b7' },
        markerEnd: {
          type: 'arrowclosed',
          color: shouldAnimate ? '#28a745' : '#b1b1b7',
        }
      };
    });

    setEdges(updatedEdges);

    // Reset after 3 seconds
    setTimeout(() => {
      setEdges(prevEdges => prevEdges.map(edge => ({
        ...edge,
        animated: false,
        style: { strokeWidth: 2, stroke: '#b1b1b7' },
        markerEnd: {
          type: 'arrowclosed',
          color: '#b1b1b7',
        }
      })));
    }, 3000);
  }, [edges, nodes, setEdges]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CanvasHeader />
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading Canvas...
        </div>
      </div>
    );
  }

  return (
    // 4. Implement the new layout with the header
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#f8f9fa' }}>
      <CanvasHeader />
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left side: Canvas */}
        <div style={{ flex: '1 1 60%', minWidth: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes} // Use the new professional node types
            fitView
            // 5. Set default edge options for a cleaner look
            defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2 } }}
          >
            {/* 6. Use the professional 'dots' background */}
            <Background variant="dots" gap={24} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Right side: Execution Panel (only for agents, not templates) */}
        {type === 'agent' && agentData && (
          <div style={{
            flex: '0 0 40%',
            overflow: 'auto',
            borderLeft: '1px solid #dee2e6',
            background: 'white'
          }}>
            <AgentExecutionPanel agent={agentData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCanvasPage;