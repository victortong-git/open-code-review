import request from 'supertest';
import app from '../app';
import { sequelize, db } from '../models';
import fs from 'fs';
import path from 'path';

// Global beforeAll/afterAll in test-setup.ts handles sync and close

// Mock filesystem methods
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    existsSync: jest.fn().mockReturnValue(true),
    readdirSync: jest.fn(),
    readFileSync: jest.fn().mockReturnValue('Mock file content')
  };
});

// Mock path.join to return predictable paths for testing
jest.mock('path', () => {
  const originalModule = jest.requireActual('path');
  return {
    ...originalModule,
    join: jest.fn((...args) => {
      // Correctly mock path.join for projects directory
      if (args[0] === '/usr/src/app/projects' && args.length > 1) {
        return `/usr/src/app/projects/${args[1]}`;
      }
      return originalModule.join(...args);
    })
  };
});

describe('Project CRUD Operations', () => {
  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project', description: 'This is a test project' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Project');
  });

  it('should get all projects', async () => {
    await request(app).post('/api/projects').send({ name: 'Project 1', description: 'Project 1 description' });
    await request(app).post('/api/projects').send({ name: 'Project 2', description: 'Project 2 description' });
    const response = await request(app).get('/api/projects');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(1);
  });

  it('should get a project by ID', async () => {
    const createResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Specific Project', description: 'Specific project description' });
    const projectId = createResponse.body.id;
    const response = await request(app).get(`/api/projects/${projectId}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Specific Project');
  });

  it('should update a project', async () => {
    const createResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Update', description: 'Original description' });
    const projectId = createResponse.body.id;
    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .send({ name: 'Updated Project', description: 'Updated description' });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Project');
  });

  it('should delete a project', async () => {
    const createResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Delete', description: 'To be deleted' });
    const projectId = createResponse.body.id;
    const response = await request(app).delete(`/api/projects/${projectId}`);
    expect(response.status).toBe(204);
  });
});

describe('Project Scanning Operations', () => {
  beforeEach(() => {
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Setup mocks to match test scenarios
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path === '/usr/src/app/projects' || 
             path.includes('scan-project-') ||
             path.includes('stats-project');
    });

    // Setup readdirSync mock for project directories
    (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string, options: any) => {
      const withFileTypes = options && options.withFileTypes;
      const mockProjectContents = [
        { name: 'file1.js', isDirectory: () => false, path: `${dirPath}/file1.js` },
        { name: 'file2.js', isDirectory: () => false, path: `${dirPath}/file2.js` },
        { name: 'subdir', isDirectory: () => true, path: `${dirPath}/subdir` }
      ];

      if (dirPath === '/usr/src/app/projects') {
        const projectEntries = [
          { name: 'scan-project-1', isDirectory: () => true },
          { name: 'scan-project-2', isDirectory: () => true },
          { name: 'stats-project', isDirectory: () => true }
        ];
        return withFileTypes ? projectEntries : projectEntries.map(d => d.name);
      }
      
      if (dirPath === '/usr/src/app/projects/scan-project-1' ||
          dirPath === '/usr/src/app/projects/scan-project-2' ||
          dirPath === '/usr/src/app/projects/stats-project') {
        return withFileTypes ? mockProjectContents : mockProjectContents.map(d => d.name);
      }

      // For any 'subdir' within the mocked projects, return empty to stop recursion
      if ( (dirPath.startsWith('/usr/src/app/projects/scan-project-1/') ||
            dirPath.startsWith('/usr/src/app/projects/scan-project-2/') ||
            dirPath.startsWith('/usr/src/app/projects/stats-project/')) &&
            dirPath.endsWith('/subdir') ) {
        return []; // Empty directory for subdirectories
      }
      
      // Fallback for other paths - should ideally not be reached in these tests
      // console.warn(`fs.readdirSync mock called with unhandled path: ${dirPath}`);
      return []; 
    });
  });

  it('should scan a specific project', async () => {
    // Create a test project first
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'scan-project-1', description: 'Project for scanning test' });
    
    const projectId = projectRes.body.id;

    const response = await request(app).post(`/api/projects/${projectId}/scan`); // Changed GET to POST
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project scanned successfully');
    expect(response.body).toHaveProperty('projectId', projectId);
    // The number of files scanned depends on the mock structure (file1.js, file2.js)
    expect(response.body.files.length).toBe(2); 
  });

  it('should scan all projects', async () => {
    // Create a couple of test projects first
    await request(app).post('/api/projects').send({ name: 'scan-project-1', description: 'Project 1 for scanning' });
    await request(app).post('/api/projects').send({ name: 'scan-project-2', description: 'Project 2 for scanning' });

    const response = await request(app).post('/api/projects/scan'); // Changed GET to POST and path to /scan
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Projects scanned successfully');
    expect(response.body).toHaveProperty('scannedProjects');
    expect(Array.isArray(response.body.scannedProjects)).toBe(true);
  });

  it('should get project stats', async () => {
    // Create a test project
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'stats-project', description: 'Project for stats test' });
    
    const projectId = projectRes.body.id;
    
    // Create a test file in the project
    const file = await db.File.create({
      project_id: projectId,
      file_name: 'test-file.js',
      file_path: 'test-file.js',
      content: 'Test content',
      isScanned: true
    });
    
    // Create findings directly associated with the file
    await db.Finding.create({
      file_id: file.id,
      type: 'security', // Adding the required type field
      severity: 'high',
      description: 'High risk issue',
      status: 'open'
    });
    
    await db.Finding.create({
      file_id: file.id,
      type: 'security', // Adding the required type field
      severity: 'medium',
      description: 'Medium risk issue',
      status: 'open'
    });
    
    await db.Finding.create({
      file_id: file.id,
      type: 'security', // Adding the required type field
      severity: 'low',
      description: 'Low risk issue',
      status: 'open'
    });
    
    const response = await request(app).get(`/api/projects/${projectId}/stats`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalFiles');
    expect(response.body).toHaveProperty('scannedFiles');
    expect(response.body).toHaveProperty('highRiskFindings');
    expect(response.body).toHaveProperty('mediumRiskFindings');
    expect(response.body).toHaveProperty('lowRiskFindings');
    
    expect(response.body.totalFiles).toBe(1);
    expect(response.body.scannedFiles).toBe(1);
    expect(response.body.highRiskFindings).toBe(1);
    expect(response.body.mediumRiskFindings).toBe(1);
    expect(response.body.lowRiskFindings).toBe(1);
  });
});
