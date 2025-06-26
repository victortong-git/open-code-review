import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DocumentTextIcon, 
  ChevronLeftIcon, 
  CodeBracketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TagIcon,
  PencilIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ClockIcon,
  IdentificationIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { AppDispatch, RootState } from '../store/store';
import { fetchFileById, updateFileAsync, updateFileMD5Async, markFileProcessedAsync } from '../features/fileSlice';
import { fetchFindingsByFile, deleteFinding, deleteAllFindingsByFile } from '../features/findingSlice';
import AnalysisPanel from '../components/AnalysisPanel';
import type { Finding } from '../features/findingSlice';
import { useToast } from '../context/ToastContext';
import { formatTimeAgo } from '../utils/dateUtils';

// Helper function to determine language from filename
const getLanguageFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'txt': 'text',
  };
  
  return languageMap[extension] || 'text';
};

const FileDetail: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  
  const { currentFile, loading: fileLoading } = useSelector((state: RootState) => state.files);
  // Remove unused code snippets state since we're focusing on findings now
  const { findings, loading: findingsLoading } = useSelector((state: RootState) => state.findings);
  // Get analysis status to detect when analysis completes
  const { analysisStatus } = useSelector((state: RootState) => state.analysis);
  
  const [isEditing, setIsEditing] = useState(false);
  const [fileFormData, setFileFormData] = useState({
    description: '',
    initial_security_review: '',
    initial_coding_quality: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fileId) {
      const id = parseInt(fileId);
      dispatch(fetchFileById(id));
      dispatch(fetchFindingsByFile(id));
    }
  }, [dispatch, fileId]);

  useEffect(() => {
    if (currentFile) {
      setFileFormData({
        description: currentFile.description || '',
        initial_security_review: currentFile.initial_security_review || '',
        initial_coding_quality: currentFile.initial_coding_quality || '',
      });
    }
  }, [currentFile]);

  // Watch for analysis status changes to refresh file info when analysis completes
  useEffect(() => {
    if (fileId && analysisStatus[parseInt(fileId)]?.status === 'completed') {
      // Refresh file info to get any updates after analysis
      dispatch(fetchFileById(parseInt(fileId)));
    }
  }, [fileId, analysisStatus, dispatch]);

  // Listen for analysis completion events from AnalysisPanel
  useEffect(() => {
    const handleAnalysisCompleted = (event: CustomEvent) => {
      if (fileId && event.detail.fileId === parseInt(fileId)) {
        // Refresh findings and file data
        dispatch(fetchFindingsByFile(parseInt(fileId)));
        dispatch(fetchFileById(parseInt(fileId)));
      }
    };

    // Add event listener
    window.addEventListener('analysisCompleted', handleAnalysisCompleted as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('analysisCompleted', handleAnalysisCompleted as EventListener);
    };
  }, [dispatch, fileId]);

  const handleBackToProject = () => {
    if (currentFile?.project_id) {
      navigate(`/dashboard/${currentFile.project_id}`);
    } else {
      navigate('/');
    }
  };

  const handleFileEdit = () => {
    setIsEditing(true);
  };

  const handleFileUpdate = async () => {
    if (!currentFile || !fileId) return;
    
    setIsLoading(true);
    try {
      await dispatch(updateFileAsync({
        id: parseInt(fileId),
        ...fileFormData
      })).unwrap();
      setIsEditing(false);
      showToast('File information updated successfully', 'success');
    } catch (error: any) {
      showToast(`Failed to update file: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMD5 = async () => {
    if (!fileId) return;
    
    setIsLoading(true);
    try {
      await dispatch(updateFileMD5Async(parseInt(fileId))).unwrap();
      showToast('File MD5 updated successfully', 'success');
    } catch (error: any) {
      showToast(`Failed to update MD5: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkProcessed = async () => {
    if (!fileId) return;
    
    setIsLoading(true);
    try {
      await dispatch(markFileProcessedAsync(parseInt(fileId))).unwrap();
      showToast('File marked as processed', 'success');
    } catch (error: any) {
      showToast(`Failed to mark file as processed: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualReview = async () => {
    if (!fileId) return;
    
    setIsLoading(true);
    try {
      await dispatch(fetchFindingsByFile(parseInt(fileId))).unwrap();
      showToast('Findings refreshed successfully', 'success');
    } catch (error: any) {
      showToast(`Failed to refresh findings: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFinding = (data: Partial<Finding>) => {
    // This will route to the finding creation page with md5 hash
    navigate('/findings/new', { 
      state: { 
        initialData: {
          ...data,
          file_id: currentFile?.id,
          md5: currentFile?.md5
        } 
      } 
    });
  };

  const handleDeleteAllFindings = async () => {
    if (!fileId || !currentFile) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${findings.length} findings for "${currentFile.file_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await dispatch(deleteAllFindingsByFile(parseInt(fileId))).unwrap();
      showToast(`Successfully deleted ${result.response.deletedCount} findings for ${currentFile.file_name}`, 'success');
      
      // Refresh findings to ensure UI is updated
      dispatch(fetchFindingsByFile(parseInt(fileId)));
    } catch (error: any) {
      showToast(`Failed to delete findings: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (fileLoading || !currentFile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={handleBackToProject}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Project
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-8 w-8 mr-2 text-blue-500" />
              {currentFile.file_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentFile.file_path}
            </p>
            
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <IdentificationIcon className="h-4 w-4 mr-1 text-gray-500" />
                ID: {currentFile.id}
              </div>
              
              {currentFile.createdAt && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                  Created: {formatTimeAgo(currentFile.createdAt)}
                </div>
              )}
              
              {currentFile.updatedAt && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <ClockIcon className="h-4 w-4 mr-1 text-gray-500" />
                  Updated: {formatTimeAgo(currentFile.updatedAt)}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {currentFile.file_type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {currentFile.file_type}
                </span>
              )}
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                currentFile.scanned
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {currentFile.scanned ? 'Scanned' : 'Not Scanned'}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                currentFile.is_ignored
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {currentFile.is_ignored ? 'Ignored' : 'Monitored'}
              </span>
              
              {currentFile.processed !== undefined && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                  currentFile.processed
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {currentFile.processed ? 'Processed' : 'Unprocessed'}
                </span>
              )}
              
              {currentFile.md5 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  MD5: {currentFile.md5}
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleFileEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Info
                </button>
                
                <button
                  onClick={handleUpdateMD5}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={isLoading}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Update MD5
                </button>
                
                <button
                  onClick={handleMarkProcessed}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={isLoading || currentFile.processed}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Mark Processed
                </button>
                
                <button
                  onClick={handleManualReview}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={isLoading}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Refresh Findings
                </button>
                
                <button
                  onClick={() => handleAddFinding({ 
                    type: '', 
                    description: '',
                    severity: 'medium',
                    status: 'new'
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  Add Finding
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFileUpdate}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={fileFormData.description}
                onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Security Review
              </label>
              <textarea
                rows={3}
                value={fileFormData.initial_security_review}
                onChange={(e) => setFileFormData({ ...fileFormData, initial_security_review: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Security considerations for this file..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Coding Quality
              </label>
              <textarea
                rows={3}
                value={fileFormData.initial_coding_quality}
                onChange={(e) => setFileFormData({ ...fileFormData, initial_coding_quality: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Code quality assessment..."
              />
            </div>
          </div>
        ) : (
          <>
            {(currentFile.description || currentFile.initial_security_review || currentFile.initial_coding_quality) && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFile.description && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {currentFile.description}
                    </p>
                  </div>
                )}
                
                {currentFile.initial_security_review && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-1 text-blue-500" />
                      Security Review
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {currentFile.initial_security_review}
                    </p>
                  </div>
                )}
                
                {currentFile.initial_coding_quality && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <CodeBracketIcon className="h-5 w-5 mr-1 text-blue-500" />
                      Coding Quality
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {currentFile.initial_coding_quality}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Analysis Panel */}
      {currentFile && currentFile.id && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2 text-blue-500" />
            AI Secure Code Review
          </h2>
          <AnalysisPanel fileId={currentFile.id} />
        </div>
      )}
      
      {/* Findings Stats Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ExclamationCircleIcon className="h-6 w-6 mr-2 text-blue-500" />
          Security Findings
        </h2>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {findings.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Findings</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {findings.filter(f => f.severity === 'critical').length}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">Critical</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {findings.filter(f => f.severity === 'high').length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">High</div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {findings.filter(f => f.severity === 'medium').length}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium</div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {findings.filter(f => f.severity === 'low').length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Low</div>
            </div>
          </div>
          
          {findings.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => handleAddFinding({
                  type: '',
                  description: '',
                  severity: 'medium',
                  status: 'new',
                  md5: currentFile.md5
                })}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                Add Finding
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CodeBracketIcon className="h-6 w-6 mr-2 text-blue-500" />
              File Content
            </h2>
            <div className="mt-4">
              <SyntaxHighlighter
                language={getLanguageFromFilename(currentFile.file_name)}
                style={vscDarkPlus}
                wrapLines={true}
                showLineNumbers={true}
                customStyle={{ fontSize: '0.9rem', borderRadius: '0.375rem' }}
              >
                {currentFile.content || '// No content available'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-yellow-500" />
                Findings List
              </h2>
              {findings.length > 0 && (
                <button
                  onClick={handleDeleteAllFindings}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {isLoading ? 'Deleting...' : 'Delete All Findings'}
                </button>
              )}
            </div>
            {findingsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : findings.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No findings found for this file</p>
                <button
                  onClick={() => handleAddFinding({
                    type: '',
                    description: '',
                    severity: 'medium',
                    status: 'new',
                    md5: currentFile.md5
                  })}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  Add First Finding
                </button>
              </div>
            ) : (
              <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {findings
                    .slice() // Create a copy to avoid mutating the original array
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by creation date, newest first
                    .map((finding) => (
                    <li key={finding.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 mr-2">
                              {finding.id}
                            </span>
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              finding.severity === 'critical' ? 'bg-red-600' : 
                              finding.severity === 'high' ? 'bg-red-500' : 
                              finding.severity === 'medium' ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            } mr-2`}></div>
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {finding.type}
                            </p>
                          </div>
                          <div className="mt-1">
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                              {finding.description.length > 100 
                                ? `${finding.description.substring(0, 100)}...` 
                                : finding.description}
                            </p>
                          </div>
                          <div className="flex mt-2 text-xs text-gray-500">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                              finding.severity === 'critical' || finding.severity === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : finding.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {finding.severity}
                            </span>
                            <span className="mx-1.5">•</span>
                            <span>{finding.status}</span>
                            {finding.createdAt && (
                              <>
                                <span className="mx-1.5">•</span>
                                <span title={new Date(finding.createdAt).toLocaleString()}>{formatTimeAgo(finding.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/findings/${finding.id}/edit`)}
                              className="inline-flex items-center rounded-full p-1.5 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                              title="Edit Finding"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this finding?')) {
                                  dispatch(deleteFinding(finding.id));
                                }
                              }}
                              className="inline-flex items-center rounded-full p-1.5 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                              title="Delete Finding"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/findings/${finding.id}`)}
                              className="inline-flex items-center rounded-full p-1.5 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetail;
