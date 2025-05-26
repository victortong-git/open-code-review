import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// Helper function to determine language from filename
const getLanguageFromFilename = (filename: string): string => {
  const extension = filename?.split('.').pop()?.toLowerCase() || '';
  
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

interface FileInfo {
  id: number;
  file_name: string;
  md5: string | null;
}

interface Finding {
  id: number;
  type: string;
  description: string;
  severity: string;
  severity_reason?: string;
  status: string;
  file_id?: number; // Keep file_id for direct access if needed, though file object is preferred
  line_number: number | null;
  code_content: string;
  recommendation: string;
  md5?: string | null; // Keep top-level md5 for backward compatibility if needed
  createdAt?: string;
  updatedAt?: string;
  file?: FileInfo; // Add nested file object
}

const FindingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  useEffect(() => {
    const fetchFinding = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/findings/${id}`);
        setFinding(response.data);
        
        // Find line with "<--- issue" for highlighting
        if (response.data.code_content) {
          const lines = response.data.code_content.split('\n');
          const issueLineIndex = lines.findIndex((line: string) => line.includes('<--- issue'));
          if (issueLineIndex !== -1) {
            setHighlightedLine(issueLineIndex + 1); // +1 because line numbers are 1-based
          } else if (response.data.line_number) {
            setHighlightedLine(response.data.line_number);
          }
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching finding:', error);
        setError('Failed to load finding details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFinding();
  }, [id]);

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      case 'high':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'confirmed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'wont_fix':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // We'll keep this function in case we need it in the future
  /* 
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sql injection':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'cross-site scripting':
      case 'cross-site scripting (xss)':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100';
      case 'authentication issue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'authorization issue':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100';
      case 'insecure direct object references':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'security misconfiguration':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'cross-site request forgery':
      case 'cross-site request forgery (csrf)':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'insecure cryptographic storage':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'hardcoded secret':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'code quality issue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'performance issue':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };
  */

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md shadow">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md shadow">
        <h2 className="text-lg font-semibold">Finding Not Found</h2>
        <p>The requested finding could not be found or does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="flex items-center">
              <ShieldExclamationIcon className={`h-7 w-7 mr-3 ${
                finding.severity === 'critical' || finding.severity === 'high' 
                  ? 'text-red-500' 
                  : finding.severity === 'medium' 
                    ? 'text-yellow-500' 
                    : 'text-blue-500'
              }`} />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {finding.type}
              </h1>
            </div>
            
            {finding.file?.file_name && (
              <div className="mt-2 md:mt-0">
                <a 
                  href={finding.file_id ? `/files/${finding.file_id}` : '#'} 
                  onClick={(e) => { 
                    if (finding.file_id) {
                      e.preventDefault();
                      navigate(`/files/${finding.file_id}`);
                    }
                  }}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded-md transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  {finding.file.file_name}
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(finding.severity)}`}>
                  {getSeverityIcon(finding.severity)}
                  <span className="ml-1 capitalize">{finding.severity}</span>
                </span>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(finding.status)}`}>
                  {finding.status === 'resolved' ? (
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  ) : finding.status === 'confirmed' ? (
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                  )}
                  <span className="capitalize">{finding.status.replace('_', ' ')}</span>
                </span>
                
                {finding.line_number && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Line: {finding.line_number}
                  </span>
                )}
              </div>
              
              {finding.severity_reason && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Severity Reason</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{finding.severity_reason}</p>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-1 text-blue-500" />
                  Issue
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{finding.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
            {finding.createdAt && (
              <div className="inline-flex items-center">
                <span className="font-medium mr-1">Created:</span>
                {new Date(finding.createdAt).toLocaleString()}
              </div>
            )}
            {finding.updatedAt && (
              <div className="inline-flex items-center">
                <span className="font-medium mr-1">Updated:</span>
                {new Date(finding.updatedAt).toLocaleString()}
              </div>
            )}
            {finding.file?.md5 && (
              <div className="inline-flex items-center font-mono text-xs">
                <span className="font-medium mr-1">MD5:</span>
                {finding.file.md5}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Code Content Section */}
      {finding.code_content && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Vulnerable Code
              </h2>
              {finding.line_number && (
                <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded">
                  Line {finding.line_number}
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            <SyntaxHighlighter
              language={finding.file?.file_name ? getLanguageFromFilename(finding.file.file_name) : 'javascript'}
              style={vscDarkPlus}
              wrapLines={true}
              showLineNumbers={true}
              lineProps={(lineNumber: number) => {
                const isHighlighted = highlightedLine === lineNumber;
                return {
                  style: { 
                    display: 'block',
                    backgroundColor: isHighlighted ? 'rgba(255, 0, 0, 0.2)' : undefined,
                  },
                  className: isHighlighted ? 'highlighted-line' : undefined,
                };
              }}
              customStyle={{ fontSize: '0.9rem', borderRadius: '0.375rem' }}
            >
              {finding.code_content}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
      
      {/* Recommendation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
            Recommendation
          </h2>
        </div>
        <div className="p-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800">
            <p className="text-gray-900 dark:text-white whitespace-pre-line">{finding.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindingDetail;
