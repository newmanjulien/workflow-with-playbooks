// app/components/HomeScreen.js
'use client'

import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Trash2, Calendar, Sparkles, User, Play, Pause, BookOpen, Workflow, ChevronDown, ChevronRight, Clock, Zap, MoreHorizontal } from 'lucide-react';

const HomeScreen = ({ onNavigateToWorkflow, onCreateNew }) => {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [activeSection, setActiveSection] = useState('workflows');
  const [activePlaybookSection, setActivePlaybookSection] = useState(null);

  // Define playbook subsections
  const playbookSections = [
    {
      id: 'failing-to-close',
      title: 'Rep is failing to close deals',
      description: 'Comprehensive playbooks designed to help sales reps overcome common obstacles in the deal closure process, including objection handling, pricing negotiations, and timing issues.',
      icon: '🎯',
    },
    {
      id: 'deals-drop-off',
      title: 'Deals drop off in negotiation',
      description: 'Strategic approaches to prevent deal abandonment during critical negotiation phases, with focus on maintaining momentum and addressing buyer concerns.',
      icon: '⚡',
    },
    {
      id: 'not-moving-forward',
      title: 'Rep is not moving deals forward in earlier stages',
      description: 'Tactical workflows to accelerate deal progression through discovery, qualification, and proposal stages with systematic follow-up strategies.',
      icon: '🚀',
    },
    {
      id: 'acv-off-whack',
      title: 'ACV optimization strategies',
      description: 'Data-driven approaches to optimize Annual Contract Value through upselling, cross-selling, and strategic pricing adjustments.',
      icon: '💰',
    }
  ];

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const result = await response.json();
      
      if (result.workflows) {
        setWorkflows(result.workflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
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
        setWorkflows(workflows.map(w => 
          w.id === workflowId 
            ? { ...w, isRunning: !currentStatus }
            : w
        ));
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
    if (aiSteps > 0) parts.push(`${aiSteps} AI`);
    if (humanSteps > 0) parts.push(`${humanSteps} Human`);
    
    return parts.join(', ');
  };

  const getPlaybooksForSection = (sectionId) => {
    const playbooks = workflows.filter(workflow => workflow.isPlaybook === true);
    return playbooks.filter(playbook => playbook.playbookSection === sectionId);
  };

  const getPlaybookCountForSection = (sectionId) => {
    return getPlaybooksForSection(sectionId).length;
  };
  
  const filteredWorkflows = workflows.filter(workflow => {
    if (activeSection === 'playbooks') {
      return workflow.isPlaybook === true;
    } else {
      return workflow.isPlaybook !== true;
    }
  });

  const renderWorkflowRow = (workflow, isPlaybook = false) => (
    <tr key={workflow.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${workflow.isRunning ? 'bg-green-500' : 'bg-gray-300'}`} />
          
          {/* Workflow Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900">{workflow.title}</h3>
              {isPlaybook && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Playbook
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {workflow.steps && workflow.steps.length > 0 && workflow.steps[0].instruction}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          workflow.isRunning 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {workflow.isRunning ? 'Active' : 'Paused'}
        </span>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        {getStepsSummary(workflow.steps)}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        {formatDate(workflow.updatedAt)}
      </td>
      
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          {/* Run/Pause Button */}
          <button
            onClick={() => handleToggleWorkflowStatus(workflow.id, workflow.isRunning)}
            disabled={updatingStatus === workflow.id}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              updatingStatus === workflow.id
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : workflow.isRunning
                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {updatingStatus === workflow.id ? (
              'Updating...'
            ) : workflow.isRunning ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Run
              </>
            )}
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => onNavigateToWorkflow(workflow.id)}
            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
          
          {/* Delete Button */}
          {!isPlaybook && (
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.title)}
              disabled={isDeleting === workflow.id}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isDeleting === workflow.id
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting === workflow.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderPlaybookSection = (section) => {
    const sectionPlaybooks = getPlaybooksForSection(section.id);
    const isActive = activePlaybookSection === section.id;
    const playbookCount = getPlaybookCountForSection(section.id);
    
    return (
      <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
        {/* Section Header */}
        <button
          onClick={() => setActivePlaybookSection(isActive ? null : section.id)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{section.icon}</span>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{playbookCount} playbook{playbookCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {isActive ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {/* Section Content */}
        {isActive && (
          <div className="border-t border-gray-200">
            {/* Section Description */}
            <div className="px-6 py-4 bg-gray-50">
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
            
            {/* Playbooks Table */}
            {sectionPlaybooks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Playbook
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Steps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sectionPlaybooks.map((playbook) => renderWorkflowRow(playbook, true))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No playbooks in this section yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = (sectionName) => (
    <div className="text-center py-12">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
        {sectionName === 'workflows' ? (
          <Workflow className="w-6 h-6 text-gray-400" />
        ) : (
          <BookOpen className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {sectionName === 'workflows' ? 'No workflows yet' : 'No playbooks yet'}
      </h3>
      <p className="text-gray-500 mb-6">
        {sectionName === 'workflows' 
          ? 'Get started by creating your first workflow' 
          : 'Start by creating your first playbook'
        }
      </p>
      {sectionName === 'workflows' && (
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create workflow
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading workflows...</p>
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
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Workflows</h1>
              </div>
            </div>
            
            {activeSection === 'workflows' && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New workflow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('workflows')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'workflows'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workflows
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {workflows.filter(w => !w.isPlaybook).length}
              </span>
            </button>
            <button
              onClick={() => setActiveSection('playbooks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'playbooks'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Playbooks
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {workflows.filter(w => w.isPlaybook).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeSection === 'workflows' ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredWorkflows.length === 0 ? (
              renderEmptyState('workflows')
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workflow
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Steps
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWorkflows.map((workflow) => renderWorkflowRow(workflow, false))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {playbookSections.map((section) => renderPlaybookSection(section))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
