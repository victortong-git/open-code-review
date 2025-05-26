import React, { useMemo, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/24/outline';
import type { File } from '../features/fileSlice';

interface FileNode {
  type: 'file' | 'folder';
  name: string;
  path: string;
  file?: File;
  children: Record<string, FileNode>;
}

interface FolderStructureViewProps {
  files: File[];
  onFileSelect: (file: File) => void;
  onFileScan: (fileId: number) => void;
  onFileToggleIgnore: (fileId: number) => void;
}

// Helper function to build the file tree from a flat list of files
const buildFileTree = (files: File[]): FileNode => {
  const root: FileNode = {
    type: 'folder',
    name: 'root',
    path: '',
    children: {}
  };

  files.forEach(file => {
    // Use file_path for directory structure and file_name for the actual filename
    const directoryPath = file.file_path === '/' ? '' : file.file_path.replace(/^\/+|\/+$/g, '');
    const fileName = file.file_name || 'unnamed_file';
    
    let currentNode = root;
    
    // If there's a directory path, create the folder structure
    if (directoryPath) {
      const pathSegments = directoryPath.split('/').filter(Boolean);
      
      // Navigate through the path segments, creating folders as needed
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        
        // If this folder doesn't exist yet, create it
        if (!currentNode.children[segment]) {
          currentNode.children[segment] = {
            type: 'folder',
            name: segment,
            path: pathSegments.slice(0, i + 1).join('/'),
            children: {}
          };
        }
        
        // Move to that folder for next iteration
        currentNode = currentNode.children[segment];
      }
    }
    
    // Add the file to the current folder using the actual filename
    // Use a unique key in case there are duplicate filenames in the same directory
    let uniqueKey = fileName;
    let counter = 1;
    while (currentNode.children[uniqueKey]) {
      uniqueKey = `${fileName}_${counter}`;
      counter++;
    }
    
    currentNode.children[uniqueKey] = {
      type: 'file',
      name: fileName,
      path: file.file_path === '/' ? fileName : `${file.file_path}/${fileName}`,
      file: file,
      children: {}
    };
  });
  
  return root;
};

// The component to render individual folders/files
const TreeNode: React.FC<{
  node: FileNode;
  onFileSelect: (file: File) => void;
  onFileScan: (fileId: number) => void;
  onFileToggleIgnore: (fileId: number) => void;
  level?: number;
}> = ({ node, onFileSelect, onFileScan, onFileToggleIgnore, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first two levels
  
  const children = useMemo(() => {
    return Object.values(node.children).sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Then alphabetical by name
      return a.name.localeCompare(b.name);
    });
  }, [node.children]);
  
  if (node.type === 'file' && node.file) {
    return (
      <div className="py-1 pl-4 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
        <span className="inline-block w-6 text-gray-500" style={{ marginLeft: `${level * 20}px` }}>
          <DocumentTextIcon className="h-5 w-5" />
        </span>
        <span 
          className="ml-2 text-sm cursor-pointer flex-1"
          onClick={() => onFileSelect(node.file!)}
        >
          {node.name}
        </span>
        <div className="flex space-x-1 pr-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileScan(node.file!.id);
            }}
            disabled={node.file.is_ignored}
            className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 ${
              node.file.is_ignored ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            <span className="sr-only">Scan</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileToggleIgnore(node.file!.id);
            }}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
          >
            <span className="sr-only">{node.file.is_ignored ? 'Unignore' : 'Ignore'}</span>
            {node.file.is_ignored ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }
  
  // Render folder
  return (
    <div>
      <div 
        className="py-1 pl-4 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="inline-block w-6" style={{ marginLeft: `${level * 20}px` }}>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
          )}
        </span>
        <span className="ml-2 flex items-center">
          <FolderIcon className="h-5 w-5 text-blue-500 mr-1" />
          <span className="text-sm font-medium">
            {node.name === 'root' ? 'Project Files' : node.name}
          </span>
          <span className="ml-2 text-xs text-gray-500">({children.length})</span>
        </span>
      </div>
      
      {isExpanded && (
        <div>
          {children.map((childNode, index) => (
            <TreeNode 
              key={childNode.path + index}
              node={childNode}
              onFileSelect={onFileSelect}
              onFileScan={onFileScan}
              onFileToggleIgnore={onFileToggleIgnore}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderStructureView: React.FC<FolderStructureViewProps> = ({
  files,
  onFileSelect,
  onFileScan,
  onFileToggleIgnore
}) => {
  const fileTree = useMemo(() => buildFileTree(files), [files]);
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Directory Structure</h3>
      </div>
      <div className="py-2 pl-2">
        <TreeNode 
          node={fileTree}
          onFileSelect={onFileSelect}
          onFileScan={onFileScan}
          onFileToggleIgnore={onFileToggleIgnore}
        />
      </div>
    </div>
  );
};

export default FolderStructureView;
