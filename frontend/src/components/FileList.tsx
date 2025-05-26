import React, { useState } from 'react';
import type { File } from '../features/fileSlice';
import { DocumentTextIcon, MagnifyingGlassIcon, ExclamationCircleIcon, FunnelIcon, TagIcon } from '@heroicons/react/24/outline';

interface FileListProps {
  files: File[];
  onFileSelect: (file: File) => void;
  onFileScan: (fileId: number) => void;
  onFileToggleIgnore: (fileId: number) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileSelect,
  onFileScan,
  onFileToggleIgnore,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'discovered' | 'not_discovered' | 'ignored' | 'unprocessed'>('all'); // Removed 'changed'
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<{ field: 'name' | 'status'; direction: 'asc' | 'desc' }>({ 
    field: 'name', 
    direction: 'asc' 
  });

  // Get unique file types for filter dropdown
  const fileTypes = ['all', ...new Set(files.filter(f => f.file_type).map(f => f.file_type as string))];

  // Filter and sort files based on search and filter
  const filteredAndSortedFiles = files
    .filter(file => {
      // Apply search term filter
      const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        file.file_path.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      let matchesStatus = true;
      if (statusFilter === 'discovered') {
        matchesStatus = file.scanned && !file.is_ignored;
      } else if (statusFilter === 'not_discovered') {
        matchesStatus = !file.scanned && !file.is_ignored;
      } else if (statusFilter === 'ignored') {
        matchesStatus = file.is_ignored;
      } else if (statusFilter === 'unprocessed') {
        matchesStatus = file.processed === false;
      }
      // Removed 'changed' status filter logic

      // Apply file type filter
      const matchesFileType = fileTypeFilter === 'all' || file.file_type === fileTypeFilter;
      
      return matchesSearch && matchesStatus && matchesFileType;
    })
    .sort((a, b) => {
      // Sort by selected field and direction
      if (sortOrder.field === 'name') {
        return sortOrder.direction === 'asc' 
          ? a.file_name.localeCompare(b.file_name)
          : b.file_name.localeCompare(a.file_name);
      } else {
        // Sort by status
        const getStatusPriority = (file: File) => {
          if (file.is_ignored) return 5;
          if (file.processed === false) return 2;
          if (file.scanned) return 3;
          return 4;
        };
        
        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);
        
        return sortOrder.direction === 'asc'
          ? priorityA - priorityB
          : priorityB - priorityA;
      }
    });

  const toggleSortOrder = (field: 'name' | 'status') => {
    if (sortOrder.field === field) {
      // Toggle direction if the field is already selected
      setSortOrder({ 
        field, 
        direction: sortOrder.direction === 'asc' ? 'desc' : 'asc' 
      });
    } else {
      // New field, default to ascending
      setSortOrder({ field, direction: 'asc' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search files..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
          <select
            className="block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Files</option>
            <option value="discovered">Discovered</option>
            <option value="not_discovered">Not Discovered</option>
            <option value="ignored">Ignored</option>
            <option value="unprocessed">Unprocessed</option> {/* Removed 'changed' option */}
          </select>
        </div>

        <div className="flex items-center ml-2">
          <TagIcon className="h-5 w-5 text-gray-500 mr-2" />
          <select
            className="block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {fileTypes.filter(type => type !== 'all').map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => toggleSortOrder('name')}
              >
                <div className="flex items-center">
                  File
                  {sortOrder.field === 'name' && (
                    <span className="ml-1">
                      {sortOrder.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => toggleSortOrder('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortOrder.field === 'status' && (
                    <span className="ml-1">
                      {sortOrder.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedFiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-gray-500 dark:text-gray-400">
                  No files found
                </td>
              </tr>
            ) : (
              filteredAndSortedFiles.map((file) => (
                <tr 
                  key={file.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer`}
                  onClick={() => onFileSelect(file)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.file_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{file.file_path}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        file.is_ignored 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' 
                          : file.scanned 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'                    }`}>
                        {file.is_ignored ? 'Ignored' : file.scanned ? 'Discovered' : 'Not Discovered'}
                      </span>
                      
                      {/* Removed isChanged check as it's not in File type */}
                      
                      {file.processed !== undefined && (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          file.processed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                        }`}>
                          {file.processed ? 'Processed' : 'Unprocessed'}
                        </span>
                      )}
                      
                      {file.file_type && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200">
                          {file.file_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileScan(file.id);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      disabled={file.is_ignored}
                      title={file.is_ignored ? 'Cannot discover ignored file' : 'Discover file'}
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileToggleIgnore(file.id);
                      }}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title={file.is_ignored ? 'Unignore file' : 'Ignore file'}
                    >
                      <ExclamationCircleIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredAndSortedFiles.length} of {files.length} files
      </div>
    </div>
  );
};

export default FileList;
