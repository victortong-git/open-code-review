import axios from 'axios';

// Create an Axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 1800000, // 30 minute timeout for AI operations
  withCredentials: false, // Set to true if you need cookies/auth to be sent
  maxRedirects: 5,
  proxy: false, // Disable any proxy settings that might interfere
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
    const errorMessage = error.response 
      ? `API Error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`
      : `Network Error: ${error.message || 'Failed to connect to the server. Please check if the backend service is running.'}`;
    
    // Add detailed logging for network errors
    if (!error.response) {
      console.error('Network Error Details:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        }
      });
    }
    
    console.error(errorMessage, error);
    
    return Promise.reject(error);
  }
);

// Utility function to retry failed API calls
const withRetry = async (apiCall: () => Promise<any>, maxRetries = 5, delay = 1000) => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on network errors or 5xx server errors
      if (!error.response || (error.response && error.response.status >= 500)) {
        console.log(`Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff with jitter to prevent thundering herd problem
        delay = delay * 1.5 + Math.floor(Math.random() * 500);
      } else {
        // Don't retry for client errors (4xx)
        break;
      }
    }
  }
  throw lastError;
};

// API service for projects
export const projectApi = {
  getAll: () => withRetry(() => api.get('/projects')),
  getById: (id: number) => withRetry(() => api.get(`/projects/${id}`)),
  create: (data: { name: string; description?: string }) => api.post('/projects', data),
  update: (id: number, data: { name?: string; description?: string }) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  // Custom endpoints
  scanAll: () => api.post('/projects/scan'),
  scan: (id: number) => api.post(`/projects/${id}/scan`),
  getStats: (id: number) => withRetry(() => api.get(`/projects/${id}/stats`)),
};

// API service for files
export const fileApi = {
  getAll: () => withRetry(() => api.get('/files')),
  getById: (id: number) => withRetry(() => api.get(`/files/${id}`)),
  getByProject: (projectId: number) => withRetry(() => api.get(`/projects/${projectId}/files`)),
  create: (data: { 
    project_id: number; 
    file_path: string; 
    file_name: string; 
    content?: string; 
    file_type?: string;
    description?: string;
  }) => api.post('/files', data),
  update: (id: number, data: { 
    file_path?: string; 
    file_name?: string; 
    content?: string;
    description?: string;
    initial_security_review?: string;
    initial_coding_quality?: string;
    file_type?: string;
  }) => api.put(`/files/${id}`, data),
  delete: (id: number) => api.delete(`/files/${id}`),
  // Custom endpoints
  scan: (id: number) => api.post(`/files/${id}/scan`),
  toggleIgnore: (id: number) => api.patch(`/files/${id}/toggle-ignore`),
  updateMD5: (id: number) => api.patch(`/files/${id}/update-md5`),
  markProcessed: (id: number) => api.patch(`/files/${id}/mark-processed`),
};

// API service for findings
export const findingApi = {
  getAll: () => withRetry(() => api.get('/findings')),
  getById: (id: number) => withRetry(() => api.get(`/findings/${id}`)),
  // getByReviewRequest endpoint removed as review_requests table has been removed
  getByFile: (fileId: number) => withRetry(() => api.get(`/files/${fileId}/findings`)),
  getByCodeSnippet: (codeSnippetId: number) => withRetry(() => api.get(`/code-snippets/${codeSnippetId}/findings`)),
  getByProject: (projectId: number) => withRetry(() => api.get(`/findings/projects/${projectId}`)),
  create: (data: { 
    // review_request_id removed as the table is no longer needed
    type: string; 
    description: string; 
    severity?: string;
    severity_reason?: string;
    status?: string;
    line_number?: number;
    // code_snippet_id removed as per new data relationship
    recommendation?: string;
    code_content?: string;
    md5?: string;
    file_id?: number; // Added file_id
  }) => api.post('/findings', data),
  update: (id: number, data: { 
    type?: string; 
    description?: string; 
    severity?: string;
    severity_reason?: string;
    status?: string;
    line_number?: number;
    // code_snippet_id removed as per new data relationship
    recommendation?: string;
    code_content?: string;
    md5?: string;
    file_id?: number; // Added file_id
  }) => api.put(`/findings/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/findings/${id}`, { status }),
  delete: (id: number) => api.delete(`/findings/${id}`),
  deleteAllByFile: (fileId: number) => api.delete(`/findings/files/${fileId}/all`),
  performQAReview: (id: number) => api.post(`/findings/${id}/qa-review`),
};

// API service for code snippets
export const codeSnippetApi = {
  getAll: () => withRetry(() => api.get('/code-snippets')),
  getById: (id: number) => withRetry(() => api.get(`/code-snippets/${id}`)),
  getByFile: (fileId: number) => withRetry(() => api.get(`/code-snippets/file/${fileId}`)),
  create: (data: { 
    file_id: number; 
    code: string; 
    code_type?: string;
    start_line?: number;
    end_line?: number;
    line_of_code?: number;
    description?: string;
    initial_security_review?: string;
    initial_coding_quality?: string;
  }) => api.post('/code-snippets', data),
  update: (id: number, data: { 
    code?: string; 
    code_type?: string;
    start_line?: number;
    end_line?: number;
    line_of_code?: number;
    description?: string;
    initial_security_review?: string;
    initial_coding_quality?: string;
    isAssessed?: boolean;
    code_quality?: string;
    code_quality_reason?: string;
    code_snippet_example?: string;
  }) => api.put(`/code-snippets/${id}`, data),
  delete: (id: number) => api.delete(`/code-snippets/${id}`),
};

// Check API server availability
export const checkApiAvailability = async (): Promise<{ available: boolean; message: string; details?: any }> => {
  try {
    // First try with a short timeout to quickly detect issues
    await api.get('/health', { timeout: 3000 });
    return { available: true, message: 'API server is available' };
  } catch (error: any) {
    // Capture connection details for debugging
    const connectionInfo = {
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      headers: api.defaults.headers,
      error: {
        code: error.code,
        message: error.message,
        status: error.response?.status
      },
      date: new Date().toISOString()
    };
    
    // Check connection error types
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
      return { 
        available: false, 
        message: 'Cannot connect to the API server. Please make sure the backend service is running.',
        details: connectionInfo
      };
    }
    
    if (error.code === 'ETIMEDOUT') {
      return {
        available: false,
        message: 'Connection to API server timed out. The server might be overloaded or there might be network issues.',
        details: connectionInfo
      };
    }
    
    if (error.response) {
      return { 
        available: error.response.status < 500, 
        message: `API server returned status ${error.response.status}`,
        details: connectionInfo
      };
    }
    
    return { 
      available: false, 
      message: `Unknown error: ${error.message}`,
      details: connectionInfo
    };
  }
};

export default api;
