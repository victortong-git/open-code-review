import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { createFinding } from '../features/findingSlice';
import type { AppDispatch } from '../store/store';
import { useToast } from '../context/ToastContext';

interface LocationState {
  initialData?: {
    // review_request_id removed as no longer needed
    line_number?: number;
    file_id?: number;
    md5?: string;
  };
}

const FindingCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { initialData } = (location.state as LocationState) || {};

  const [formData, setFormData] = useState({
    type: '',
    description: '',
    severity: 'medium',
    severity_reason: '',
    status: 'new',
    line_number: initialData?.line_number || '',
    recommendation: '',
    code_content: '',
    md5: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Finding type is required';
    }
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert appropriate fields to numbers
      const payload = {
        ...formData,
        line_number: formData.line_number ? parseInt(formData.line_number.toString(), 10) : undefined
      };
      
      await dispatch(createFinding(payload)).unwrap();
      showToast('Finding created successfully', 'success');
      
      // Navigate back to the original location or to the findings list
      if (initialData?.file_id) {
        navigate(`/files/${initialData.file_id}`);
      } else {
        navigate(-1);
      }
    } catch (error: any) {
      showToast(`Failed to create finding: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={handleCancel}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Create New Finding</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review Request ID section removed as it's no longer needed */}

            {/* Finding Type */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">
                Finding Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700`}
              >
                <option value="">Select a finding type</option>
                <option value="Cross-Site Scripting (XSS)">Cross-Site Scripting (XSS)</option>
                <option value="SQL Injection">SQL Injection</option>
                <option value="Authentication Issue">Authentication Issue</option>
                <option value="Authorization Issue">Authorization Issue</option>
                <option value="Insecure Direct Object References">Insecure Direct Object References</option>
                <option value="Security Misconfiguration">Security Misconfiguration</option>
                <option value="Cross-Site Request Forgery (CSRF)">Cross-Site Request Forgery (CSRF)</option>
                <option value="Insecure Cryptographic Storage">Insecure Cryptographic Storage</option>
                <option value="Hardcoded Secret">Hardcoded Secret</option>
                <option value="Code Quality Issue">Code Quality Issue</option>
                <option value="Performance Issue">Performance Issue</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            {/* Severity */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>

            {/* Line Number */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">Line Number</label>
              <input
                type="number"
                name="line_number"
                value={formData.line_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
            </div>

            {/* MD5 Hash */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-1">MD5 Hash</label>
              <input
                type="text"
                name="md5"
                value={formData.md5}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className={`w-full p-2 border rounded ${
                  errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700`}
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Severity Reason */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Severity Reason</label>
              <textarea
                name="severity_reason"
                value={formData.severity_reason}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              ></textarea>
            </div>

            {/* Security Recommendation */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Security Recommendation</label>
              <textarea
                name="recommendation"
                value={formData.recommendation}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              ></textarea>
            </div>

            {/* Code Content */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Code Content</label>
              <textarea
                name="code_content"
                value={formData.code_content}
                onChange={handleChange}
                rows={5}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono text-sm"
                placeholder="Paste the relevant code snippet here"
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Finding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FindingCreate;
