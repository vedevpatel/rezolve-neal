import React from 'react';
import './WebScraperConfig.css';

const WebScraperConfig = ({ data, setData }) => {
  const handleOutputProcessingChange = (mode) => {
    setData(prev => ({
      ...prev,
      webScraperConfig: { ...prev.webScraperConfig, outputProcessing: mode }
    }));
  };

  const handleOutputFormatChange = (format) => {
    setData(prev => ({
      ...prev,
      webScraperConfig: { ...prev.webScraperConfig, outputFormat: format }
    }));
  };

  const handleDestinationToggle = (destination) => {
    const destinations = data.webScraperConfig.outputDestinations;
    const newDestinations = destinations.includes(destination)
      ? destinations.filter(d => d !== destination)
      : [...destinations, destination];

    setData(prev => ({
      ...prev,
      webScraperConfig: { ...prev.webScraperConfig, outputDestinations: newDestinations }
    }));
  };

  return (
    <div className="web-scraper-config">
      <div className="info-banner" style={{ marginBottom: '20px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>URLs will be provided when you execute the agent. Configure how the scraped data should be processed below.</span>
      </div>

      <div className="config-section">
        <h4>Output Processing</h4>
        <p className="help-text">Choose how the agent should process scraped data</p>

        <div className="processing-options">
          <label className="processing-option">
            <input
              type="radio"
              name="outputProcessing"
              value="raw"
              checked={data.webScraperConfig.outputProcessing === 'raw'}
              onChange={() => handleOutputProcessingChange('raw')}
            />
            <div className="option-content">
              <span className="option-name">Raw Markdown</span>
              <span className="option-desc">Return scraped content as-is without processing</span>
            </div>
          </label>

          <label className="processing-option">
            <input
              type="radio"
              name="outputProcessing"
              value="summary"
              checked={data.webScraperConfig.outputProcessing === 'summary'}
              onChange={() => handleOutputProcessingChange('summary')}
            />
            <div className="option-content">
              <span className="option-name">AI Summary</span>
              <span className="option-desc">Use LLM to summarize and extract key information</span>
            </div>
          </label>

          <label className="processing-option">
            <input
              type="radio"
              name="outputProcessing"
              value="rag"
              checked={data.webScraperConfig.outputProcessing === 'rag'}
              onChange={() => handleOutputProcessingChange('rag')}
            />
            <div className="option-content">
              <span className="option-name">RAG (Contextual Analysis)</span>
              <span className="option-desc">Process with agent's context and answer specific questions</span>
            </div>
          </label>
        </div>
      </div>

      <div className="config-section">
        <h4>Output Format</h4>
        <p className="help-text">Choose data format for the final output</p>

        <div className="format-options">
          {['markdown', 'json', 'text'].map(format => (
            <label key={format} className="format-option">
              <input
                type="radio"
                name="outputFormat"
                value={format}
                checked={data.webScraperConfig.outputFormat === format}
                onChange={() => handleOutputFormatChange(format)}
              />
              <span className="format-label">{format.charAt(0).toUpperCase() + format.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="config-section">
        <h4>Output Destinations</h4>
        <p className="help-text">Where should the scraped data be sent? (Select multiple)</p>

        <div className="destination-options">
          <label className="destination-checkbox">
            <input
              type="checkbox"
              checked={data.webScraperConfig.outputDestinations.includes('context')}
              onChange={() => handleDestinationToggle('context')}
            />
            <div className="destination-info">
              <span className="destination-name">Agent Context/Memory</span>
              <span className="destination-desc">Data will be available for agent processing</span>
            </div>
          </label>

          <label className="destination-checkbox">
            <input
              type="checkbox"
              checked={data.webScraperConfig.outputDestinations.includes('email')}
              onChange={() => handleDestinationToggle('email')}
            />
            <div className="destination-info">
              <span className="destination-name">Email</span>
              <span className="destination-desc">Send scraped data via email</span>
            </div>
          </label>

          <label className="destination-checkbox">
            <input
              type="checkbox"
              checked={data.webScraperConfig.outputDestinations.includes('webhook')}
              onChange={() => handleDestinationToggle('webhook')}
            />
            <div className="destination-info">
              <span className="destination-name">Webhook</span>
              <span className="destination-desc">POST data to a webhook URL</span>
            </div>
          </label>

          <label className="destination-checkbox">
            <input
              type="checkbox"
              checked={data.webScraperConfig.outputDestinations.includes('database')}
              onChange={() => handleDestinationToggle('database')}
            />
            <div className="destination-info">
              <span className="destination-name">Database</span>
              <span className="destination-desc">Store in connected database</span>
            </div>
          </label>
        </div>
      </div>

      <div className="info-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Scraped data will be available to the agent for processing before being sent to output destinations.</span>
      </div>
    </div>
  );
};

export default WebScraperConfig;
