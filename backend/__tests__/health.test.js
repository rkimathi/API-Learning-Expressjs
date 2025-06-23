const request = require('supertest');
const app = require('../index'); // Adjust path as necessary if index.js is moved

jest.setTimeout(30000); // 30 seconds timeout

describe('Health Check API', () => {
  it('GET /api/health should return status UP', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body).toHaveProperty('timestamp');
    // Check if timestamp is a valid ISO 8601 date string
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
  });

  it('GET /api/nonexistentroute should return 404', async () => {
    const response = await request(app).get('/api/nonexistentroute');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });
});
