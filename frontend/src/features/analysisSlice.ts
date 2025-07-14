import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';

interface Finding {
  id: number;
  codeSnippetId: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  createdAt?: string; // Add created date for time ago display
  codeSnippet?: {
    id: number;
    fileId: number;
    startLine: number;
    endLine: number;
    content: string;
  };
}

interface AnalysisStatus {
  fileId: number;
  jobId?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  currentReview?: string; // Current OWASP category being reviewed
  reviewStatus?: 'pending' | 'in_progress' | 'completed' | 'failed'; // Status of the current OWASP review
  currentIndex?: number; // Current index in the review sequence
  totalReviews?: number; // Total number of reviews to complete
}

interface AnalysisState {
  findings: Finding[];
  analysisStatus: Record<number, AnalysisStatus>; // fileId -> status
  loading: boolean;
  error: string | null;
  noticeMessage: string; // Message to display about prototype status
}

// Initial state
const initialState: AnalysisState = {
  findings: [],
  analysisStatus: {},
  loading: false,
  error: null,
  noticeMessage: 'This is a prototype version. AI code analysis can take up to 15-20 minutes to complete.'
};

// Async thunks
export const triggerAnalysis = createAsyncThunk(
  'analysis/triggerAnalysis',
  async (fileId: number, { rejectWithValue }) => {
    try {
      const response = await api.post('/analysis/ai-review', {
        fileId,
        input_message: `Review source code file id ${fileId}`
      });
      
      // Assuming response.data = { jobId, status, progress, findings? }
      const { jobId, status, progress, findings } = response.data;
      
      return { 
        fileId, 
        jobId,
        status: status || 'analyzing', 
        progress: progress || (status === 'completed' ? 100 : 10),
        findings: findings || [] 
      };
    } catch (error: any) {
      console.error('Error in AI analysis:', error);
      let message = 'Failed to trigger analysis.';
      if (error.response) {
        const errorData = error.response.data;
        const errorStatus = error.response.status;
        message = `API Error: Server responded with status ${errorStatus}.`;
        if (errorData?.detail) message += ` ${errorData.detail}`;
        else if (error.message) message += ` ${error.message}`;
        
        if (errorStatus === 422) message = `Validation error (422): ${errorData?.detail || 'The request format is invalid'}`;
        else if (errorStatus === 500) message = `Server error (500): ${errorData?.detail || 'The analysis service is currently unavailable'}`;
        else if (errorStatus === 404) message = `API endpoint not found (404): The AI analysis endpoint is not available on the backend`;
      } else {
        message = `Failed to connect to analysis service: ${error.message}`;
      }
      return rejectWithValue({ fileId, message });
    }
  }
);

export const triggerComprehensiveReview = createAsyncThunk(
  'analysis/triggerComprehensiveReview',
  async (fileId: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/analysis/files/${fileId}/comprehensive-review`);
      const { jobId, status, progress } = response.data;
      
      return { 
        fileId, 
        jobId,
        status: status || 'analyzing', 
        progress: progress || 0,
        currentReview: 'general_review' // Start with general review
      };
    } catch (error: any) {
      console.error('Error in comprehensive review:', error);
      let message = 'Failed to start comprehensive review.';
      if (error.response) {
        const errorData = error.response.data;
        const errorStatus = error.response.status;
        message = `API Error: Server responded with status ${errorStatus}.`;
        if (errorData?.detail) message += ` ${errorData.detail}`;
        else if (error.message) message += ` ${error.message}`;
      } else {
        message = `Failed to connect to analysis service: ${error.message}`;
      }
      return rejectWithValue({ fileId, message });
    }
  }
);

export const triggerSelectiveReview = createAsyncThunk(
  'analysis/triggerSelectiveReview',
  async ({ fileId, reviewTypes }: { fileId: number; reviewTypes: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/analysis/files/${fileId}/selective-review`, {
        reviewTypes
      });
      const { jobId, status, progress, selectedReviewTypes, totalReviews } = response.data;
      
      return { 
        fileId, 
        jobId,
        status: status || 'analyzing', 
        progress: progress || 0,
        currentReview: reviewTypes[0], // Start with first selected review
        selectedReviewTypes,
        totalReviews
      };
    } catch (error: any) {
      console.error('Error in selective review:', error);
      let message = 'Failed to start selective review.';
      if (error.response) {
        const errorData = error.response.data;
        const errorStatus = error.response.status;
        message = `API Error: Server responded with status ${errorStatus}.`;
        if (errorData?.detail || errorData?.error) message += ` ${errorData.detail || errorData.error}`;
        else if (error.message) message += ` ${error.message}`;
      } else {
        message = `Failed to connect to analysis service: ${error.message}`;
      }
      return rejectWithValue({ fileId, message });
    }
  }
);

export const triggerAssessment = createAsyncThunk(
  'analysis/triggerAssessment',
  async (fileId: number) => {
    const response = await api.post(`/analysis/files/${fileId}/assessment`);
    return { fileId, jobId: response.data.jobId };
  }
);

export const getAnalysisStatus = createAsyncThunk(
  'analysis/getAnalysisStatus',
  async (jobId: string) => {
    const response = await api.get(`/analysis/jobs/${jobId}`);
    return response.data;
  }
);

export const getAnalysisResults = createAsyncThunk(
  'analysis/getAnalysisResults',
  async (_jobId: string, { getState, rejectWithValue }) => {
    try {
      // Since the AI code review API now returns findings directly via triggerAnalysis,
      // we can either return the cached findings or make a request to get the latest
      const state = getState() as { analysis: { findings: any[] } };
      if (state.analysis.findings && state.analysis.findings.length > 0) {
        return { findings: state.analysis.findings };
      }
      
      // If for some reason we don't have findings yet, we could fetch them here
      // but for now we'll just return an empty array since the main flow should
      // already have findings from triggerAnalysis
      return { findings: [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get analysis results');
    }
  }
);

export const fetchSecurityMetrics = createAsyncThunk(
  'analysis/fetchSecurityMetrics', 
  async (projectId: number) => {
    try {
      // Try using the findings API endpoint first 
      const response = await api.get(`/findings/projects/${projectId}`);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('No findings data returned from API');
        return { findings: [] };
      }
      
      // Process and return the findings
      return { findings: response.data };
    } catch (error: any) {
      console.error('Error fetching security metrics:', error);
      
      // If there's an API error, try the analysis endpoint as fallback
      try {
        const fallbackResponse = await api.get(`/analysis/projects/${projectId}/findings`);
        return { findings: fallbackResponse.data || [] };
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        
        // If both fail, try one more time with a direct project findings endpoint
        try {
          const lastAttemptResponse = await api.get(`/projects/${projectId}/findings`);
          return { findings: lastAttemptResponse.data || [] };
        } catch (lastError) {
          console.error('All attempts to fetch findings failed:', lastError);
          return { findings: [] };
        }
      }
    }
  }
);

export const checkAndFetchFindings = createAsyncThunk(
  'analysis/checkAndFetchFindings',
  async ({fileId, jobId}: {fileId: number, jobId: string}, { dispatch }) => {
    try {
      // First check the status
      const statusResponse = await api.get(`/analysis/jobs/${jobId}`);
      const { status } = statusResponse.data;
      
      // Update the status
      dispatch(setAnalysisStatus({
        fileId,
        jobId,
        status,
        progress: status === 'completed' ? 100 : (status === 'failed' ? 0 : 50)
      }));
      
      // If completed, fetch the findings
      if (status === 'completed') {
        const findingsResponse = await api.get(`/analysis/results/${jobId}`);
        if (findingsResponse.data?.findings) {
          return { findings: findingsResponse.data.findings };
        } else {
          return { findings: [] };
        }
      }
      return null;
    } catch (error: any) {
      console.error('Error checking findings:', error);
      return { error: error.message };
    }
  }
);

// Create the slice
const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setAnalysisStatus: (state, action: PayloadAction<{
      fileId: number; 
      status: string; 
      progress: number; 
      currentReview?: string; 
      jobId?: string;
      reviewStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
      currentIndex?: number;
      totalReviews?: number;
    }>) => {
      const { 
        fileId, status, progress, currentReview, jobId, 
        reviewStatus, currentIndex, totalReviews 
      } = action.payload;
      state.analysisStatus[fileId] = {
        fileId,
        status: status as any,
        progress,
        ...(currentReview ? { currentReview } : {}),
        ...(jobId ? { jobId } : {}),
        ...(reviewStatus ? { reviewStatus } : {}),
        ...(currentIndex !== undefined ? { currentIndex } : {}),
        ...(totalReviews !== undefined ? { totalReviews } : {})
      };
    },
    updateAnalysisProgress: (state, action: PayloadAction<{
      fileId: number; 
      progress: number; 
      currentReview?: string;
      reviewStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
      currentIndex?: number;
      totalReviews?: number;
    }>) => {
      const { 
        fileId, 
        progress, 
        currentReview, 
        reviewStatus, 
        currentIndex, 
        totalReviews 
      } = action.payload;
      
      if (state.analysisStatus[fileId]) {
        state.analysisStatus[fileId].progress = progress;
        
        if (currentReview) {
          state.analysisStatus[fileId].currentReview = currentReview;
        }
        
        if (reviewStatus) {
          state.analysisStatus[fileId].reviewStatus = reviewStatus;
        }
        
        if (currentIndex !== undefined) {
          state.analysisStatus[fileId].currentIndex = currentIndex;
        }
        
        if (totalReviews !== undefined) {
          state.analysisStatus[fileId].totalReviews = totalReviews;
        }
      }
    },
    addFinding: (state, action: PayloadAction<Finding>) => {
      state.findings.push(action.payload);
    },
    clearFindings: (state) => {
      state.findings = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // triggerAnalysis
      .addCase(triggerAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerAnalysis.fulfilled, (state, action) => {
        const { fileId, jobId, status, progress } = action.payload;
        state.loading = false;
        
        // Create or update the status for this file
        state.analysisStatus[fileId] = { 
          fileId, 
          jobId, 
          status: status as any, 
          progress
        };
        
        // If findings were returned directly, add them
        if (action.payload.findings && action.payload.findings.length > 0) {
          state.findings = [...state.findings, ...action.payload.findings];
        }
      })
      .addCase(triggerAnalysis.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start analysis';
        
        // Update the status for this file to show the failure
        const fileId = action.payload?.fileId;
        if (fileId) {
          state.analysisStatus[fileId] = { 
            fileId, 
            status: 'failed',
            progress: 0
          };
        }
      })
      // triggerComprehensiveReview
      .addCase(triggerComprehensiveReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerComprehensiveReview.fulfilled, (state, action) => {
        const { fileId, jobId, status, progress, currentReview } = action.payload;
        state.loading = false;
        
        // Create or update the status for this file
        state.analysisStatus[fileId] = { 
          fileId, 
          jobId, 
          status: status as any, 
          progress,
          currentReview,
          reviewStatus: 'in_progress'
        };
      })
      .addCase(triggerComprehensiveReview.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start comprehensive review';
        
        // Update the status for this file to show the failure
        const fileId = action.payload?.fileId;
        if (fileId) {
          state.analysisStatus[fileId] = { 
            fileId, 
            status: 'failed',
            progress: 0
          };
        }
      })
      // triggerSelectiveReview
      .addCase(triggerSelectiveReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerSelectiveReview.fulfilled, (state, action) => {
        const { fileId, jobId, status, progress, currentReview, totalReviews } = action.payload;
        state.loading = false;
        
        // Create or update the status for this file
        state.analysisStatus[fileId] = { 
          fileId, 
          jobId, 
          status: status as any, 
          progress,
          currentReview,
          reviewStatus: 'in_progress',
          totalReviews
        };
      })
      .addCase(triggerSelectiveReview.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start selective review';
        
        // Update the status for this file to show the failure
        const fileId = action.payload?.fileId;
        if (fileId) {
          state.analysisStatus[fileId] = { 
            fileId, 
            status: 'failed',
            progress: 0
          };
        }
      })
      // getAnalysisStatus
      .addCase(getAnalysisStatus.fulfilled, (state, action) => {
        const { fileId, status, progress, jobId, currentReview, reviewStatus, currentIndex, totalReviews } = action.payload;
        
        if (fileId && state.analysisStatus[fileId]) {
          state.analysisStatus[fileId] = {
            ...state.analysisStatus[fileId],
            status: status as any,
            progress,
            jobId,
            ...(currentReview ? { currentReview } : {}),
            ...(reviewStatus ? { reviewStatus } : {}),
            ...(currentIndex !== undefined ? { currentIndex } : {}),
            ...(totalReviews !== undefined ? { totalReviews } : {})
          };
        }
      })
      // getAnalysisResults
      .addCase(getAnalysisResults.fulfilled, (state, action) => {
        if (action.payload.findings) {
          state.findings = action.payload.findings;
        }
      })
      // fetchSecurityMetrics
      .addCase(fetchSecurityMetrics.fulfilled, (state, action) => {
        if (action.payload.findings) {
          state.findings = action.payload.findings;
        }
      });
  }
});

// Export actions
export const {
  setAnalysisStatus,
  updateAnalysisProgress,
  addFinding,
  clearFindings
} = analysisSlice.actions;

// Export reducer
export default analysisSlice.reducer;
