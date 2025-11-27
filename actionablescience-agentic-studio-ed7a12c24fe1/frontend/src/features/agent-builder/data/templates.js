// Mock data for the "Intake & Routing" template
const intakeRouting = {
  agent_name: 'Intake & Routing Agent',
  system_prompt: 'Automatically categorize incoming tickets, assign priority, and route to the optimal queue based on content analysis and team capacity.',
  inputs: [ { label: 'New Ticket Webhook' } ],
  outputs: [ { label: 'Assign to Team Queue' }, { label: 'Set Ticket Priority' } ],
  tools: {},
};

// Mock data for the "Major Incident Swarmer" template
const majorIncidentSwarmer = {
  agent_name: 'Major Incident Swarmer AI',
  system_prompt: 'You are the "Major Incident Swarmer AI", an ITSM expert for P1 incident response. Your mission: rapidly assemble teams, analyze data, and orchestrate resolution.',
  inputs: [ { label: 'Webhook: New P1 Incident' } ],
  outputs: [ { label: 'Create MS Teams Channel' }, { label: 'Notify Stakeholders' } ],
  tools: { 'Confluence': true, 'SharePoint': true },
};

// Mock data for the "Solution Identification" template
const solutionIdentification = {
  agent_name: 'Solution Identification Agent',
  system_prompt: 'Analyzes ticket content and searches historical resolutions, KB articles, and runbooks to provide ranked solution recommendations.',
  inputs: [ { label: 'Ticket Content Input' } ],
  outputs: [ { label: 'Ranked Solutions' }, { label: 'KB Article Links' } ],
  tools: { 'Knowledge Base': true, 'Historical Tickets': true },
};

// This function will be called by the canvas page
export const getTemplateData = (templateId) => {
  if (templateId === 'intake-routing') {
    return intakeRouting;
  }
  if (templateId === 'major-incident-swarmer') {
    return majorIncidentSwarmer;
  }
  if (templateId === 'solution-identification') {
    return solutionIdentification;
  }
  // Return null if no match is found
  return null;
};

