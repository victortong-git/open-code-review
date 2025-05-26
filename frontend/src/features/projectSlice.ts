import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { projectApi } from '../services/api';
import axios from 'axios';

// Define project type
export interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalFiles: number;
    scannedFiles: number;
    ignoredFiles: number;
    criticalRiskFindings: number;
    highRiskFindings: number;
    mediumRiskFindings: number;
    lowRiskFindings: number;
  };
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectApi.getAll();
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await projectApi.getById(id);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await projectApi.create(project);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }: { id: number, data: { name?: string; description?: string } }, { rejectWithValue }) => {
    try {
      const response = await projectApi.update(id, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: number, { rejectWithValue }) => {
    try {
      await projectApi.delete(id);
      return id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const scanAllProjects = createAsyncThunk(
  'projects/scanAllProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectApi.scanAll();
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const scanProject = createAsyncThunk(
  'projects/scanProject',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await projectApi.scan(id);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const getProjectStats = createAsyncThunk(
  'projects/getProjectStats',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await projectApi.getStats(id);
      return { id, stats: response.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project>) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProjects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchProjectById
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createProject
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateProject
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(project => project.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteProject
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project.id !== action.payload);
        if (state.currentProject && state.currentProject.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // scanProject
      .addCase(scanProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scanProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(scanProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // scanAllProjects
      .addCase(scanAllProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scanAllProjects.fulfilled, (state) => {
        state.loading = false;
        // The API returns scan results, not the updated projects list
        // We'll need to fetch projects again
      })
      .addCase(scanAllProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // getProjectStats
      .addCase(getProjectStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProjectStats.fulfilled, (state, action) => {
        state.loading = false;
        const { id, stats } = action.payload;
        const projectIndex = state.projects.findIndex(project => project.id === id);
        if (projectIndex !== -1) {
          state.projects[projectIndex].stats = stats;
        }
        if (state.currentProject && state.currentProject.id === id) {
          state.currentProject.stats = stats;
        }
      })
      .addCase(getProjectStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentProject, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
