'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, User, ArrowLeft, Workflow, Trash2 } from 'lucide-react';

const WorkflowBuilder = ({ workflowId: initialWorkflowId = null, onNavigateBack }) => {
  const [workflowId, setWorkflowId] = useState(initialWorkflowId);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [steps, setSteps] = useState([]);
  const [isPlaybook, setIsPlaybook] = useState(false);
  const [playbookDescription, setPlaybookDescription] = useState('');
  const [playbookSection, setPlaybookSection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define the same playbook sections as in HomeScreen
  const playbookSections = [
    { id: 'failing-to-close', title: 'Rep is failing to close deals' },
    { id: 'deals-drop-off', title: 'Deals drop off in negotiation' },
    { id: 'not-moving-forward', title: 'Rep is not moving deals forward in earlier stages' },
    { id: 'acv-off-whack', title: 'ACV off whack?' }
  ];

  // Load existing workflow data on component mount
  useEffect(() => {
    if (initialWorkflowId) {
      loadSpecificWorkflow(initialWorkflowId);
    } else {
      loadLatestWorkflow();
    }
  }, [initialWorkflowId]);

  const loadSpecificWorkflow = async (id) => {
    try {
      const response = await fetch(`/api/workflows/${id}`);
      const result = await response.json();
      
      if (result.workflow) {
        setWorkflowTitle(result.workflow.title);
        setSteps(result.workflow.steps);
        setIsPlaybook(result.workflow.isPlaybook || false);
        setPlaybookDescription(result.workflow.playbook_description || '');
        setPlaybookSection(result.workflow.playbookSection || '');
      } else {
        console.error('Workflow not found');
        setDefaultWorkflow();
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      setDefaultWorkflow();
    } finally {
      setIsLoading(false);
    }
  };

  const loadLatestWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows');
      const result = await response.json();
      
      if (result.workflows && result.workflows.length > 0) {
        // Load the most recent workflow (first in the array since they're ordered by createdAt desc)
        const latestWorkflow = result.workflows[0];
        setWorkflowId(latestWorkflow.id);
        setWorkflowTitle(latestWorkflow.title);
        setSteps(latestWorkflow.steps);
        setIsPlaybook(latestWorkflow.isPlaybook || false);
        setPlaybookDescription(latestWorkflow.playbook_description || '');
        setPlaybookSection(latestWorkflow.playbookSection || '');
      } else {
        // No existing workflows, set up default data
        setDefaultWorkflow();
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      setDefaultWorkflow();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultWorkflow = () => {
    setWorkflowTitle('After discovery calls');
    setSteps([
      {
        id: Date.now(),
        instruction: 'At 8pm, pull all the Gong recordings from the rep\'s discovery calls that day. Filter to only deals which have a next step set in Salesforce',
        executor: 'ai'
      }
    ]);
    setIsPlaybook(false);
    setPlaybookDescription('');
    setPlaybookSection('');
  };

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      instruction: '',
      executor: 'ai'
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id, field, value) => {
    setSteps(steps.map(step => {
      if (step.id === id) {
        const updatedStep = { ...step, [field]: value };
        // If switching from human to AI, remove the assignedHuman field
        if (field === 'executor' && value === 'ai') {
          delete updatedStep.assignedHuman;
        }
        // If switching to human and no human is assigned, default to first option
        if (field === 'executor' && value === 'human' && !step.assignedHuman) {
          updatedStep.assignedHuman = 'Femi Ibrahim';
        }
        return updatedStep;
      }
      return step;
    }));
  };

  const deleteStep = (id) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id));
    }
  };

  const saveWorkflow = async () => {
    // Basic validation
    if (!workflowTitle.trim()) {
      alert('Please enter a workflow title');
      return;
    }

    const hasEmptySteps = steps.some(step => !step.instruction.trim());
    if (hasEmptySteps) {
      alert('Please fill in all step instructions');
      return;
    }

    // If it's a playbook, require a section to be selected
    if (isPlaybook && !playbookSection) {
      alert('Please select a section for this playbook');
      return;
    }

    setIsSaving(true);
    
    try {
      const workflowData = {
        title: workflowTitle,
        steps: steps,
        isPlaybook: isPlaybook,
        playbook_description: playbookDescription,
        playbookSection: isPlaybook ? playbookSection : null
      };

      let response;
      
      if (workflowId) {
        // Update existing workflow
        response = await fetch(`/api/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowData)
        });
      } else {
        // Create new workflow
        response = await fetch('/api/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowData)
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        // If this was a new workflow, store the ID for future updates
        if (!workflowId && result.id) {
          setWorkflowId(result.id);
        }
        alert('Workflow saved successfully!');
        
        // If we have a navigation callback and this is a new workflow, navigate back
        if (onNavigateBack && !initialWorkflowId) {
          setTimeout(() => {
            onNavigateBack();
          }, 1000);
        }
      } else {
        alert('Error saving workflow: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving workflow: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Loading workflow...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              )}
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {workflowId ? 'Edit Workflow' : 'Create Workflow'}
                </h1>
              </div>
            </div>
            
            <button
              onClick={saveWorkflow}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSaving ? 'Saving...' : workflowId ? 'Update Workflow' : 'Save Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Title */}
        <div className="mb-6">
          <label htmlFor="workflowTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Title
          </label>
          <input
            id="workflowTitle"
            type="text"
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            placeholder="Enter workflow title..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Settings Section */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          </div>
          <div className="px-6 py-4">
            {/* Playbook Toggle */}
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isPlaybook"
                checked={isPlaybook}
                onChange={(e) => setIsPlaybook(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="isPlaybook" className="text-sm font-medium text-gray-700">
                This is a playbook
              </label>
            </div>

            {/* Playbook Section Selector */}
            {isPlaybook && (
              <div className="mb-4">
                <label htmlFor="playbookSection" className="block text-sm font-medium text-gray-700 mb-2">
                  Playbook Section
                </label>
                <select
                  id="playbookSection"
                  value={playbookSection}
                  onChange={(e) => setPlaybookSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a section...</option>
                  {playbookSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Playbook Description */}
            {isPlaybook && (
              <div>
                <label htmlFor="playbookDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Playbook Description
                </label>
                <textarea
                  id="playbookDescription"
                  value={playbookDescription}
                  onChange={(e) => setPlaybookDescription(e.target.value)}
                  placeholder="Enter a description for this playbook..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Steps Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Workflow Steps</h3>
              <button
                onClick={addStep}
                className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step Number */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      {/* Step Content */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        {/* Instruction Input */}
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(step.id, 'instruction', e.target.value)}
                          placeholder="Enter step instructions..."
                          className="w-full min-h-20 text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        />

                        {/* Executor and Actions */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Executor:</span>
                            <button
                              onClick={() => updateStep(step.id, 'executor', 'ai')}
                              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                step.executor === 'ai'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI</span>
                            </button>
                            
                            <button
                              onClick={() => updateStep(step.id, 'executor', 'human')}
                              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                step.executor === 'human'
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <User className="w-3 h-3" />
                              <span>Human</span>
                            </button>
                          </div>

                          {/* Delete Button */}
                          {steps.length > 1 && (
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="inline-flex items-center px-2 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Human Assignment */}
                        {step.executor === 'human' && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Assign to:
                            </label>
                            <select
                              value={step.assignedHuman || 'Femi Ibrahim'}
                              onChange={(e) => updateStep(step.id, 'assignedHuman', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                            >
                              <option value="Femi Ibrahim">Femi Ibrahim</option>
                              <option value="Jason Mao">Jason Mao</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-start ml-4 py-2">
                      <div className="w-px h-6 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Info */}
        {workflowId && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Status:</span> Editing existing workflow
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: {workflowId.slice(0, 8)}...
                  {isPlaybook && <span className="ml-2">• Playbook</span>}
                  {isPlaybook && playbookSection && (
                    <span className="ml-2">
                      • {playbookSections.find(s => s.id === playbookSection)?.title}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
