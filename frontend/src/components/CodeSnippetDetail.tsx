import React, { useState } from 'react';
import type { CodeSnippet } from '../features/codeSnippetSlice';
import type { Finding } from '../features/findingSlice';
import { PencilIcon, DocumentTextIcon, ShieldCheckIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface CodeSnippetDetailProps {
  codeSnippet: CodeSnippet;
  findings: Finding[];
  onUpdate: (id: number, data: Partial<CodeSnippet>) => void;
  onAddFinding: (data: Partial<Finding>) => void;
  readonly?: boolean;
}

const CodeSnippetDetail: React.FC<CodeSnippetDetailProps> = ({
  codeSnippet,
  findings,
  onUpdate,
  onAddFinding,
  readonly = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    code: codeSnippet.code,
    description: codeSnippet.description || '',
    initial_security_review: codeSnippet.initial_security_review || '',
    initial_coding_quality: codeSnippet.initial_coding_quality || '',
    code_quality: codeSnippet.code_quality || '',
    code_quality_reason: codeSnippet.code_quality_reason || '',
    code_snippet_example: codeSnippet.code_snippet_example || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(codeSnippet.id, {
      ...formData,
      isAssessed: true,
    });
    setEditing(false);
  };

  const handleAssess = () => {
    setEditing(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-500" />
          {codeSnippet.code_type || 'Code Snippet'} 
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            (Lines {codeSnippet.start_line} to {codeSnippet.end_line})
          </span>
        </h2>
        {!readonly && !editing && (
          <button
            onClick={handleAssess}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            {codeSnippet.isAssessed ? 'Edit Assessment' : 'Assess Code'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Security Review
            </label>
            <textarea
              name="initial_security_review"
              rows={3}
              value={formData.initial_security_review}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="OWASP 2021 top 10 security review recommendations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Coding Quality
            </label>
            <textarea
              name="initial_coding_quality"
              rows={3}
              value={formData.initial_coding_quality}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Comments on coding standards, principles (SOLID, DRY, KISS, etc.)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code Quality
            </label>
            <select
              name="code_quality"
              value={formData.code_quality}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Select quality level</option>
              <option value="good">Good</option>
              <option value="normal">Normal</option>
              <option value="needs improvement">Needs Improvement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code Quality Reason
            </label>
            <textarea
              name="code_quality_reason"
              rows={3}
              value={formData.code_quality_reason}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Explain why you rated the code quality this way..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Suggested Code Improvements
            </label>
            <textarea
              name="code_snippet_example"
              rows={5}
              value={formData.code_snippet_example}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              placeholder="Provide example code to improve quality or fix security issues..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Assessment
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Code</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm">
              {codeSnippet.code}
            </pre>
          </div>

          {codeSnippet.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300">{codeSnippet.description}</p>
            </div>
          )}

          {codeSnippet.isAssessed && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {codeSnippet.initial_security_review && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-1 text-blue-500" />
                      Security Review
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {codeSnippet.initial_security_review}
                    </p>
                  </div>
                )}

                {codeSnippet.initial_coding_quality && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <DocumentMagnifyingGlassIcon className="h-5 w-5 mr-1 text-blue-500" />
                      Coding Quality Assessment
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                      {codeSnippet.initial_coding_quality}
                    </p>
                  </div>
                )}
              </div>

              {codeSnippet.code_quality && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quality Assessment</h3>
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      codeSnippet.code_quality === 'good' ? 'bg-green-100 text-green-800' :
                      codeSnippet.code_quality === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {codeSnippet.code_quality}
                    </span>
                  </div>
                  {codeSnippet.code_quality_reason && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {codeSnippet.code_quality_reason}
                    </p>
                  )}
                </div>
              )}

              {codeSnippet.code_snippet_example && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Suggested Improvements</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm font-mono border-l-4 border-green-500">
                    {codeSnippet.code_snippet_example}
                  </pre>
                </div>
              )}
            </>
          )}

          {findings.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Related Findings</h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {findings.map(finding => (
                  <li key={finding.id} className="py-3">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                        finding.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        finding.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className="text-gray-900 dark:text-white">{finding.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{finding.description}</p>
                    {finding.recommendation && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                        Recommendation: {finding.recommendation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!readonly && (
            <div className="mt-6">
              <button
                onClick={() => {
                  onAddFinding({
                    md5: codeSnippet.md5, // Use md5 instead of code_snippet_id
                  });
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Finding
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeSnippetDetail;
