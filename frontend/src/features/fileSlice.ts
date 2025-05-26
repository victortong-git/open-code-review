import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fileApi } from '../services/api';
import axios from 'axios'; // Keep axios import

// Define file type
export interface File {
  id: number;
  project_id: number;
  file_path: string;
  file_name: string;
  content?: string;
  file_type?: string;
  description?: string;
  initial_security_review?: string;
  initial_coding_quality?: string;
  is_ignored: boolean;
  scanned: boolean;
  processed: boolean;
  md5?: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalFindings: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    lowRiskFindings: number;
  };
}

interface FileState {
  files: File[];
  currentFile: File | null;
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  currentFile: null,
  loading: false,
  error: null,
};

// Helper function to check if error is an Axios error
const isAxiosError = (error: unknown): error is { response?: { data?: any }; message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error && axios.isAxiosError(error); // Use axios.isAxiosError
};


// Async thunks
export const fetchFiles = createAsyncThunk(
  'files/fetchFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fileApi.getAll();
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateFileMD5Async = createAsyncThunk(
  'files/updateFileMD5Async',
  async (fileId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await fileApi.updateMD5(fileId);
      dispatch(updateFileMD5({ fileId, md5: response.data.md5 }));
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const markFileProcessedAsync = createAsyncThunk(
  'files/markFileProcessedAsync',
  async (fileId: number, { rejectWithValue, dispatch }) => {
    try {
      const response = await fileApi.markProcessed(fileId);
      dispatch(markFileProcessed({ fileId }));
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchFileById = createAsyncThunk(
  'files/fetchFileById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fileApi.getById(id);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchFilesByProject = createAsyncThunk(
  'files/fetchFilesByProject',
  async (projectId: number, { rejectWithValue }) => {
    try {
      const response = await fileApi.getByProject(projectId);
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateFileAsync = createAsyncThunk(
  'files/updateFileAsync',
  async ({ id, ...data }: Partial<File> & { id: number }, { rejectWithValue, dispatch }) => {
    try {
      const response = await fileApi.update(id, data);
      dispatch(updateFile({ id, ...data }));
      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setCurrentFile: (state, action: PayloadAction<File>) => {
      state.currentFile = action.payload;
    },
    clearCurrentFile: (state) => {
      state.currentFile = null;
    },
    scanFile: (state, action: PayloadAction<{ fileId: number }>) => {
      // Implement scanFile logic here
      // For now, just set scanned to true for demonstration purposes
      const file = state.files.find(f => f.id === action.payload.fileId);
      if (file) {
        file.scanned = true;
      }
    },
    toggleFileIgnore: (state, action: PayloadAction<{ fileId: number }>) => {
      const file = state.files.find(f => f.id === action.payload.fileId);
      if (file) {
        file.is_ignored = !file.is_ignored;
      }
      if (state.currentFile && state.currentFile.id === action.payload.fileId) {
        state.currentFile.is_ignored = !state.currentFile.is_ignored;
      }
    },
    markFileProcessed: (state, action: PayloadAction<{ fileId: number }>) => {
      const file = state.files.find(f => f.id === action.payload.fileId);
      if (file) {
        file.processed = true;
      }
      if (state.currentFile && state.currentFile.id === action.payload.fileId) {
        state.currentFile.processed = true;
      }
    },
    updateFile: (state, action: PayloadAction<Partial<File> & { id: number }>) => {
      const index = state.files.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.files[index] = { ...state.files[index], ...action.payload };
      }
      if (state.currentFile && state.currentFile.id === action.payload.id) {
        state.currentFile = { ...state.currentFile, ...action.payload } as File;
      }
    },
    updateFileMD5: (state, action: PayloadAction<{ fileId: number; md5: string }>) => {
      const file = state.files.find(f => f.id === action.payload.fileId);
      if (file) {
        file.md5 = action.payload.md5;
      }
      if (state.currentFile && state.currentFile.id === action.payload.fileId) {
        state.currentFile.md5 = action.payload.md5;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFiles
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload as File[];
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // fetchFileById
      .addCase(fetchFileById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFileById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFile = action.payload as File;
      })
      .addCase(fetchFileById.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // fetchFilesByProject
      .addCase(fetchFilesByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilesByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload as File[];
      })
      .addCase(fetchFilesByProject.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // updateFileMD5Async
      .addCase(updateFileMD5Async.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFileMD5Async.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateFileMD5Async.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // markFileProcessedAsync
      .addCase(markFileProcessedAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markFileProcessedAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(markFileProcessedAsync.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      })
      // updateFileAsync
      .addCase(updateFileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFileAsync.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateFileAsync.rejected, (state, action) => {
        state.loading = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = 'An unknown error occurred';
        }
      });
  },
});

export const { setCurrentFile, clearCurrentFile, scanFile, toggleFileIgnore, markFileProcessed, updateFile, updateFileMD5 } = fileSlice.actions;
export default fileSlice.reducer;
