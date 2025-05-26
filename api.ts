import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors here
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API service for projects
export const projectApi = {
  getAll: () => api.get('/projects'),
  getById: (id: number) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post('/projects', data),
  update: (id: number, data: { name?: string; description?: string }) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  // Custom endpoints
  scanAll: () => api.post('/projects/scan'),
  scan: (id: number) => api.post(`/projects/${id}/scan`),
  getStats: (id: number) => api.get(`/projects/${id}/stats`),
};

// API service for files
export const fileApi = {
  getAll: () => api.get('/files'),
  getById: (id: number) => api.get(`/files/${id}`),
  getByProject: (projectId: number) => api.get(`/projects/${projectId}/files`),
  create: (data: { project_id: number; file_path: string; file_name: string; content?: string }) => 
    api.post('/files', data),
  update: (id: number, data: { file_path?: string; file_name?: string; content?: string }) => 
    api.put(`/files/${id}`, data),
  delete: (id: number) => api.delete(`/files/${id}`),
  // Custom endpoints
  scan: (id: number) => api.post(`/files/${id}/scan`),
  toggleIgnore: (id: number) => api.patch(`/files/${id}/toggle-ignore`),
};

// API service for review requests has been removed as the table no longer exists

// API service for findings
export const findingApi = {
  getAll: () => api.get('/findings'),
  getById: (id: number) => api.get(`/findings/${id}`),
  // getByReviewRequest endpoint removed as review_requests table has been removed
  getByFile: (fileId: number) => api.get(`/files/${fileId}/findings`),
  create: (data: { 
    // review_request_id removed as table is no longer needed
    type: string; 
    description: string; 
    severity?: string;
    status?: string;
    line_number?: number;
  }) => api.post('/findings', data),
  update: (id: number, data: { 
    type?: string; 
    description?: string; 
    severity?: string;
    status?: string;
    line_number?: number;
  }) => api.put(`/findings/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/findings/${id}`, { status }),
  delete: (id: number) => api.delete(`/findings/${id}`),
};

export default api;
