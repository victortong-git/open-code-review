import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DocumentTextIcon,
  ChevronLeftIcon,
  ShieldExclamationIcon,
  BoltIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { AppDispatch, RootState } from '../store/store';
import { fetchFileById, scanFile } from '../features/fileSlice';
import { fetchFindingsByFile, updateFindingStatus } from '../features/findingSlice';
import type { Finding } from '../features/findingSlice';
import { useToast } from '../context/ToastContext';

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

// Helper function to extract code snippet around a specific line
const getCodeSnippet = (content: string | undefined, lineNumber: number, contextLines: number = 5): string => {
  if (!content) return '';
  
  const lines = content.split('\n');
  const startLine = Math.max(0, lineNumber - contextLines);
  const endLine = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(startLine, endLine).join('\n');
};

// This commented function can be used for future enhancements to highlight text matches
// const highlightMatchesInText = (text: string, searchTerm: string): React.ReactNode[] => {
//   if (!searchTerm || !text) {
//     return [<span key="0">{text}</span>];
//   }
// 
//   const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
//   return parts.map((part, index) => (
//     part.toLowerCase() === searchTerm.toLowerCase() ? (
//       <span key={index} className="bg-yellow-200 dark:bg-yellow-700">{part}</span>
//     ) : (
//       <span key={index}>{part}</span>
//     )
//   ));
// };

const FileScan: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  
  const { files, currentFile, loading: fileLoading } = useSelector((state: RootState) => state.files);
  const { findings, loading: findingsLoading } = useSelector((state: RootState) => state.findings);
  const [file, setFile] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [highlightedLineNumber, setHighlightedLineNumber] = useState<number | null>(null);

  useEffect(() => {
    if (fileId) {
      const id = parseInt(fileId);
      dispatch(fetchFindingsByFile(id));
      dispatch(fetchFileById(id));
    }
  }, [dispatch, fileId]);

  // Update the file state when files or currentFile changes
  useEffect(() => {
    if (fileId) {
      const id = parseInt(fileId);
      // First try to get from currentFile
      if (currentFile && currentFile.id === id) {
        setFile(currentFile);
      } 
      // Otherwise look in the files array
      else {
        const foundFile = files.find(f => f.id === id);
        if (foundFile) {
          setFile(foundFile);
        }
      }
    }
  }, [currentFile, files, fileId]);

  // Search functionality
  useEffect(() => {
    if (file?.content && searchTerm) {
      const lines = file.content.split('\n');
      const matches = lines.reduce((acc: number[], line: string, index: number) => {
        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
          acc.push(index + 1); // Line numbers are 1-based
        }
        return acc;
      }, []);
      setSearchMatches(matches);
      setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
      setHighlightedLineNumber(matches.length > 0 ? matches[0] : null);
    } else {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      setHighlightedLineNumber(null);
    }
  }, [file?.content, searchTerm]);

  const handleBackToDashboard = () => {
    if (file?.project_id) {
      navigate(`/dashboard/${file.project_id}`);
    } else {
      navigate('/');
    }
  };

  const handleStatusChange = (findingId: number, status: Finding['status']) => {
    dispatch(updateFindingStatus({ findingId, status }))
      .unwrap()
      .then(() => {
        showToast(`Finding status updated to ${status.replace('_', ' ')}`, 'success');
      })
      .catch((error) => {
        showToast(`Failed to update status: ${error.message || 'Unknown error'}`, 'error');
      });
  };

  const handleRescanFile = async () => {
    if (fileId) {
      setIsScanning(true);
      try {
        dispatch(scanFile({ fileId: parseInt(fileId) }));
        // Refetch findings and file after scan
        await dispatch(fetchFindingsByFile(parseInt(fileId))).unwrap();
        await dispatch(fetchFileById(parseInt(fileId))).unwrap();
        showToast('File discovery completed successfully', 'success');
      } catch (error: any) {
        console.error('Error discovering file:', error);
        showToast(`Failed to discover file: ${error?.message || 'Unknown error'}`, 'error');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const navigateToPreviousMatch = () => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex((prevIndex) => {
        const newIndex = prevIndex <= 0 ? searchMatches.length - 1 : prevIndex - 1;
        setHighlightedLineNumber(searchMatches[newIndex]);
        return newIndex;
      });
    }
  };

  const navigateToNextMatch = () => {
    if (searchMatches.length > 0) {
      setCurrentMatchIndex((prevIndex) => {
        const newIndex = prevIndex >= searchMatches.length - 1 ? 0 : prevIndex + 1;
        setHighlightedLineNumber(searchMatches[newIndex]);
        return newIndex;
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20';
      case 'confirmed':
        return 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20';
      case 'resolved':
        return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
      case 'wont_fix':
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
      case 'false_positive':
        return 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
    }
  };

  if (fileLoading || findingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">File not found!</strong>
        <span className="block sm:inline"> Please select a valid file.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <DocumentTextIcon className="h-10 w-10 text-blue-500 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{file.file_name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{file.file_path}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleBackToDashboard}
              className="btn btn-secondary flex items-center"
              aria-label="Back to dashboard"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
            <button 
              className={`btn btn-primary flex items-center ${isScanning ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={handleRescanFile}
              disabled={isScanning}
              aria-label="Rediscover file"
            >
              <BoltIcon className={`h-5 w-5 mr-1 ${isScanning ? 'animate-pulse' : ''}`} />
              {isScanning ? 'Discovering...' : 'Rediscover File'}
            </button>
          </div>
        </div>
      </div>

      {/* Source Code Viewer with Search */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Source Code</h2>
          
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search in file..."
                className="pl-10 pr-24 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchMatches.length > 0 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                    {currentMatchIndex + 1} of {searchMatches.length}
                  </span>
                  <div className="flex">
                    <button 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      onClick={navigateToPreviousMatch}
                      aria-label="Previous match"
                    >
                      ↑
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      onClick={navigateToNextMatch}
                      aria-label="Next match"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SyntaxHighlighter
            language={getLanguageFromFilename(file.file_name)}
            style={vscDarkPlus}
            showLineNumbers={true}
            wrapLines={true}
            customStyle={{
              margin: 0,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              maxHeight: '500px',
            }}
            lineProps={lineNumber => ({
              style: { 
                display: 'block',
                backgroundColor: lineNumber === highlightedLineNumber ? 'rgba(255, 225, 0, 0.15)' : undefined,
              },
              id: `line-${lineNumber}`,
            })}
          >
            {file.content || '// No content available'}
          </SyntaxHighlighter>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ShieldExclamationIcon className="h-5 w-5 mr-2 text-gray-600" />
          Findings ({findings.length})
        </h2>

        {findings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
            <ShieldExclamationIcon className="h-16 w-16 mx-auto text-green-500" />
            <h3 className="mt-4 text-lg font-medium">No findings for this file</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This file has either not been scanned yet or no issues were found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(finding.severity)}`}>
                      {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                    </span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(finding.status)}`}>
                      {finding.status.charAt(0).toUpperCase() + finding.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <select
                    value={finding.status}
                    onChange={(e) => handleStatusChange(finding.id, e.target.value as Finding['status'])}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    aria-label="Change finding status"
                  >
                    <option value="new">New</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="resolved">Resolved</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {finding.type}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{finding.description}</p>
                {finding.line_number && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Line {finding.line_number}</p>
                      <button 
                        onClick={() => finding.line_number && setHighlightedLineNumber(finding.line_number)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        aria-label="Highlight in source code"
                      >
                        Highlight in source
                      </button>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <SyntaxHighlighter
                        language={getLanguageFromFilename(file.file_name)}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        startingLineNumber={Math.max(1, finding.line_number - 2)}
                        wrapLines={true}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          maxHeight: '200px',
                        }}
                        lineProps={lineNumber => ({
                          style: { 
                            display: 'block',
                            backgroundColor: lineNumber === finding.line_number ? 'rgba(255, 0, 0, 0.2)' : undefined,
                          },
                        })}
                      >
                        {getCodeSnippet(file.content, finding.line_number) || '// Code snippet not available'}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileScan;
