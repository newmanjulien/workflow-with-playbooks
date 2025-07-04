// app/components/HomeScreen.js
'use client'

import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Trash2, Calendar, Sparkles, User, Play, Pause, BookOpen, Workflow, ChevronDown, ChevronRight, Clock, Zap } from 'lucide-react';

const HomeScreen = ({ onNavigateToWorkflow, onCreateNew }) => {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [activeSection, setActiveSection] = useState('workflows'); // 'workflows' or 'playbooks'
  const [activePlaybookSection, setActivePlaybookSection] = useState('failing-to-close'); // Active playbook subsection

  // Define playbook subsections with enhanced styling
  const playbookSections = [
    {
      id: 'failing-to-close',
      title: 'Rep is failing to close deals',
      description: 'Comprehensive playbooks designed to help sales reps overcome common obstacles in the deal closure process, including objection handling, pricing negotiations, and timing issues.',
      icon: '🎯',
      color: 'from-red-500 to-pink-500'
    },
    {
      id: 'deals-drop-off',
      title: 'Deals drop off in negotiation',
      description: 'Strategic approaches to prevent deal abandonment during critical negotiation phases, with focus on maintaining momentum and addressing buyer concerns.',
      icon: '⚡',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'not-moving-forward',
      title: 'Rep is not moving deals forward in earlier stages',
      description: 'Tactical workflows to accelerate deal progression through discovery, qualification, and proposal stages with systematic follow-up strategies.',
      icon: '🚀',
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'acv-off-whack',
      title: 'ACV optimization strategies',
      description: 'Data-driven approaches to optimize Annual Contract Value through upselling, cross-selling, and strategic pricing adjustments.',
      icon: '💰',
      color: 'from-green-500 to-teal-500'
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
        // Update the local state
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
    if (aiSteps > 0) parts.push(`${aiSteps} AI step${aiSteps > 1 ? 's' : ''}`);
    if (humanSteps > 0) parts.push(`${humanSteps} human step${humanSteps > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  // Get playbooks for a specific subsection - NOW USES REAL DATA
  const getPlaybooksForSection = (sectionId) => {
    const playbooks = workflows.filter(workflow => workflow.isPlaybook === true);
    
    // Filter playbooks by their actual playbookSection field
    return playbooks.filter(playbook => playbook.playbookSection === sectionId);
  };

  // Get actual count of playbooks for each section
  const getPlaybookCountForSection = (sectionId) => {
    return getPlaybooksForSection(sectionId).length;
  };
  
  // Filter workflows based on active section
  const filteredWorkflows = workflows.filter(workflow => {
    if (activeSection === 'playbooks') {
      return workflow.isPlaybook === true;
    } else {
      return workflow.isPlaybook !== true; // Show non-playbook workflows (undefined or false)
    }
  });

  const renderWorkflowCard = (workflow, isPlaybook = false) => (
    <div
      key={workflow.id}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Status Badge */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                workflow.isRunning 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${workflow.isRunning ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                <span>{workflow.isRunning ? 'Active' : 'Paused'}</span>
              </div>
              {isPlaybook && (
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <BookOpen className="w-3 h-3" />
                  <span>Playbook</span>
                </div>
              )}
            </div>
            
            {/* Workflow Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
              {workflow.title}
            </h3>
            
            {/* Steps Summary with Icons */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <Workflow className="w-4 h-4 text-blue-500" />
                <span>{getStepsSummary(workflow.steps)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Updated {formatDate(workflow.updatedAt)}</span>
              </div>
            </div>

            {/* First Step Preview */}
            {workflow.steps && workflow.steps.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    workflow.steps[0].executor === 'ai' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}>
                    {workflow.steps[0].executor === 'ai' ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {workflow.steps[0].executor === 'ai' ? 'AI Step' : 'Human Step'}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {workflow.steps[0].instruction}
                    </p>
                  </div>
                </div>
                {workflow.steps.length > 1 && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center space-x-1">
                    <Plus className="w-3 h-3" />
                    <span>{workflow.steps.length - 1} more step{workflow.steps.length > 2 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Playbook Description */}
            {isPlaybook && workflow.playbook_description && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Playbook Description</p>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {workflow.playbook_description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-6">
            {/* Run/Pause Button */}
            <button
              onClick={() => handleToggleWorkflowStatus(workflow.id, workflow.isRunning)}
              disabled={updatingStatus === workflow.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm shadow-sm ${
                updatingStatus === workflow.id
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : workflow.isRunning
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/20'
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
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-transparent shadow-sm"
            >
              <span>Edit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {/* Delete Button */}
            {!isPlaybook && (
              <button
                onClick={() => handleDeleteWorkflow(workflow.id, workflow.title)}
                disabled={isDeleting === workflow.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium text-sm border shadow-sm ${
                  isDeleting === workflow.id
                    ? 'text-gray-400 cursor-not-allowed border-gray-200'
                    : 'text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 border-red-200 hover:border-transparent'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting === workflow.id ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaybookSection = (section) => {
    const sectionPlaybooks = getPlaybooksForSection(section.id);
    const isActive = activePlaybookSection === section.id;
    const playbookCount = getPlaybookCountForSection(section.id);
    
    return (
      <div key={section.id} className="border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Section Header */}
        <button
          onClick={() => setActivePlaybookSection(isActive ? null : section.id)}
          className="w-full px-6 py-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} text-white text-xl shadow-lg`}>
              {section.icon}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {section.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {playbookCount} playbook{playbookCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300'} transition-colors`} />
            {isActive ? (
              <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
        </button>
        
        {/* Section Content */}
        {isActive && (
          <div className="px-6 pb-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            {/* Section Description */}
            <div className="py-4">
              <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-xl p-4 border border-gray-200">
                {section.description}
              </p>
            </div>
            
            {/* Playbooks */}
            <div className="space-y-4">
              {sectionPlaybooks.length > 0 ? (
                sectionPlaybooks.map((playbook) => renderWorkflowCard(playbook, true))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 mb-4">
                    <BookOpen className="w-12 h-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-500 text-sm">No playbooks in this section yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = (sectionName) => (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="text-gray-400 mb-6">
        {sectionName === 'workflows' ? (
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        ) : (
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        {sectionName === 'workflows' ? 'Ready to automate?' : 'No playbooks yet'}
      </h3>
      <p className="text-gray-600 text-lg">
        {sectionName === 'workflows' 
          ? 'Create your first workflow and start automating your processes' 
          : 'This section is waiting for your first playbook'
        }
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Workflow Builder
              </h1>
              <p className="text-gray-600 text-lg mt-1">Create and manage your automated workflows</p>
            </div>
          </div>
        </div>

        {/* Section Selector */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 bg-white rounded-2xl p-2 w-fit shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveSection('workflows')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeSection === 'workflows'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>My Workflows</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeSection === 'workflows' 
                  ? 'bg-white bg-opacity-20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {filteredWorkflows.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSection('playbooks')}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeSection === 'playbooks'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Playbooks</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeSection === 'playbooks' 
                  ? 'bg-white bg-opacity-20 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {workflows.filter(w => w.isPlaybook).length}
              </span>
            </button>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === 'workflows' ? (
          <>
            {/* Create New Workflow Button */}
            <div className="mb-8">
              <button
                onClick={onCreateNew}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium text-lg shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Workflow</span>
              </button>
            </div>

            {/* Workflows List */}
            {filteredWorkflows.length === 0 ? (
              renderEmptyState('workflows')
            ) : (
              <div className="grid gap-6">
                {filteredWorkflows.map((workflow) => renderWorkflowCard(workflow, false))}
              </div>
            )}
          </>
        ) : (
          /* Playbooks Section with Subsections */
          <div className="space-y-6">
            {playbookSections.map((section) => renderPlaybookSection(section))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
