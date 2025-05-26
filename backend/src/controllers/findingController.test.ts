import request from 'supertest';
import app from '../app';
import { sequelize } from '../models'; // Assuming sequelize is exported from models/index.ts

// Global beforeAll/afterAll in test-setup.ts handles sync and close

describe('Finding CRUD Operations', () => {
  it('should create a new finding', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project for Finding', description: 'This is a test project for finding' });
    const projectId = projectResponse.body.id;

    const fileResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/test/path', file_name: 'test.file' });
    const fileId = fileResponse.body.id;

    // Review Request step removed

    const response = await request(app)
      .post('/api/findings')
      .send({ type: 'Test Type', description: 'Test description', severity: 'High', status: 'Open' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.description).toBe('Test description');
  });

  it('should get all findings', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project for Findings', description: 'Project for findings description' });
    const projectId = projectResponse.body.id;

    const fileResponse1 = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/path/1', file_name: 'file1' });
    const fileId1 = fileResponse1.body.id;

    // Review Request steps removed

    await request(app).post('/api/findings').send({ type: 'Type 1', description: 'Finding 1', severity: 'Low', status: 'Open' });
    await request(app).post('/api/findings').send({ type: 'Type 2', description: 'Finding 2', severity: 'High', status: 'In Progress' });
    const response = await request(app).get('/api/findings');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(1);
  });

  it('should get a finding by ID', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project for Finding', description: 'Project for finding description' });
    const projectId = projectResponse.body.id;

    const fileResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/specific/path', file_name: 'specific.file' });
    const fileId = fileResponse.body.id;

    // Review Request step removed

    const createResponse = await request(app)
      .post('/api/findings')
      .send({ type: 'Specific Type', description: 'Specific description', severity: 'Medium', status: 'Resolved' });
    const findingId = createResponse.body.id;
    const response = await request(app).get(`/api/findings/${findingId}`);
    expect(response.status).toBe(200);
    expect(response.body.description).toBe('Specific description');
  });

  it('should update a finding', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Update Finding', description: 'Project to update finding description' });
    const projectId = projectResponse.body.id;

    const fileResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/update/path', file_name: 'update.file' });
    const fileId = fileResponse.body.id;

    // Review Request step removed

    const createResponse = await request(app)
      .post('/api/findings')
      .send({ type: 'Type to Update', description: 'Original description', severity: 'Low', status: 'Open' });
    const findingId = createResponse.body.id;
    const response = await request(app)
      .put(`/api/findings/${findingId}`)
      .send({ description: 'Updated description', severity: 'High', status: 'In Progress' });
    expect(response.status).toBe(200);
    expect(response.body.description).toBe('Updated description');
  });

  it('should delete a finding', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Delete Finding', description: 'Project to delete finding description' });
    const projectId = projectResponse.body.id;

    const fileResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/delete/path', file_name: 'delete.file' });
    const fileId = fileResponse.body.id;

    // Review Request step removed

    const createResponse = await request(app)
      .post('/api/findings')
      .send({ type: 'Type to Delete', description: 'To be deleted', severity: 'Low', status: 'Open' });
    const findingId = createResponse.body.id;
    const response = await request(app).delete(`/api/findings/${findingId}`);
    expect(response.status).toBe(204);
  });
});