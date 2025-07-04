'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, User, ArrowLeft } from 'lucide-react';

const WorkflowBuilder = ({ workflowId: initialWorkflowId = null, onNavigateBack }) => {
  const [workflowId, setWorkflowId] = useState(initialWorkflowId);
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [steps, setSteps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    setIsSaving(true);
    
    try {
      const workflowData = {
        title: workflowTitle,
        steps: steps
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Workflows</span>
            </button>
          )}
          
          {/* Workflow Title */}
          <input
            type="text"
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:px-2 focus:py-1 focus:rounded transition-all cursor-text hover:bg-gray-100"
          />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Step Box */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Instruction Input */}
                <textarea
                  value={step.instruction}
                  onChange={(e) => updateStep(step.id, 'instruction', e.target.value)}
                  placeholder="Enter instructions in natural language..."
                  className="w-full min-h-24 text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-400"
                />

                {/* Executor Selector */}
                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => updateStep(step.id, 'executor', 'ai')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      step.executor === 'ai'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>AI agent</span>
                  </button>
                  
                  <button
                    onClick={() => updateStep(step.id, 'executor', 'human')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      step.executor === 'human'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Human</span>
                  </button>
                </div>

                {/* Human Assignment Selector (only show when executor is human) */}
                {step.executor === 'human' && (
                  <div className="mt-3">
                    <select
                      value={step.assignedHuman || 'Femi Ibrahim'}
                      onChange={(e) => updateStep(step.id, 'assignedHuman', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="Femi Ibrahim">Femi Ibrahim</option>
                      <option value="Jason Mao">Jason Mao</option>
                    </select>
                    <div className="mt-1 text-xs text-gray-500 italic">
                      {step.assignedHuman || 'Femi Ibrahim'} will handle this
                    </div>
                  </div>
                )}

                {/* Delete Step Button (only show if more than 1 step) */}
                {steps.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => deleteStep(step.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Delete Step
                    </button>
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-4">
                  <div className="w-px h-8 bg-red-300"></div>
                </div>
              )}
            </div>
          ))}

          {/* Add Step Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={addStep}
              className="flex items-center justify-center w-10 h-10 bg-white border-2 border-red-300 rounded-full hover:bg-red-50 hover:border-red-400 transition-colors group"
            >
              <Plus className="w-5 h-5 text-red-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-12 flex justify-center">
          <button 
            onClick={saveWorkflow}
            disabled={isSaving}
            className={`px-6 py-2 rounded-md transition-colors font-medium ${
              isSaving 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : workflowId ? 'Update Workflow' : 'Save Workflow'}
          </button>
        </div>

        {/* Status indicator */}
        {workflowId && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Editing existing workflow (ID: {workflowId.slice(0, 8)}...)
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
