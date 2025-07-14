import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { findingApi } from '../services/api';

// Define finding type
export interface Finding {
  id: number;
  file_id?: number; // Added file_id
  // review_request_id removed as table is no longer needed
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  severity_reason?: string;
  status: 'new' | 'confirmed' | 'resolved' | 'wont_fix' | 'false_positive';
  line_number?: number;
  // code_snippet_id field removed as per new data relationship
  recommendation?: string; // Renamed from suggestion_security
  code_content?: string; // New field for extracted code content
  md5?: string; // New field for MD5 hash of source file
  qa_review_reason?: string; // QA review reason
  createdAt: string;
  updatedAt: string;
}

interface FindingState {
  findings: Finding[];
  currentFinding: Finding | null;
  loading: boolean;
  deleteAllLoading: boolean;
  qaReviewLoading: Record<number, boolean>;
  error: string | null;
}

const initialState: FindingState = {
  findings: [],
  currentFinding: null,
  loading: false,
  deleteAllLoading: false,
  qaReviewLoading: {},
  error: null,
};

// Helper function to check if error is an Axios error
const isAxiosError = (error: unknown): error is { response?: { data?: any }; message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

// Async thunks
export const fetchFindings = createAsyncThunk(
  'findings/fetchFindings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await findingApi.getAll();
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchFindingById = createAsyncThunk(
  'findings/fetchFindingById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await findingApi.getById(id);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Removed fetchFindingsByReviewRequest as review_requests table has been removed

export const fetchFindingsByFile = createAsyncThunk(
  'findings/fetchFindingsByFile',
  async (fileId: number, { rejectWithValue }) => {
    try {
      const response = await findingApi.getByFile(fileId);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Fetch findings by project ID
export const fetchFindingsByProject = createAsyncThunk(
  'findings/fetchFindingsByProject',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await findingApi.getByProject(projectId);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const createFinding = createAsyncThunk(
  'findings/createFinding',
  async (finding: {
    type: string;
    description: string;
    severity?: string;
    status?: string;
    line_number?: number;
    recommendation?: string;
    code_content?: string;
    md5?: string;
    file_id?: number; // Added file_id
  }, { rejectWithValue }) => {
    try {
      const response = await findingApi.create(finding);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateFinding = createAsyncThunk(
  'findings/updateFinding',
  async ({ id, data }: {
    id: number,
    data: {
      type?: string;
      description?: string;
      severity?: string;
      status?: string;
      line_number?: number;
    }
  }, { rejectWithValue }) => {
    try {
      const response = await findingApi.update(id, data);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateFindingStatus = createAsyncThunk(
  'findings/updateFindingStatus',
  async ({ findingId, status }: { findingId: number, status: Finding['status'] }, { rejectWithValue }) => {
    try {
      const response = await findingApi.updateStatus(findingId, status);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteFinding = createAsyncThunk(
  'findings/deleteFinding',
  async (id: number, { rejectWithValue }) => {
    try {
      await findingApi.delete(id);
      return id;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteAllFindingsByFile = createAsyncThunk(
  'findings/deleteAllFindingsByFile',
  async (fileId: number, { rejectWithValue }) => {
    try {
      const response = await findingApi.deleteAllByFile(fileId);
      return { fileId, response: response.data };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const performQAReview = createAsyncThunk(
  'findings/performQAReview',
  async (findingId: number, { rejectWithValue }) => {
    try {
      const response = await findingApi.performQAReview(findingId);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const findingSlice = createSlice({
  name: 'findings',
  initialState,
  reducers: {
    setCurrentFinding: (state, action) => {
      state.currentFinding = action.payload;
    },
    clearCurrentFinding: (state) => {
      state.currentFinding = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchFindings
      .addCase(fetchFindings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindings.fulfilled, (state, action) => {
        state.loading = false;
        state.findings = action.payload as Finding[];
      })
      .addCase(fetchFindings.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // fetchFindingById
      .addCase(fetchFindingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFinding = action.payload as Finding;
      })
      .addCase(fetchFindingById.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // fetchFindingsByReviewRequest cases removed as review_requests table has been removed

      // fetchFindingsByFile
      .addCase(fetchFindingsByFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindingsByFile.fulfilled, (state, action) => {
        state.loading = false;
        state.findings = action.payload as Finding[];
      })
      .addCase(fetchFindingsByFile.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // fetchFindingsByProject
      .addCase(fetchFindingsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFindingsByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.findings = action.payload as Finding[];
      })
      .addCase(fetchFindingsByProject.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // createFinding
      .addCase(createFinding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFinding.fulfilled, (state, action) => {
        state.loading = false;
        state.findings.push(action.payload as Finding);
      })
      .addCase(createFinding.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // updateFinding
      .addCase(updateFinding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFinding.fulfilled, (state, action) => {
        state.loading = false;
        const updatedFinding = action.payload as Finding;
        const index = state.findings.findIndex(finding => finding.id === updatedFinding.id);
        if (index !== -1) {
          state.findings[index] = updatedFinding;
        }
        if (state.currentFinding && state.currentFinding.id === updatedFinding.id) {
          state.currentFinding = updatedFinding;
        }
      })
      .addCase(updateFinding.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // updateFindingStatus
      .addCase(updateFindingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFindingStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedFinding = action.payload as Finding;
        const findingIndex = state.findings.findIndex(finding => finding.id === updatedFinding.id);
        if (findingIndex !== -1) {
          state.findings[findingIndex] = updatedFinding;
        }
        if (state.currentFinding && state.currentFinding.id === updatedFinding.id) {
          state.currentFinding = updatedFinding;
        }
      })
      .addCase(updateFindingStatus.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // deleteFinding
      .addCase(deleteFinding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFinding.fulfilled, (state, action) => {
        state.loading = false;
        const deletedFindingId = action.payload as number;
        state.findings = state.findings.filter(finding => finding.id !== deletedFindingId);
        if (state.currentFinding && state.currentFinding.id === deletedFindingId) {
          state.currentFinding = null;
        }
      })
      .addCase(deleteFinding.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // deleteAllFindingsByFile
      .addCase(deleteAllFindingsByFile.pending, (state) => {
        state.deleteAllLoading = true;
        state.error = null;
      })
      .addCase(deleteAllFindingsByFile.fulfilled, (state, action) => {
        state.deleteAllLoading = false;
        const { fileId } = action.payload;
        // Remove all findings for the specific file
        state.findings = state.findings.filter(finding => finding.file_id !== fileId);
        // Clear current finding if it belongs to the deleted file
        if (state.currentFinding && state.currentFinding.file_id === fileId) {
          state.currentFinding = null;
        }
      })
      .addCase(deleteAllFindingsByFile.rejected, (state, action) => {
        state.deleteAllLoading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // performQAReview
      .addCase(performQAReview.pending, (state, action) => {
        const findingId = action.meta.arg;
        state.qaReviewLoading[findingId] = true;
        state.error = null;
      })
      .addCase(performQAReview.fulfilled, (state, action) => {
        const findingId = action.meta.arg;
        state.qaReviewLoading[findingId] = false;
        const qaResult = action.payload;
        // Update the finding with QA results if finding data is included
        if (qaResult.finding) {
          const updatedFinding = qaResult.finding as Finding;
          const findingIndex = state.findings.findIndex(finding => finding.id === updatedFinding.id);
          if (findingIndex !== -1) {
            state.findings[findingIndex] = updatedFinding;
          }
          if (state.currentFinding && state.currentFinding.id === updatedFinding.id) {
            state.currentFinding = updatedFinding;
          }
        }
      })
      .addCase(performQAReview.rejected, (state, action) => {
        const findingId = action.meta.arg;
        state.qaReviewLoading[findingId] = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      });
  },
});

export const { setCurrentFinding, clearCurrentFinding } = findingSlice.actions;
export default findingSlice.reducer;
