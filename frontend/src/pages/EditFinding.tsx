import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  file_id?: number; 
  line_number: number | null;
  code_content: string;
  recommendation: string;
  md5?: string | null; 
  createdAt?: string;
  updatedAt?: string;
  file?: FileInfo; 
}

const EditFinding = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    severity: '',
    status: '',
    description: '',
    recommendation: ''
  });

  useEffect(() => {
    const fetchFinding = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/findings/${id}`);
        setFinding(response.data);
        setFormData({
          severity: response.data.severity,
          status: response.data.status,
          description: response.data.description,
          recommendation: response.data.recommendation
        });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.put(`/findings/${id}`, formData);
      navigate(-1);
    } catch (error) {
      console.error('Error updating finding:', error);
      setError('Failed to update finding. Please try again later.');
    }
  };

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
    <div className="container mx-auto px-4 py-4">
      <div className="mb-3">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Finding #{finding.id}</h1>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                  <select 
                    name="severity" 
                    value={formData.severity} 
                    onChange={handleInputChange}
                    className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleInputChange}
                    className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="open">Open</option>
                    <option value="in progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="false positive">False Positive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                rows={3}
                className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recommendation</label>
              <textarea 
                name="recommendation" 
                value={formData.recommendation} 
                onChange={handleInputChange}
                rows={3}
                className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFinding;