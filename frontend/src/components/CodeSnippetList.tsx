import React, { useState } from 'react';
import type { CodeSnippet } from '../features/codeSnippetSlice';
import { DocumentTextIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface CodeSnippetListProps {
  codeSnippets: CodeSnippet[];
  onCodeSnippetSelect: (codeSnippet: CodeSnippet) => void;
  selectedCodeSnippet?: CodeSnippet | null;
}

const CodeSnippetList: React.FC<CodeSnippetListProps> = ({
  codeSnippets,
  onCodeSnippetSelect,
  selectedCodeSnippet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'assessed' | 'not_assessed'>('all');

  const filteredCodeSnippets = codeSnippets
    .filter(snippet => {
      // Apply search term
      const matchesSearch = 
        snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (snippet.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      // Apply status filter
      let matchesFilter = true;
      if (filter === 'assessed') {
        matchesFilter = snippet.isAssessed;
      } else if (filter === 'not_assessed') {
        matchesFilter = !snippet.isAssessed;
      }
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by line number first
      if (a.start_line && b.start_line) {
        return a.start_line - b.start_line;
      }
      // Then sort by assessment status (not assessed first)
      return Number(a.isAssessed) - Number(b.isAssessed);
    });

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search code snippets..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('assessed')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              filter === 'assessed'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Assessed
          </button>
          <button
            onClick={() => setFilter('not_assessed')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              filter === 'not_assessed'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Not Assessed
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px]">
        {filteredCodeSnippets.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No code snippets found
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCodeSnippets.map((snippet) => (
              <li
                key={snippet.id}
                onClick={() => onCodeSnippetSelect(snippet)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  selectedCodeSnippet?.id === snippet.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {snippet.code_type || 'Code Snippet'} - Lines {snippet.start_line} to {snippet.end_line}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {snippet.description || 'No description'}
                      </p>
                      {snippet.code && (
                        <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto line-clamp-3">
                          {snippet.code.substring(0, 150)}
                          {snippet.code.length > 150 ? '...' : ''}
                        </pre>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {snippet.isAssessed ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" title="Assessed" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-yellow-500" title="Not assessed" />
                    )}
                  </div>
                </div>
                {snippet.code_quality && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Quality: {snippet.code_quality}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetList;
