import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../models'; // Assuming sequelize is exported from models/index.ts

// Global beforeAll/afterAll in test-setup.ts handles sync and close

describe('File CRUD Operations', () => {
  it('should create a new file', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project', description: 'This is a test project' });
    const projectId = projectResponse.body.id;

    const response = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/test/path', file_name: 'test.file' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.file_name).toBe('test.file');
  });

  it('should get all files', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project for Files', description: 'Project for files description' });
    const projectId = projectResponse.body.id;

    await request(app).post('/api/files').send({ project_id: projectId, file_path: '/path/1', file_name: 'file1' });
    await request(app).post('/api/files').send({ project_id: projectId, file_path: '/path/2', file_name: 'file2' });
    const response = await request(app).get('/api/files');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(1);
  });

  it('should get a file by ID', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project for File', description: 'Project for file description' });
    const projectId = projectResponse.body.id;

    const createResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/specific/path', file_name: 'specific.file' });
    const fileId = createResponse.body.id;
    const response = await request(app).get(`/api/files/${fileId}`);
    expect(response.status).toBe(200);
    expect(response.body.file_name).toBe('specific.file');
  });

  it('should update a file', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Update File', description: 'Project to update file description' });
    const projectId = projectResponse.body.id;

    const createResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/update/path', file_name: 'update.file' });
    const fileId = createResponse.body.id;
    const response = await request(app)
      .put(`/api/files/${fileId}`)
      .send({ file_name: 'updated.file' });
    expect(response.status).toBe(200);
    expect(response.body.file_name).toBe('updated.file');
  });

  it('should delete a file', async () => {
    const projectResponse = await request(app)
      .post('/api/projects')
      .send({ name: 'Project to Delete File', description: 'Project to delete file description' });
    const projectId = projectResponse.body.id;

    const createResponse = await request(app)
      .post('/api/files')
      .send({ project_id: projectId, file_path: '/delete/path', file_name: 'delete.file' });
    const fileId = createResponse.body.id;
    const response = await request(app).delete(`/api/files/${fileId}`);
    expect(response.status).toBe(204);
  });
});