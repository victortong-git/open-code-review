# API Integration Documentation

This document outlines the integration between the frontend and backend API for the Open Code Review application.

## Backend API Structure

The backend provides RESTful API endpoints for managing projects, files, review requests, and findings.

### Base URL

All API requests use the base URL: `http://localhost:8001/api`

### Authentication

Currently, the API does not require authentication. This may change in future versions.

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | Get all projects |
| GET | `/projects/:id` | Get a project by ID |
| POST | `/projects` | Create a new project |
| PUT | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project |
| POST | `/projects/:id/scan` | Scan a project for code issues |

#### Project Object Structure

```json
{
  "id": 1,
  "name": "Example Project",
  "description": "A sample project for testing",
  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-05-15T10:30:00Z"
}
```

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files` | Get all files |
| GET | `/files/:id` | Get a file by ID |
| GET | `/projects/:id/files` | Get files by project ID |
| POST | `/files` | Create a new file |
| PUT | `/files/:id` | Update a file |
| DELETE | `/files/:id` | Delete a file |
| POST | `/files/:id/scan` | Scan a file for issues |
| PATCH | `/files/:id/toggle-ignore` | Toggle file ignore status |

#### File Object Structure

```json
{
  "id": 1,
  "project_id": 1,
  "file_path": "/src/main.js",
  "file_name": "main.js",
  "content": "// File content here",
  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-05-15T10:30:00Z"
}
```

### Review Requests

This API endpoint has been removed as the review_requests table is no longer needed.

### Findings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/findings` | Get all findings |
| GET | `/findings/:id` | Get a finding by ID |
| GET | `/files/:id/findings` | Get findings by file ID |
| POST | `/findings` | Create a new finding |
| PUT | `/findings/:id` | Update a finding |
| PATCH | `/findings/:id` | Update a finding status |
| DELETE | `/findings/:id` | Delete a finding |

#### Finding Object Structure

```json
{
  "id": 1,
  "file_id": 1,
  "type": "XSS Vulnerability",
  "description": "Potential XSS vulnerability in user input handling",
  "severity": "high",
  "status": "new",
  "line_number": 42,
  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-05-15T10:30:00Z"
}
```

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analysis/files/:id/analyze` | Trigger analysis for a file |
| GET | `/analysis/jobs/:jobId` | Get analysis status |
| GET | `/analysis/results/:jobId` | Get analysis results |

#### Analysis Request

```json
// No request body needed for analysis/files/:id/analyze
```

#### Analysis Response

```json
{
  "jobId": "abc123",
  "message": "Analysis started"
}
```

#### Job Status Response

```json
{
  "jobId": "abc123",
  "fileId": 1,
  "status": "in_progress",
  "progress": 45,
  "findingCount": 3,
  "startTime": "2025-05-17T12:34:56.789Z",
  "endTime": null
}
```

#### Analysis Results Response

```json
{
  "jobId": "abc123",
  "fileId": 1,
  "findings": [
    {
      "id": 1,
      "type": "Broken Access Control",
      "severity": "high",
      "description": "Missing access control checks on user data",
      "remediation": "Implement proper authorization checks",
      "codeSnippet": {
        "id": 1,
        "startLine": 15,
        "endLine": 25,
        "content": "function getUser(id) {\n  return db.users.findById(id);\n}"
      }
    }
  ],
  "startTime": "2025-05-17T12:34:56.789Z",
  "endTime": "2025-05-17T12:36:23.456Z"
}
```

### WebSocket Integration

The backend provides real-time updates through WebSocket connections.

#### WebSocket URL

```
ws://localhost:8001/ws
```

#### Event Types

1. **analysis_progress**:
   ```json
   {
     "type": "analysis_progress",
     "jobId": "abc123",
     "fileId": 1,
     "progress": 45,
     "status": "in_progress",
     "timestamp": "2025-05-17T12:35:30.123Z"
   }
   ```

2. **new_finding**:
   ```json
   {
     "type": "new_finding",
     "jobId": "abc123",
     "id": 1,
     "codeSnippetId": 1,
     "type": "Broken Access Control",
     "severity": "high",
     "description": "Missing access control checks on user data",
     "remediation": "Implement proper authorization checks",
     "codeSnippet": {
       "id": 1,
       "fileId": 1,
       "startLine": 15,
       "endLine": 25,
       "content": "function getUser(id) {\n  return db.users.findById(id);\n}"
     },
     "timestamp": "2025-05-17T12:35:45.678Z"
   }
   ```

3. **analysis_complete**:
   ```json
   {
     "type": "analysis_complete",
     "jobId": "abc123",
     "fileId": 1,
     "findingCount": 5,
     "summary": "Analysis completed successfully",
     "timestamp": "2025-05-17T12:36:23.456Z"
   }
   ```
