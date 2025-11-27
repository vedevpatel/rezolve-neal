import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Stepper from '../../../components/common/layout/Stepper';
import Step1_BasicInfo from '../Components/Step1_BasicInfo';
import Step2_InputOutput from '../Components/Step2_InputOutput';
import Step3_Prompt from '../Components/Step3_Prompt';
import Step4_Context from '../Components/Step4_Context';
import Step5_Publish from '../Components/Step5_Publish';
import NavigationButtons from '../Components/NavigationButtons';
import { agentApi } from '../../../services/api';
import { getTemplateData } from '../data/templates';

const AgentBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get agent ID from URL query params or location state
  const queryAgentId = searchParams.get('id');

  // Get pre-fill data from location state (for editing agents)
  const preFillData = location.state?.agentData;
  const isEditMode = location.state?.isEditMode || !!queryAgentId;
  const editingAgentId = location.state?.agentId || queryAgentId;

  const [agentData, setAgentData] = useState({
    // Step 1
    agentName: '',
    description: '',
    expectedOutcome: '',
    deploymentChannel: '',

    // Step 2
    inputs: [{ id: Date.now(), label: '', type: 'Text', description: '' }],
    outputs: [{ id: Date.now() + 1, label: '', type: 'Text', description: '' }],
    toolsEnabled: false,
    tools: {
      webScraper: false,
      emailSender: false,
      databaseQuery: false,
      restApiClient: false,
    },
    // Web Scraper Configuration
    webScraperConfig: {
      outputProcessing: 'summary', // Options: raw, summary, rag
      outputFormat: 'text',
      outputDestinations: ['context'], // Options: context, email, webhook, database
    },
    
    // Step 3
    systemPrompt: '',
    userPromptTemplate: '',
    additionalInstructions: '',

    // Step 4
    memoryEnabled: true,
    temperature: 0.7,
    maxTokens: 2048,

    // Step 5
    autoDeploy: true,
    enableMonitoring: true,
    sendNotifications: true,
  });

  // Fetch agent data from URL query param
  useEffect(() => {
    const fetchAgentData = async () => {
      if (queryAgentId && !preFillData) {
        setIsLoading(true);
        try {
          const agent = await agentApi.getAgentById(queryAgentId);
          setAgentData({
            agentName: agent.agent_name || '',
            description: agent.description || '',
            expectedOutcome: agent.expected_outcome || '',
            deploymentChannel: agent.deployment_channel || '',
            inputs: agent.inputs || [{ id: Date.now(), label: '', type: 'Text', description: '' }],
            outputs: agent.outputs || [{ id: Date.now() + 1, label: '', type: 'Text', description: '' }],
            toolsEnabled: agent.tools_enabled ?? false,
            tools: agent.tools || {
              webScraper: false,
              emailSender: false,
              databaseQuery: false,
              restApiClient: false,
            },
            webScraperConfig: agent.web_scraper_config || {
              outputProcessing: 'summary',
              outputFormat: 'text',
              outputDestinations: ['context'],
            },
            systemPrompt: agent.system_prompt || '',
            userPromptTemplate: agent.user_prompt_template || '',
            additionalInstructions: agent.additional_instructions || '',
            memoryEnabled: agent.memory_enabled ?? true,
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.max_tokens || 2048,
            autoDeploy: agent.auto_deploy ?? true,
            enableMonitoring: agent.enable_monitoring ?? true,
            sendNotifications: agent.send_notifications ?? true,
          });
        } catch (error) {
          console.error('Failed to fetch agent:', error);
          alert('Failed to load agent data. Please try again.');
          navigate('/agent-builder');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAgentData();
  }, [queryAgentId, preFillData, navigate]);

  // Pre-fill data effect when editing an agent via location state
  useEffect(() => {
    if (preFillData) {
      setAgentData({
        agentName: preFillData.agent_name || preFillData.agentName || '',
        description: preFillData.description || '',
        expectedOutcome: preFillData.expected_outcome || preFillData.expectedOutcome || '',
        deploymentChannel: preFillData.deployment_channel || preFillData.deploymentChannel || '',
        inputs: preFillData.inputs || [{ id: Date.now(), label: '', type: 'Text', description: '' }],
        outputs: preFillData.outputs || [{ id: Date.now() + 1, label: '', type: 'Text', description: '' }],
        toolsEnabled: preFillData.tools_enabled ?? preFillData.toolsEnabled ?? false,
        tools: preFillData.tools || {
          webScraper: false,
          emailSender: false,
          databaseQuery: false,
          restApiClient: false,
        },
        webScraperConfig: preFillData.web_scraper_config || preFillData.webScraperConfig || {
          outputProcessing: 'summary',
          outputFormat: 'text',
          outputDestinations: ['context'],
        },
        systemPrompt: preFillData.system_prompt || preFillData.systemPrompt || '',
        userPromptTemplate: preFillData.user_prompt_template || preFillData.userPromptTemplate || '',
        additionalInstructions: preFillData.additional_instructions || preFillData.additionalInstructions || '',
        memoryEnabled: preFillData.memory_enabled ?? preFillData.memoryEnabled ?? true,
        temperature: preFillData.temperature ?? 0.7,
        maxTokens: preFillData.max_tokens || preFillData.maxTokens || 2048,
        autoDeploy: preFillData.auto_deploy ?? preFillData.autoDeploy ?? true,
        enableMonitoring: preFillData.enable_monitoring ?? preFillData.enableMonitoring ?? true,
        sendNotifications: preFillData.send_notifications ?? preFillData.sendNotifications ?? true,
      });
    }
  }, [preFillData]);

  const steps = [
    'Basic Information',
    'Input & Output',
    'Prompt & Instructions',
    'Context & Memory',
    'Publish & Deploy',
  ];
  const totalSteps = steps.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Logic for the final "Publish" action - save to backend
      setIsSubmitting(true);
      try {
        // Transform frontend data format to match backend schema
        const backendData = {
          agent_name: agentData.agentName,
          description: agentData.description,
          expected_outcome: agentData.expectedOutcome,
          deployment_channel: agentData.deploymentChannel,
          inputs: agentData.inputs,
          outputs: agentData.outputs,
          tools: agentData.tools,
          tools_enabled: agentData.toolsEnabled,
          web_scraper_config: agentData.webScraperConfig,
          system_prompt: agentData.systemPrompt,
          user_prompt_template: agentData.userPromptTemplate,
          additional_instructions: agentData.additionalInstructions,
          memory_enabled: agentData.memoryEnabled,
          temperature: agentData.temperature,
          max_tokens: agentData.maxTokens,
          auto_deploy: agentData.autoDeploy,
          enable_monitoring: agentData.enableMonitoring,
          send_notifications: agentData.sendNotifications,
        };

        if (isEditMode && editingAgentId) {
          // Update existing agent
          await agentApi.updateAgent(editingAgentId, backendData);
          console.log('Agent updated successfully');
        } else {
          // Create new agent
          const createdAgent = await agentApi.createAgent(backendData);
          console.log('Agent created successfully:', createdAgent);
        }
        navigate('/agent-builder', { state: { defaultTab: 'myAgents' } });
      } catch (error) {
        console.error(`Failed to ${isEditMode ? 'update' : 'create'} agent:`, error);
        alert(`Failed to ${isEditMode ? 'update' : 'create'} agent. Please try again.`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1_BasicInfo data={agentData} setData={setAgentData} />;
      case 2:
        return <Step2_InputOutput data={agentData} setData={setAgentData} />;
      case 3:
        return <Step3_Prompt data={agentData} setData={setAgentData} />;
      case 4:
        return <Step4_Context data={agentData} setData={setAgentData} />;
      case 5:
        return <Step5_Publish data={agentData} setData={setAgentData} />;
      default:
        return <Step1_BasicInfo data={agentData} setData={setAgentData} />;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          agentData.agentName.trim() !== '' &&
          agentData.description.trim() !== '' &&
          agentData.expectedOutcome.trim() !== '' &&
          agentData.deploymentChannel !== ''
        );
      case 2:
        // If tools are enabled, inputs/outputs are optional (tools provide their own I/O)
        if (agentData.toolsEnabled) {
          return true;
        }
        // Otherwise, require at least one valid input and output
        const allInputsValid = agentData.inputs.every(input => input.label.trim() !== '');
        const allOutputsValid = agentData.outputs.every(output => output.label.trim() !== '');
        return allInputsValid && allOutputsValid;
      case 3:
        return agentData.systemPrompt.trim() !== '';
      case 4:
      case 5:
        return true;
      default:
        return false;
    }
  };

  const isNextButtonDisabled = !isStepValid() || isSubmitting;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading agent data...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Stepper steps={steps} currentStep={currentStep} />

      <main style={{ flexGrow: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.8rem', fontWeight: 600 }}>
          {isEditMode ? 'Edit Agent' : 'Create New Agent'}
        </h1>
        <div style={{ flexGrow: 1 }}>
          {renderStepContent()}
        </div>

        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isNextDisabled={isNextButtonDisabled}
        />
      </main>
    </div>
  );
};

export default AgentBuilderPage; 
