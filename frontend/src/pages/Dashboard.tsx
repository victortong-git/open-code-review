// filepath: /docker/review-ui/frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  CodeBracketIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import type { AppDispatch, RootState } from '../store/store';
import { fetchProjectById, scanProject, getProjectStats } from '../features/projectSlice';
import { fetchFilesByProject, scanFile, toggleFileIgnore } from '../features/fileSlice';
import { fetchSecurityMetrics } from '../features/analysisSlice';
import { useToast } from '../context/ToastContext';
import DashboardCard from '../components/DashboardCard';
import FileList from '../components/FileList';
import FolderStructureView from '../components/FolderStructureView';
import SecurityDashboard from '../components/SecurityDashboard';
// SecurityTrends component temporarily unused but kept for future use
// @ts-ignore - Keeping import for future use
import SecurityTrends from '../components/SecurityTrends';
// CodeQualityMetrics will be used in the next version
// @ts-ignore - Keeping import for future reference
import CodeQualityMetrics from '../components/CodeQualityMetrics';
import FindingsDistribution from '../components/FindingsDistribution';
import VulnerabilityMatrix from '../components/VulnerabilityMatrix';

const Dashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // Default to files tab
  const [viewMode, setViewMode] = useState<'folder' | 'list'>('folder'); // Default to folder structure view
  
  const { currentProject, loading: projectLoading } = useSelector((state: RootState) => state.projects);
  const { files, loading: filesLoading } = useSelector((state: RootState) => state.files);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectById(parseInt(projectId)));
      dispatch(fetchFilesByProject(parseInt(projectId)));
      dispatch(getProjectStats(parseInt(projectId)));
    }
  }, [dispatch, projectId]);

  // Fetch security metrics only when switching to security or overview tab
  useEffect(() => {
    if (projectId && (activeTab === 'security' || activeTab === 'overview')) {
      dispatch(fetchSecurityMetrics(parseInt(projectId)));
    }
  }, [dispatch, projectId, activeTab]);

  const handleFileScan = (fileId: number) => {
    dispatch(scanFile({ fileId }));
    showToast('File scan initiated', 'info');
  };

  const handleFileToggleIgnore = (fileId: number) => {
    dispatch(toggleFileIgnore({ fileId }));
    showToast('File status update initiated', 'info');
  };

  const handleFileSelect = (file: any) => {
    navigate(`/files/${file.id}`);
  };

  const handleScanProject = () => {
    if (projectId) {
      showToast('Starting file discovery...', 'info');
      dispatch(scanProject(parseInt(projectId)))
        .unwrap()
        .then(() => {
          showToast('Files discovered successfully', 'success');
          // Refresh file list and stats after scan
          dispatch(fetchFilesByProject(parseInt(projectId)));
          dispatch(getProjectStats(parseInt(projectId)));
        })
        .catch((error: any) => {
          showToast(`Failed to discover files: ${error?.message || 'Unknown error'}`, 'error');
        });
    }
  };

  const handleRefreshStats = () => {
    if (projectId) {
      setRefreshingStats(true);
      dispatch(getProjectStats(parseInt(projectId)))
        .unwrap()
        .then(() => {
          showToast('Statistics refreshed', 'success');
        })
        .catch((error: any) => {
          showToast(`Failed to refresh stats: ${error?.message || 'Unknown error'}`, 'error');
        })
        .finally(() => {
          setTimeout(() => setRefreshingStats(false), 500); // Add small delay for better UX
        });
    }
  };

  // Wrapping content in tabs for better organization
  const renderTabContent = () => {
    if (refreshingStats) {
      return (
        <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Refreshing dashboard data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Project Progress Overview Card */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Progress</h2>
                <button 
                  onClick={handleRefreshStats}
                  className="btn btn-sm btn-secondary flex items-center"
                  disabled={refreshingStats}
                >
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              {/* File Processing Progress */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">File Discovery Progress</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round((discoveredFiles / Math.max(totalFiles, 1)) * 100)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {discoveredFiles} of {totalFiles} files
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.round((discoveredFiles / Math.max(totalFiles, 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Security Issues</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {criticalRiskFindings + highRiskFindings + mediumRiskFindings + lowRiskFindings}
                    </div>
                    {(criticalRiskFindings + highRiskFindings) > 0 && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                        Needs attention
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Unprocessed Files</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {files.filter(file => !file.processed).length}
                    </div>
                    {files.filter(file => !file.processed).length > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
                        Needs analysis
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ignored Files</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {ignoredFiles}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      case 'security':
        return (
          <>
            {projectId && <SecurityDashboard projectId={parseInt(projectId)} />}
            {projectId && <FindingsDistribution />}
            {projectId && <VulnerabilityMatrix />}
          </>
        );
      /* Code Quality tab removed for now - will be used in next version */
      case 'files':
        return (
          <div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FolderIcon className="h-6 w-6 text-blue-500 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Files</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
                  <button
                    onClick={() => setViewMode('folder')}
                    className={`p-2 rounded-md ${
                      viewMode === 'folder' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    title="Folder Structure View"
                  >
                    <FolderIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${
                      viewMode === 'list' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                    title="List View"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Browse all files in this project. Click on any file to view its details and security findings.
              </p>
              
              {viewMode === 'folder' ? (
                <FolderStructureView 
                  files={files}
                  onFileSelect={handleFileSelect}
                  onFileScan={handleFileScan}
                  onFileToggleIgnore={handleFileToggleIgnore}
                />
              ) : (
                <FileList 
                  files={files}
                  onFileSelect={handleFileSelect}
                  onFileScan={handleFileScan}
                  onFileToggleIgnore={handleFileToggleIgnore}
                />
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (projectLoading || filesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Project not found!</strong>
        <span className="block sm:inline"> Please select a valid project.</span>
      </div>
    );
  }

  // Calculate statistics
  const totalFiles = files.length;
  // Fix: Use processed flag instead of scanned flag for discovered files
  const discoveredFiles = files.filter(file => file.processed).length;
  const ignoredFiles = files.filter(file => file.is_ignored).length;

  // Use stats from the API if available, otherwise fallback to calculated values
  const criticalRiskFindings = currentProject.stats?.criticalRiskFindings || 0;
  const highRiskFindings = currentProject.stats?.highRiskFindings || 0;
  const mediumRiskFindings = currentProject.stats?.mediumRiskFindings || 0;
  const lowRiskFindings = currentProject.stats?.lowRiskFindings || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 mr-3">
                <CodeBracketIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProject.name}</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2 ml-12">{currentProject.description || 'No description provided'}</p>
            <div className="mt-2 ml-12 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Created: {new Date(currentProject.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Updated: {new Date(currentProject.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                Total Files: {totalFiles}
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2">
            <button
              onClick={handleScanProject}
              className="btn btn-primary flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-1" />
              Discover Files
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last scanned: {currentProject.updatedAt ? new Date(currentProject.updatedAt).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* File Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total Files"
          value={totalFiles}
          icon={<DocumentTextIcon className="h-full w-full" />}
          color="border-blue-500"
        />
        <DashboardCard
          title="Discovered Files"
          value={`${discoveredFiles} / ${totalFiles}`}
          icon={<CheckCircleIcon className="h-full w-full" />}
          color="border-green-500"
        />
        <DashboardCard
          title="Ignored Files"
          value={ignoredFiles}
          icon={<XCircleIcon className="h-full w-full" />}
          color="border-gray-500"
        />
        <DashboardCard
          title="Unprocessed Files"
          value={files.filter(file => !file.processed).length}
          icon={<DocumentTextIcon className="h-full w-full" />}
          color="border-orange-500"
        />
      </div>

      {/* Risk Finding Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Critical Risks"
          value={criticalRiskFindings}
          icon={<ExclamationCircleIcon className="h-full w-full" />}
          color="border-red-700" // Using a darker red for Critical
        />
        <DashboardCard
          title="High Risks"
          value={highRiskFindings}
          icon={<ExclamationCircleIcon className="h-full w-full" />}
          color="border-red-500"
        />
        <DashboardCard
          title="Medium Risks"
          value={mediumRiskFindings}
          icon={<ExclamationCircleIcon className="h-full w-full" />}
          color="border-yellow-500"
        />
        <DashboardCard
          title="Low Risks"
          value={lowRiskFindings}
          icon={<ExclamationCircleIcon className="h-full w-full" />}
          color="border-blue-500" // Using blue for Low risk
        />
      </div>

      {/* Dashboard Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Security Analysis
            </button>
            {/* Code Quality tab hidden for now - will be available in next version */}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Dashboard;
