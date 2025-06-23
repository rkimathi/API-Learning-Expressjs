const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const Task = require('../models/Task');

jest.setTimeout(30000); // 30 seconds timeout for async operations

let mongoServer;
let authTokenUser1;
let userIdUser1;
let authTokenUser2; // For testing cross-user access
let userIdUser2; // For testing cross-user access

const user1Data = { name: 'User One', email: 'user1@example.com', password: 'password123' };
const user2Data = { name: 'User Two', email: 'user2@example.com', password: 'password456' };

// Helper to register and login a user, returns token and userId
const setupUser = async (userData) => {
  await User.deleteMany({ email: userData.email }); // Clean up just in case
  const registerRes = await request(app).post('/api/auth/register').send(userData);
  // console.log(`Register response for ${userData.email}:`, registerRes.body); // Debug
  const token = registerRes.body.token;
  const userId = registerRes.body.user.id;
  return { token, userId };
};

describe('Task API CRUD Operations', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    // Setup User 1
    const user1 = await setupUser(user1Data);
    authTokenUser1 = user1.token;
    userIdUser1 = user1.userId;

    // Setup User 2
    const user2 = await setupUser(user2Data);
    authTokenUser2 = user2.token;
    userIdUser2 = user2.userId;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear Task collection before each test. Users are set up once in beforeAll.
    await Task.deleteMany({});
  });

  // Task data for tests
  const sampleTaskData = { title: 'Test Task 1', description: 'Description for task 1' };
  let createdTaskUser1; // To store a task created by user1 for subsequent tests

  // --- POST /api/tasks ---
  describe('POST /api/tasks (Create Task)', () => {
    it('should create a new task for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send(sampleTaskData);
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe(sampleTaskData.title);
      expect(res.body.description).toBe(sampleTaskData.description);
      expect(res.body.user).toBe(userIdUser1);
      expect(res.body.status).toBe('pending'); // Default status
      createdTaskUser1 = res.body; // Save for other tests
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send({ description: 'Task without title' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].title).toBe('Title is required');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/api/tasks').send(sampleTaskData);
      expect(res.statusCode).toBe(401);
    });
  });

  // --- GET /api/tasks ---
  describe('GET /api/tasks (Get All Tasks for User)', () => {
    beforeEach(async () => {
      // Create a task for user1 to ensure there's data
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send(sampleTaskData);
    });

    it('should get all tasks for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authTokenUser1}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe(sampleTaskData.title);
      expect(res.body[0].user).toBe(userIdUser1);
    });

    it('should return an empty array if user has no tasks', async () => {
        // User 2 has no tasks yet in this beforeEach context
        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authTokenUser2}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      });
  });

  // --- GET /api/tasks/:id ---
  describe('GET /api/tasks/:id (Get Specific Task)', () => {
    let taskForUser1Id;
    beforeEach(async () => {
        const taskRes = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authTokenUser1}`)
            .send({ title: 'Specific Task Title', description: 'For GET by ID test' });
        taskForUser1Id = taskRes.body._id;
    });

    it('should get a specific task by ID if it belongs to the user', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskForUser1Id}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(taskForUser1Id);
      expect(res.body.title).toBe('Specific Task Title');
    });

    it('should return 404 for a non-existent task ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if trying to get another user\'s task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskForUser1Id}`) // taskForUser1Id belongs to user1
        .set('Authorization', `Bearer ${authTokenUser2}`); // user2 tries to access
      expect(res.statusCode).toBe(401); // Or 404 depending on how you want to hide existence
                                        // Current implementation in taskRoutes.js returns 401
    });
  });

  // --- PUT /api/tasks/:id ---
  describe('PUT /api/tasks/:id (Update Task)', () => {
    let taskToUpdateId;
    const initialUpdateData = { title: 'Task Before Update', description: 'Initial Desc' };
    const updatePayload = { title: 'Updated Task Title', status: 'in-progress' };

    beforeEach(async () => {
        const taskRes = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authTokenUser1}`)
            .send(initialUpdateData);
        taskToUpdateId = taskRes.body._id;
    });

    it('should update a task successfully if it belongs to the user', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskToUpdateId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`)
        .send(updatePayload);
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updatePayload.title);
      expect(res.body.status).toBe(updatePayload.status);
      expect(res.body.description).toBe(initialUpdateData.description); // Description not in updatePayload
    });

    it('should return 401 if trying to update another user\'s task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskToUpdateId}`)
        .set('Authorization', `Bearer ${authTokenUser2}`) // User 2 trying to update User 1's task
        .send(updatePayload);
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 when trying to update a non-existent task', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .put(`/api/tasks/${nonExistentId}`)
          .set('Authorization', `Bearer ${authTokenUser1}`)
          .send(updatePayload);
        expect(res.statusCode).toBe(404);
      });
  });

  // --- DELETE /api/tasks/:id ---
  describe('DELETE /api/tasks/:id (Delete Task)', () => {
    let taskToDeleteId;
    beforeEach(async () => {
        const taskRes = await request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authTokenUser1}`)
            .send({ title: 'Task To Delete', description: 'Will be deleted' });
        taskToDeleteId = taskRes.body._id;
    });

    it('should delete a task successfully if it belongs to the user', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskToDeleteId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Task removed successfully');

      // Verify task is actually deleted
      const getAttempt = await request(app)
        .get(`/api/tasks/${taskToDeleteId}`)
        .set('Authorization', `Bearer ${authTokenUser1}`);
      expect(getAttempt.statusCode).toBe(404);
    });

    it('should return 401 if trying to delete another user\'s task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskToDeleteId}`)
        .set('Authorization', `Bearer ${authTokenUser2}`); // User 2 trying to delete User 1's task
      expect(res.statusCode).toBe(401);
    });

    it('should return 404 when trying to delete a non-existent task', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
          .delete(`/api/tasks/${nonExistentId}`)
          .set('Authorization', `Bearer ${authTokenUser1}`);
        expect(res.statusCode).toBe(404);
      });
  });
});
