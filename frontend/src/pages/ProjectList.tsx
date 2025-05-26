import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FolderIcon, 
  DocumentMagnifyingGlassIcon, 
  CodeBracketIcon, 
  ViewColumnsIcon,
  ListBulletIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import type { AppDispatch, RootState } from '../store/store';
import { fetchProjects, scanAllProjects, getProjectStats } from '../features/projectSlice';
import type { Project } from '../features/projectSlice';

const ProjectList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading, error } = useSelector((state: RootState) => state.projects);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Add a new useEffect to fetch stats for each project when projects list changes
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Create a Set to track projects we've already fetched stats for
      const projectIdsWithStats = new Set(
        projects.filter(project => project.stats).map(project => project.id)
      );
      
      // Only fetch stats for projects that don't have stats yet
      projects.forEach(project => {
        if (!projectIdsWithStats.has(project.id)) {
          dispatch(getProjectStats(project.id));
        }
      });
    }
  }, [projects, dispatch]);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setScanError(null);
      setScanResult(null);
      
      const resultAction = await dispatch(scanAllProjects());
      
      if (scanAllProjects.fulfilled.match(resultAction)) {
        setScanResult(resultAction.payload);
        // Fetch the updated projects list
        await dispatch(fetchProjects());
      } else if (scanAllProjects.rejected.match(resultAction)) {
        setScanError(resultAction.payload as string || 'Failed to scan projects');
      }
    } catch (err) {
      setScanError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // Format date as "MMM DD, YYYY"
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !isScanning) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !scanError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <div className="flex space-x-4">
          {/* View toggle buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center px-3 py-1.5 rounded-md ${
                viewMode === 'card' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <ViewColumnsIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <ListBulletIcon className="h-4 w-4 mr-1" />
              <span className="text-sm">List</span>
            </button>
          </div>
          
          {/* Scan button */}
          <button 
            className="btn btn-primary flex items-center"
            onClick={handleScan}
            disabled={isScanning}
          >
            <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-1" />
            {isScanning ? 'Discovering...' : 'Discover Projects'}
          </button>
        </div>
      </div>

      {scanError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Scan Error!</strong>
          <span className="block sm:inline"> {scanError}</span>
        </div>
      )}
      
      {scanResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">{scanResult.message}</strong>
          <span className="block sm:inline"> Scanned {scanResult.scannedProjects?.length || 0} projects</span>
          {scanResult.scannedProjects && scanResult.scannedProjects.length > 0 && (
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer font-medium">View Details</summary>
                <ul className="mt-2 pl-5">
                  {scanResult.scannedProjects.map((project: any) => (
                    <li key={project.projectId}>
                      <span className="font-medium">{project.projectName}</span>: {project.filesCount} files
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-10">
          <FolderIcon className="h-16 w-16 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by scanning your projects directory.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="btn btn-primary flex items-center"
              onClick={handleScan}
              disabled={isScanning}
            >
              <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-1" />
              {isScanning ? 'Discovering...' : 'Discover Projects'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 flex flex-col h-full"
                >
                  {/* Card Header with Project Title */}
                  <div className="px-5 pt-5 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                          <CodeBracketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">{project.name}</h2>
                      </div>
                      
                      {/* Risk Indicator Badge */}
                      {project.stats && (project.stats.criticalRiskFindings > 0 || project.stats.highRiskFindings > 0) && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          project.stats.criticalRiskFindings > 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {project.stats.criticalRiskFindings > 0 ? 'Critical Risk' : 'High Risk'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mt-2 mb-1 text-sm line-clamp-2 min-h-[2.5rem]">
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                  
                  {/* Stats Section with Progress Indicator */}
                  <div className="px-5 pb-3">
                    {project.stats ? (
                      <>
                        {/* File Processing Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Processing Progress</span>
                            <span>{Math.round((project.stats.scannedFiles / Math.max(project.stats.totalFiles, 1)) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.round((project.stats.scannedFiles / Math.max(project.stats.totalFiles, 1)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Total Files</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{project.stats.totalFiles}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Processed</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{project.stats.scannedFiles}</span>
                          </div>
                        </div>
                        
                        {/* Security Findings */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 mb-4">
                          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">SECURITY FINDINGS</h3>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                project.stats.criticalRiskFindings > 0 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs font-bold">{project.stats.criticalRiskFindings || 0}</span>
                              </div>
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Critical</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                project.stats.highRiskFindings > 0 
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs font-bold">{project.stats.highRiskFindings || 0}</span>
                              </div>
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">High</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                project.stats.mediumRiskFindings > 0 
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs font-bold">{project.stats.mediumRiskFindings || 0}</span>
                              </div>
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Medium</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                project.stats.lowRiskFindings > 0 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs font-bold">{project.stats.lowRiskFindings || 0}</span>
                              </div>
                              <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Low</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center items-center h-36 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4">
                        <div className="animate-pulse flex flex-col items-center">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
                          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Loading stats...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Footer */}
                  <div className="mt-auto px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      <span>Updated: {formatDate(project.updatedAt)}</span>
                    </div>
                    <Link
                      to={`/dashboard/${project.id}`}
                      className="btn bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md flex items-center gap-1 transition"
                    >
                      <span>Dashboard</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* List View - Keeping the existing implementation */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stats
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.map((project: Project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CodeBracketIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {project.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.stats ? (
                          <div className="flex flex-col space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                              Files: {project.stats.totalFiles}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                Critical: {project.stats.criticalRiskFindings || 0}
                                {project.stats.criticalRiskFindings > 0 && <ExclamationCircleIcon className="h-3 w-3 ml-1" />}
                            </span>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                High: {project.stats.highRiskFindings || 0}
                                {project.stats.highRiskFindings > 0 && <ExclamationCircleIcon className="h-3 w-3 ml-1" />}
                            </span>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                Medium: {project.stats.mediumRiskFindings || 0}
                            </span>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                Low: {project.stats.lowRiskFindings || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(project.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/dashboard/${project.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-end"
                        >
                          <span className="mr-1">Dashboard</span>
                          <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList;
