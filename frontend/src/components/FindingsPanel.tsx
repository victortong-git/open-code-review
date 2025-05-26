
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface CodeSnippet {
  fileId: number;
  startLine: number;
  endLine: number;
}

interface Finding {
  id: string | number;
  type: string;
  severity: string;
  description: string;
  codeSnippet?: CodeSnippet;
}

interface FindingsPanelProps {
  fileId: number;
  onSelectFinding: (finding: Finding) => void;
}

const FindingsPanel: React.FC<FindingsPanelProps> = ({ fileId, onSelectFinding }) => {
  const findings = useSelector((state: RootState) => 
    state.analysis.findings.filter(finding => 
      finding.codeSnippet && finding.codeSnippet.fileId === fileId
    )
  );
  
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Get unique vulnerability types
  const vulnerabilityTypes = ['all', ...new Set(findings.map(f => f.type))];
  
  // Filter findings based on selected filters
  const filteredFindings = findings.filter(finding => {
    const severityMatch = selectedSeverity === 'all' || finding.severity === selectedSeverity;
    const typeMatch = selectedType === 'all' || finding.type === selectedType;
    return severityMatch && typeMatch;
  });
  
  // Get severity class for styling
  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Security Findings</h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            className="border rounded p-2"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vulnerability Type</label>
          <select
            className="border rounded p-2"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {vulnerabilityTypes.map((type: string) => (
              <option key={type} value={type.toString()}>
                {type === 'all' ? 'All Types' : type.toString()}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Findings List */}
      <div className="space-y-2">
        {filteredFindings.length > 0 ? (
          filteredFindings.map(finding => (
            <div 
              key={finding.id}
              className="border rounded p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelectFinding(finding)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{finding.type}</span>
                <span className={`text-white text-xs px-2 py-1 rounded ${getSeverityClass(finding.severity)}`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{finding.description}</p>
              {finding.codeSnippet && (
                <div className="text-xs text-gray-500">
                  Lines {finding.codeSnippet.startLine}-{finding.codeSnippet.endLine}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {findings.length > 0 
              ? 'No findings match the selected filters.' 
              : 'No findings available. Run an analysis to detect issues.'}
          </div>
        )}
      </div>
      
      {/* Summary */}
      {findings.length > 0 && (
        <div className="mt-4 flex justify-between text-sm">
          <div>Total: {findings.length}</div>
          <div>Filtered: {filteredFindings.length}</div>
        </div>
      )}
    </div>
  );
};

export default FindingsPanel;
