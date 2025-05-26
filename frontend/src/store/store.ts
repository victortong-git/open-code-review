import { configureStore } from '@reduxjs/toolkit';
import projectReducer from '../features/projectSlice';
import fileReducer from '../features/fileSlice';
import findingReducer from '../features/findingSlice';
import codeSnippetReducer from '../features/codeSnippetSlice';
import analysisReducer from '../features/analysisSlice';

export const store = configureStore({
  reducer: {
    projects: projectReducer,
    files: fileReducer,
    findings: findingReducer,
    codeSnippets: codeSnippetReducer,
    analysis: analysisReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
