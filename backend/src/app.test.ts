// Import the Express app
import request from 'supertest';
import { app } from './app';

describe('GET /', () => {
  it('should return "Backend server is running!"', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Backend server is running!');
  });
});