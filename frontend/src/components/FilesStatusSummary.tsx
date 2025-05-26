import React from 'react';
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface FilesStatusSummaryProps {
  files: any[];
  onRefresh: () => void;
  loading: boolean;
}

const FilesStatusSummary: React.FC<FilesStatusSummaryProps> = ({ files, onRefresh, loading }) => {
  // Count the different types of files
  const totalFiles = files.length;
  const changedFiles = files.filter(file => file.isChanged).length;
  const unprocessedFiles = files.filter(file => !file.isProcessed).length;
  const processedFiles = files.filter(file => file.isProcessed).length;
  
  // Group by file type
  const fileTypes = files.reduce((acc: Record<string, number>, file) => {
    const fileType = file.file_type || 'unknown';
    acc[fileType] = (acc[fileType] || 0) + 1;
    return acc;
  }, {});
  
  // Get top 5 file types
  const topFileTypes = Object.entries(fileTypes)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">File Status Summary</h3>
        <button 
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          disabled={loading}
        >
          <ArrowPathIcon className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalFiles}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Changed Files</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{changedFiles}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-8 w-8 text-orange-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unprocessed Files</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{unprocessedFiles}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Processed Files</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{processedFiles}</p>
          </div>
        </div>
      </div>
      
      {/* File Types */}
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">File Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {topFileTypes.map(([type, count]) => (
            <div key={type} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{type}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilesStatusSummary;
