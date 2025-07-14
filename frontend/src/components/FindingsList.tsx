import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import type { Finding } from '../features/findingSlice';

interface FindingsListProps {
  findings: Finding[];
  onEditFinding?: (finding: Finding) => void;
  onDeleteFinding?: (id: number) => void;
  onQAReview?: (finding: Finding) => void;
}

const FindingsList: React.FC<FindingsListProps> = ({ 
  findings, 
  onEditFinding, 
  onDeleteFinding,
  onQAReview
}) => {
  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical':
      case 'high':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch(severity) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (findings.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No findings available for this file.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {findings.map((finding) => (
          <li key={finding.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  {getSeverityIcon(finding.severity)}
                  <p className="ml-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                    {finding.type}
                  </p>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityClass(finding.severity)}`}>
                    {finding.severity}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {finding.description}
                  </p>
                  {finding.code_content && (
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-32">
                      <code>{finding.code_content}</code>
                    </pre>
                  )}
                  {finding.recommendation && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Recommendation:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{finding.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-5 flex flex-shrink-0">
                <div className="flex space-x-2">
                  {onEditFinding && (
                    <button
                      onClick={() => onEditFinding(finding)}
                      className="inline-flex items-center rounded-md border border-transparent bg-gray-200 p-1 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteFinding && (
                    <button
                      onClick={() => onDeleteFinding(finding.id)}
                      className="inline-flex items-center rounded-md border border-transparent bg-gray-200 p-1 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                  {onQAReview && (
                    <button
                      onClick={() => onQAReview(finding)}
                      className="inline-flex items-center rounded-md border border-transparent bg-purple-600 p-1 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      title="AI QA Review"
                    >
                      <BeakerIcon className="h-4 w-4" />
                    </button>
                  )}
                  <Link
                    to={`/findings/${finding.id}`}
                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FindingsList;
