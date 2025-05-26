import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { codeSnippetApi } from '../services/api';

// Define code snippet type
export interface CodeSnippet {
  id: number;
  file_id: number;
  code: string;
  code_type?: string;
  start_line?: number;
  end_line?: number;
  line_of_code?: number;
  description?: string;
  initial_security_review?: string;
  initial_coding_quality?: string;
  isAssessed: boolean;
  assessedAt?: string;
  code_quality?: string;
  code_quality_reason?: string;
  code_snippet_example?: string;
  md5?: string; // MD5 hash of the source file
  createdAt: string;
  updatedAt: string;
}

interface CodeSnippetState {
  codeSnippets: CodeSnippet[];
  currentCodeSnippet: CodeSnippet | null;
  loading: boolean;
  error: string | null;
}

const initialState: CodeSnippetState = {
  codeSnippets: [],
  currentCodeSnippet: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCodeSnippets = createAsyncThunk(
  'codeSnippets/fetchCodeSnippets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await codeSnippetApi.getAll();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

export const fetchCodeSnippetById = createAsyncThunk(
  'codeSnippets/fetchCodeSnippetById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await codeSnippetApi.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

export const fetchCodeSnippetsByFile = createAsyncThunk(
  'codeSnippets/fetchCodeSnippetsByFile',
  async (fileId: number, { rejectWithValue }) => {
    try {
      const response = await codeSnippetApi.getByFile(fileId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

export const createCodeSnippet = createAsyncThunk(
  'codeSnippets/createCodeSnippet',
  async (codeSnippet: { 
    file_id: number; 
    code: string; 
    code_type?: string;
    start_line?: number;
    end_line?: number;
    line_of_code?: number;
    description?: string;
    initial_security_review?: string;
    initial_coding_quality?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await codeSnippetApi.create(codeSnippet);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

export const updateCodeSnippet = createAsyncThunk(
  'codeSnippets/updateCodeSnippet',
  async ({ id, data }: { 
    id: number, 
    data: { 
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
    } 
  }, { rejectWithValue }) => {
    try {
      const response = await codeSnippetApi.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

export const deleteCodeSnippet = createAsyncThunk(
  'codeSnippets/deleteCodeSnippet',
  async (id: number, { rejectWithValue }) => {
    try {
      await codeSnippetApi.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message || 'An unknown error occurred');
    }
  }
);

const codeSnippetSlice = createSlice({
  name: 'codeSnippets',
  initialState,
  reducers: {
    clearCodeSnippets: (state) => {
      state.codeSnippets = [];
    },
    setCurrentCodeSnippet: (state, action: PayloadAction<CodeSnippet | null>) => {
      state.currentCodeSnippet = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCodeSnippets
      .addCase(fetchCodeSnippets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCodeSnippets.fulfilled, (state, action) => {
        state.loading = false;
        state.codeSnippets = action.payload as CodeSnippet[];
      })
      .addCase(fetchCodeSnippets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchCodeSnippetById
      .addCase(fetchCodeSnippetById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCodeSnippetById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCodeSnippet = action.payload as CodeSnippet;
      })
      .addCase(fetchCodeSnippetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchCodeSnippetsByFile
      .addCase(fetchCodeSnippetsByFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCodeSnippetsByFile.fulfilled, (state, action) => {
        state.loading = false;
        state.codeSnippets = action.payload as CodeSnippet[];
      })
      .addCase(fetchCodeSnippetsByFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // createCodeSnippet
      .addCase(createCodeSnippet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCodeSnippet.fulfilled, (state, action) => {
        state.loading = false;
        state.codeSnippets.push(action.payload as CodeSnippet);
      })
      .addCase(createCodeSnippet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateCodeSnippet
      .addCase(updateCodeSnippet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCodeSnippet.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as CodeSnippet;
        const index = state.codeSnippets.findIndex(cs => cs.id === payload.id);
        if (index !== -1) {
          state.codeSnippets[index] = payload;
        }
        if (state.currentCodeSnippet?.id === payload.id) {
          state.currentCodeSnippet = payload;
        }
      })
      .addCase(updateCodeSnippet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // deleteCodeSnippet
      .addCase(deleteCodeSnippet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCodeSnippet.fulfilled, (state, action) => {
        state.loading = false;
        state.codeSnippets = state.codeSnippets.filter(cs => cs.id !== action.payload);
        if (state.currentCodeSnippet?.id === action.payload) {
          state.currentCodeSnippet = null;
        }
      })
      .addCase(deleteCodeSnippet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCodeSnippets, setCurrentCodeSnippet } = codeSnippetSlice.actions;
export default codeSnippetSlice.reducer;
