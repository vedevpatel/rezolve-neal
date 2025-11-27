import React, { useState } from 'react';
import './AgentExecutionPanel.css';

const AgentExecutionPanel = ({ agent }) => {
  const [url, setUrl] = useState('');
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Check if agent has web scraper enabled
  const hasWebScraper = agent.tools_enabled && agent.tools?.webScraper;

  const handleExecute = async () => {
    // Validate inputs based on whether web scraper is enabled
    if (hasWebScraper && !url.trim()) {
      setError('Please enter a URL to scrape');
      return;
    }

    if (!hasWebScraper && !input.trim()) {
      setError('Please enter input for the agent');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);
    setCurrentUrl(hasWebScraper ? url : null);

    try {
      const inputData = hasWebScraper
        ? { input: input || 'Analyze this webpage', url: url }
        : { input: input };

      const response = await fetch(`http://localhost:8000/api/workflows/agent/${agent.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_data: inputData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute agent');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setInput('');
    setResult(null);
    setError(null);
    setCurrentUrl(null);
  };

  return (
    <div className="agent-execution-panel">
      <div className="execution-header">
        <h3>Test Your Agent</h3>
        <span className="agent-status">
          {agent.status === 'deployed' ? '🟢 Deployed' : '🟡 Draft'}
        </span>
      </div>

      <div className="execution-body">
        {hasWebScraper && (
          <div className="input-section">
            <label htmlFor="url-input">URL to Scrape *</label>
            <input
              type="url"
              id="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isExecuting}
              className="url-input-field"
            />
          </div>
        )}

        <div className="input-section">
          <label htmlFor="agent-input">
            {hasWebScraper ? 'Instructions (Optional)' : 'Input'}
          </label>
          <textarea
            id="agent-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasWebScraper ? "Additional instructions for processing the scraped data..." : "Enter your message or query for the agent..."}
            rows={hasWebScraper ? 2 : 4}
            disabled={isExecuting}
          />
        </div>

        {/* Real-time scraping status */}
        {isExecuting && currentUrl && (
          <div className="scraping-status">
            <div className="status-indicator">
              <span className="spinner-small"></span>
              <span className="status-text">Scraping: {currentUrl}</span>
            </div>
          </div>
        )}

        <div className="execution-actions">
          <button
            className="execute-btn"
            onClick={handleExecute}
            disabled={isExecuting || agent.status !== 'deployed'}
          >
            {isExecuting ? (
              <>
                <span className="spinner"></span>
                Executing...
              </>
            ) : (
              'Run Agent'
            )}
          </button>
          <button
            className="clear-btn"
            onClick={handleClear}
            disabled={isExecuting}
          >
            Clear
          </button>
        </div>

        {agent.status !== 'deployed' && (
          <div className="warning-banner">
            ⚠️ Agent must be deployed before execution. Set "Auto Deploy" in Step 5 or deploy manually.
          </div>
        )}

        {error && (
          <div className="error-banner">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <div className="result-header">
              <h4>Output</h4>
              <span className="processing-mode-badge">
                {result.output_data?.processing_mode || 'direct'}
              </span>
            </div>

            <div className="result-content">
              {result.output_data?.content ? (
                <pre className="result-text">{result.output_data.content}</pre>
              ) : (
                <p className="no-output">No output generated</p>
              )}
            </div>

            {result.output_data?.tool_results && Object.keys(result.output_data.tool_results).length > 0 && (
              <details className="tool-results-details">
                <summary>🔧 Tool Results</summary>
                <pre className="tool-results-json">
                  {JSON.stringify(result.output_data.tool_results, null, 2)}
                </pre>
              </details>
            )}

            <div className="execution-metadata">
              <span>⏱️ Started: {new Date(result.started_at).toLocaleTimeString()}</span>
              <span>✅ Completed: {new Date(result.completed_at).toLocaleTimeString()}</span>
              <span>🆔 Workflow ID: {result.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentExecutionPanel;
