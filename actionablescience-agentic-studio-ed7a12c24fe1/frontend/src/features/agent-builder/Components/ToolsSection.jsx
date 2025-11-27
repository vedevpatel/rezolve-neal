const ToolsSection = ({ data, setData }) => {
  const handleToggle = (e) => {
    setData(prev => ({ ...prev, toolsEnabled: e.target.checked }));
  };

  // Uncomment when you add MCP tools
  // const handleToolChange = (e) => {
  //   const { name, checked } = e.target;
  //   setData(prev => ({
  //     ...prev,
  //     tools: { ...prev.tools, [name]: checked }
  //   }));
  // };

  return (
    <>
      <div className="toggle-section">
        <label className="switch">
          <input type="checkbox" checked={data.toolsEnabled} onChange={handleToggle} />
          <span className="slider round"></span>
        </label>
        <span>Enable Tools</span>
      </div>
      
      {data.toolsEnabled && (
        <div className="tools-card">
          <h4>Available Tools</h4>
          <p className="tools-info">
            No MCP tools are currently registered. Add tools to the backend following the DEVELOPER_GUIDE.md.
          </p>
          <div className="tools-placeholder">
            <div className="placeholder-message">
              <p>Once you add MCP tools to the backend, they will appear here automatically.</p>
              <p className="placeholder-hint">
                Example tools: Slack, Jira, Database connectors, API clients, etc.
              </p>
            </div>
          </div>

          {/* Uncomment and customize when you add your first MCP tool */}
          {/*
          <div className="tools-grid">
            <div className="tool-item">
              <label className="mini-switch">
                <input type="checkbox" name="yourToolName" checked={data.tools.yourToolName} onChange={handleToolChange} />
                <span className="mini-slider round"></span>
              </label>
              <span>Your Tool Name</span>
            </div>
          </div>
          */}
        </div>
      )}
    </>
  );
};

export default ToolsSection;