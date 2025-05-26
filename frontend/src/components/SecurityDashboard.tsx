import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import type { RootState } from '../store/store';
import SecuritySummary from './SecuritySummary';
// Import commented out for future use
// import SecurityTrends from './SecurityTrends';
import { getProjectStats } from '../features/projectSlice';
import axios from 'axios';

interface SecurityDashboardProps {
  projectId: number;
}

interface FindingsResponse {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  // Use only needed selector properties
  const { loading: projectLoading } = useSelector((state: RootState) => state.projects);
  const { files, loading: filesLoading } = useSelector((state: RootState) => state.files);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [findingsData, setFindingsData] = useState<FindingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFindingsData();
  }, [projectId]);
  
  const fetchFindingsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Import API from services to use the configured baseURL
      const api = (await import('../services/api')).default;
      
      // Fetch findings summary data from API using the configured baseURL
      const response = await api.get<FindingsResponse>(`/projects/${projectId}/findings/summary`);
      setFindingsData(response.data);
    } catch (error) {
      console.error("Failed to fetch findings data:", error);
      // Provide more detailed error message if available
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_NETWORK') {
          setError("Network error - Please check your connection or if the backend service is running");
        } else if (error.response?.status === 404) {
          setError("Endpoint not found - API route might be missing");
        } else if (error.response?.status === 500) {
          setError("Server error - There was a problem processing your request");
        } else {
          setError(`Failed to fetch security findings data: ${error.response?.status || ''} ${error.message}`);
        }
      } else {
        setError("Failed to fetch security findings data");
      }
      setFindingsData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics from actual data
  const totalFiles = files.length;
  const discoveredFiles = files.filter(file => file.processed).length;
  const ignoredFiles = files.filter(file => file.is_ignored).length;
  
  const handleRefreshStats = async () => {
    setRefreshingStats(true);
    try {
      // Dispatch action to refresh project stats
      await dispatch(getProjectStats(projectId) as any);
      // Also refresh findings data
      await fetchFindingsData();
    } finally {
      setRefreshingStats(false);
    }
  };
  
  if (projectLoading || filesLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-600">
        <h3 className="font-semibold mb-2">Error Loading Security Data</h3>
        <p>{error}</p>
        <button 
          onClick={fetchFindingsData} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!findingsData) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-semibold mb-2">No Security Data Available</h3>
        <p>There is no security findings data available for this project.</p>
        <button 
          onClick={handleRefreshStats} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Security Dashboard Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleRefreshStats}
              disabled={refreshingStats} 
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {refreshingStats ? (
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh Data
            </button>
          </div>
        </div>
        
        {/* Risk Findings Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg shadow-sm border-l-4 border-l-red-700 bg-red-50 dark:bg-red-900/10">
            <h4 className="text-lg font-medium text-red-700 dark:text-red-400">Critical</h4>
            <p className="text-3xl font-bold">{findingsData?.critical || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">High severity vulnerabilities</p>
          </div>
            
          <div className="p-4 rounded-lg shadow-sm border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/10">
            <h4 className="text-lg font-medium text-orange-500 dark:text-orange-400">High</h4>
            <p className="text-3xl font-bold">{findingsData?.high || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Significant vulnerabilities</p>
          </div>
            
          <div className="p-4 rounded-lg shadow-sm border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <h4 className="text-lg font-medium text-yellow-600 dark:text-yellow-400">Medium</h4>
            <p className="text-3xl font-bold">{findingsData?.medium || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Moderate vulnerabilities</p>
          </div>
            
          <div className="p-4 rounded-lg shadow-sm border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10">
            <h4 className="text-lg font-medium text-green-600 dark:text-green-400">Low</h4>
            <p className="text-3xl font-bold">{findingsData?.low || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Low risk vulnerabilities</p>
          </div>
        </div>
        
        {/* Security Score Color Guide */}
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg mb-8">
          <h4 className="font-medium mb-2">Security Score Color Guide</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
                <span>0-59: Critical Risk</span>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                <span>60-74: High Risk</span>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <span>75-84: Medium Risk</span>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span>85-100: Low Risk</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Security Summary Component */}
        <SecuritySummary 
          criticalRiskFindings={findingsData.critical}
          highRiskFindings={findingsData.high}
          mediumRiskFindings={findingsData.medium}
          lowRiskFindings={findingsData.low}
          totalFiles={totalFiles}
          discoveredFiles={discoveredFiles}
          ignoredFiles={ignoredFiles}
          refreshing={refreshingStats}
          onRefresh={handleRefreshStats}
        />
        
        {/* 
          Security Trends Component - Commented out for future version
          <SecurityTrends projectId={projectId} />
        */}
        
        {/* Action Buttons */}
        <div className="flex justify-end mt-4">
          <button 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700"
            onClick={() => window.print()}
          >
            <DocumentTextIcon className="h-5 w-5 mr-1" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
