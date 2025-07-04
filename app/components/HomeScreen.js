// app/components/HomeScreen.js
'use client'

import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Trash2, Calendar, Sparkles, User, Play, Pause, BookOpen } from 'lucide-react';

const HomeScreen = ({ onNavigateToWorkflow, onCreateNew }) => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load workflows and playbooks in parallel
      const [workflowsResponse, playbooksResponse] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/playbooks')
      ]);
      
      const workflowsResult = await workflowsResponse.json();
      const playbooksResult = await playbooksResponse.json();
      
      if (workflowsResult.workflows) {
        setWorkflows(workflowsResult.workflows);
      }
      if (playbooksResult.playbooks) {
        setPlaybooks(playbooksResult.playbooks);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId, workflowTitle) => {
    if (!confirm(`Are you sure you want to delete "${workflowTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(workflowId);
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the workflow from the local state
        setWorkflows(workflows.filter(w => w.id !== workflowId));
      } else {
        alert('Error deleting workflow: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting workflow: ' + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleWorkflowStatus = async (workflowId, currentStatus) => {
    setUpdatingStatus(workflowId);
    
    try {
      const response = await fetch(`/api/workflows/${workflowId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRunning: !currentStatus
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update the local state based on active tab
        if (activeTab === 'workflows') {
          setWorkflows(workflows.map(w => 
            w.id === workflowId 
              ? { ...w, isRunning: !currentStatus }
              : w
          ));
        } else {
          setPlaybooks(playbooks.map(p => 
            p.id === workflowId 
              ? { ...p, isRunning: !currentStatus }
              : p
          ));
        }
      } else {
        alert('Error updating workflow status: ' + result.error);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Error updating workflow status: ' + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getStepsSummary = (steps) => {
    if (!steps || steps.length === 0) return 'No steps';
    
    const aiSteps = steps.filter(step => step.executor === 'ai').length;
    const humanSteps = steps.filter(step => step.executor === 'human').length;
    
    const parts = [];
    if (aiSteps > 0) parts.push(`${aiSteps} AI step${aiSteps > 1 ? 's' : ''}`);
    if (humanSteps > 0) parts.push(`${humanSteps} human step${humanSteps > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const renderWorkflowCard = (workflow, isPlaybook = false) => (
    <div
      key={workflow.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Workflow Title and Status */}
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {workflow.title}
            </h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              workflow.isRunning 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {workflow.isRunning ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Running</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>Paused</span>
                </>
              )}
            </div>
          </div>
          
          {/* Steps Summary */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <span>{getStepsSummary(workflow.steps)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Updated {formatDate(workflow.updatedAt)}</span>
            </div>
          </div>

          {/* First Step Preview */}
          {workflow.steps && workflow.steps.length > 0 && (
            <div className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 mb-3">
              <div className="flex items-start space-x-2">
                {workflow.steps[0].executor === 'ai' ? (
                  <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                )}
                <span className="line-clamp-2">
                  {workflow.steps[0].instruction}
                </span>
              </div>
              {workflow.steps.length > 1 && (
                <div className="text-xs text-gray-500 mt-2">
                  +{workflow.steps.length - 1} more step{workflow.steps.length > 2 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Playbook Description */}
          {isPlaybook && workflow.playbook_description && (
            <div className="text-sm text-gray-600 italic bg-blue-50 rounded-md p-3 border-l-4 border-blue-200">
              {workflow.playbook_description}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Run/Pause Button */}
          <button
            onClick={() => handleToggleWorkflowStatus(workflow.id, workflow.isRunning)}
            disabled={updatingStatus === workflow.id}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors font-medium text-sm ${
              updatingStatus === workflow.id
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : workflow.isRunning
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {updatingStatus === workflow.id ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Updating...</span>
              </>
            ) : workflow.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run</span>
              </>
            )}
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => onNavigateToWorkflow(workflow.id)}
            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            <span className="text-sm font-medium">Edit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {/* Delete Button - Only show for regular workflows, not playbooks */}
          {!isPlaybook && (
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.title)}
              disabled={isDeleting === workflow.id}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                isDeleting === workflow.id
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-800 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isDeleting === workflow.id ? 'Deleting...' : 'Delete'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderEmptyState = (type) => {
    if (type === 'workflows') {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No workflows yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first workflow</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      );
    } else {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No playbooks available</h3>
          <p className="text-gray-600">Playbooks are pre-built workflow templates you can use as starting points</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentData = activeTab === 'workflows' ? workflows : playbooks;
  const isPlaybookView = activeTab === 'playbooks';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Builder</h1>
          <p className="text-gray-600">Create and manage your automated workflows</p>
        </div>

        {/* Tab Selector */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('workflows')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'workflows'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Workflows
              </button>
              <button
                onClick={() => setActiveTab('playbooks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'playbooks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Playbooks
              </button>
            </nav>
          </div>
        </div>

        {/* Create New Workflow Button - Only show for My Workflows */}
        {activeTab === 'workflows' && (
          <div className="mb-8">
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Workflow</span>
            </button>
          </div>
        )}

        {/* Content */}
        {currentData.length === 0 ? (
          renderEmptyState(activeTab)
        ) : (
          <div className="grid gap-4">
            {currentData.map((item) => renderWorkflowCard(item, isPlaybookView))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
