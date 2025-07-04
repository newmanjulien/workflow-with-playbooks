'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, User, ArrowLeft, Workflow, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

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

  const moveStepUp = (index) => {
    if (index > 0) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const moveStepDown = (index) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setSteps(newSteps);
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
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon-container">
              <div className="loading-spinner"></div>
              <div className="loading-icon">
                <Workflow className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="loading-text-primary">Loading workflow...</p>
              <p className="loading-text-secondary">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-inner">
            <div className="flex items-center space-x-4">
              {onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="nav-back-button"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              )}
              <div>
                <h1 className="heading-primary text-center flex-1">
                  {workflowId ? 'Edit Workflow' : 'Create Workflow'}
                </h1>
              </div>
            </div>
            
            <button
              onClick={saveWorkflow}
              disabled={isSaving}
              className={`btn-primary btn-md ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : workflowId ? 'Update Workflow' : 'Save Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 section-spacing">
        {/* Workflow Title */}
        <div className="mb-6">
          <label htmlFor="workflowTitle" className="form-label">
            Workflow Title
          </label>
          <input
            id="workflowTitle"
            type="text"
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            placeholder="Enter workflow title..."
            className="form-input"
          />
        </div>

        {/* Settings Section */}
        <div className="mb-8 card">
          <div className="card-header">
            <h3 className="heading-secondary">Settings</h3>
          </div>
          <div className="card-body">
            {/* Playbook Toggle */}
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isPlaybook"
                checked={isPlaybook}
                onChange={(e) => setIsPlaybook(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="isPlaybook" className="text-label">
                This is a playbook
              </label>
            </div>

            {/* Playbook Section Selector */}
            {isPlaybook && (
              <div className="mb-4">
                <label htmlFor="playbookSection" className="form-label">
                  Playbook Section
                </label>
                <select
                  id="playbookSection"
                  value={playbookSection}
                  onChange={(e) => setPlaybookSection(e.target.value)}
                  className="form-select"
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
                <label htmlFor="playbookDescription" className="form-label">
                  Playbook Description
                </label>
                <textarea
                  id="playbookDescription"
                  value={playbookDescription}
                  onChange={(e) => setPlaybookDescription(e.target.value)}
                  placeholder="Enter a description for this playbook..."
                  rows={3}
                  className="form-textarea"
                />
              </div>
            )}
          </div>
        </div>

        {/* Steps Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex-between">
              <h3 className="heading-secondary">Workflow Steps</h3>
              <button
                onClick={addStep}
                className="btn-primary btn-sm btn-icon-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </div>
          </div>
          
          <div className="card-body">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step Number and Move Controls */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex-center text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      {/* Move Up/Down Controls */}
                      <div className="step-move-controls">
                        <button
                          onClick={() => moveStepUp(index)}
                          disabled={index === 0}
                          className={`step-move-btn ${index === 0 ? 'step-move-btn-disabled' : ''}`}
                          title="Move step up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveStepDown(index)}
                          disabled={index === steps.length - 1}
                          className={`step-move-btn ${index === steps.length - 1 ? 'step-move-btn-disabled' : ''}`}
                          title="Move step down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      {/* Step Content */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        {/* Instruction Input */}
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(step.id, 'instruction', e.target.value)}
                          placeholder="Enter step instructions..."
                          className="form-textarea-lg"
                        />

                        {/* Executor and Actions */}
                        <div className="mt-4 flex-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted">Executor:</span>
                            <button
                              onClick={() => updateStep(step.id, 'executor', 'ai')}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === 'ai'
                                  ? 'btn-status-active'
                                  : 'btn-secondary'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI</span>
                            </button>
                            
                            <button
                              onClick={() => updateStep(step.id, 'executor', 'human')}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === 'human'
                                  ? 'bg-gray-800 text-white'
                                  : 'btn-secondary'
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
                              className="btn-sm btn-icon-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {/* Human Assignment */}
                        {step.executor === 'human' && (
                          <div className="mt-3">
                            <label className="form-label-sm">
                              Assign to:
                            </label>
                            <select
                              value={step.assignedHuman || 'Femi Ibrahim'}
                              onChange={(e) => updateStep(step.id, 'assignedHuman', e.target.value)}
                              className="form-input-sm"
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
      </div>
    </div>
  );
};

export default WorkflowBuilder;
