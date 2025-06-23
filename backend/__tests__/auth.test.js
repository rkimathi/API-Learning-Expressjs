const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index'); // Main express app
const User = require('../models/User'); // Mongoose User model

let mongoServer;

jest.setTimeout(30000); // 30 seconds timeout for async operations

// Helper to register and login a user, returns token and userId
// (Similar to the one in task.test.js, defined here for auth tests)
const setupUser = async (userData) => {
  // It's important that this helper doesn't conflict with global beforeEach/beforeAll user setups
  // if called from within a test or a nested beforeEach.
  // For User.deleteMany, ensure it's specific enough or part of a broader cleanup strategy.
  // await User.deleteMany({ email: userData.email }); // Be careful with this inside tests
  const registerRes = await request(app).post('/api/auth/register').send(userData);
  const token = registerRes.body.token;
  // const userId = registerRes.body.user.id; // Not always needed by caller here
  return { token /*, userId */ };
};


const mainTestUser = { name: 'Main Test User', email: 'main@example.com', password: 'password123' };
const rivalUserData = { name: 'Rival User', email: 'rival@example.com', password: 'password789' };


describe('Auth API', () => {
  // Using mainTestUser for most tests in this file.
  // rivalUserData is for testing email conflicts.
  let token; // Token for mainTestUser

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    // rivalUserData is now set up in the beforeEach of the "Update Profile" test suite
    // if needed for other top-level tests, it would be set up here.
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    try {
      await User.deleteMany({});
    } catch (error) {
      console.error("Error clearing User collection:", error);
      // Decide if test should proceed or fail here
    }
  });

  // Registration Tests
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mainTestUser);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token'); // Check for token
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(mainTestUser.email);
      expect(res.body.user.name).toBe(mainTestUser.name); // Check for name
      expect(res.body.user).not.toHaveProperty('password'); // Ensure password isn't returned
      expect(res.body.message).toBe('User registered successfully');
    });

    it('should not register an existing user', async () => {
      // First, register the user
      await request(app).post('/api/auth/register').send(mainTestUser);
      // Then, try to register again
      const res = await request(app)
        .post('/api/auth/register')
        .send(mainTestUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('User already exists');
    });

    it('should return validation errors for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: 'password123', name: 'Valid Name' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].email).toBe('Must be a valid email address');
    });

    it('should return validation errors for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'valid@example.com', password: '123', name: 'Valid Name' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].password).toBe('Password must be at least 6 characters long');
    });
  });

  // Login Tests
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app).post('/api/auth/register').send(mainTestUser);
    });

    it('should login an existing user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(mainTestUser);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token; // Save token for later tests (used by GET /profile)
    });

    it('should not login with incorrect email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: mainTestUser.password });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('Invalid credentials');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: mainTestUser.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('Invalid credentials');
    });
  });

  // Protected Route Tests
  describe('GET /api/auth/profile', () => {
    beforeEach(async () => {
      // This beforeEach is specific to the profile tests.
      // The global beforeEach (clearing all users) will have run.
      // Then we register and login mainTestUser to get its token.
      await request(app).post('/api/auth/register').send(mainTestUser);
      const loginRes = await request(app).post('/api/auth/login').send(mainTestUser);
      if (loginRes.body.token) {
        token = loginRes.body.token;
      } else {
        console.error("Failed to get token in beforeEach for profile tests");
        token = null;
      }
    });

    it('should access profile with a valid token', async () => {
      if (!token) throw new Error('Token not available for profile test. Check beforeEach setup.');
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe(mainTestUser.email);
    });

    it('should not access profile without a token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toEqual(401);
      expect(res.body.msg).toBe('No token, authorization denied');
    });

    it('should not access profile with an invalid token format', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `InvalidTokenFormat`);
      expect(res.statusCode).toEqual(401);
      expect(res.body.msg).toBe('Token is not in Bearer format');
    });

    it('should not access profile with a malformed/invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer aninvalidtoken`);
      expect(res.statusCode).toEqual(401);
      expect(res.body.msg).toBe('Token is not valid'); // Or specific error from jwt.verify
    });
  });

  // --- PUT /api/auth/me (Update Profile) ---
  describe('PUT /api/auth/me (Update Profile)', () => {
    let userForUpdateToken;
    const initialUserData = { name: 'Update Me', email: 'updateme@example.com', password: 'password123' };
    const updatedName = 'Updated Name';
    const updatedEmail = 'updated.email@example.com';
    const newPassword = 'newPassword456';

    beforeEach(async () => {
      // Global beforeEach (User.deleteMany({})) has run.
      // Setup rival user for conflict tests within this suite.
      // Ensure it's clean first, then register.
      await User.deleteMany({ email: rivalUserData.email });
      await request(app).post('/api/auth/register').send(rivalUserData);

      // Register and login a fresh user for the actual update tests.
      await User.deleteMany({ email: initialUserData.email });
      const setup = await setupUser(initialUserData);
      userForUpdateToken = setup.token;
    });

    it('should update user name successfully', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ name: updatedName });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe(updatedName);
      expect(res.body.email).toBe(initialUserData.email); // Email should remain unchanged
    });

    it('should update user email successfully', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ email: updatedEmail });
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(updatedEmail);
    });

    it('should not update email if new email is already taken by another user', async () => {
      // rivalUserData is created in the main beforeAll hook
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ email: rivalUserData.email }); // Trying to use rivalUser's email
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Email already in use by another account');
    });

    it('should update user password successfully', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ currentPassword: initialUserData.password, newPassword: newPassword });
      expect(res.statusCode).toBe(200);
      // Verify new password works for login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: initialUserData.email, password: newPassword });
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
    });

    it('should fail to update password with incorrect current password', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ currentPassword: 'wrongcurrentpassword', newPassword: newPassword });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Incorrect current password');
    });

    it('should fail to update password if currentPassword is not provided but newPassword is', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${userForUpdateToken}`)
        .send({ newPassword: newPassword });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Current password is required to update password');
    });

    it('should update multiple fields (name and email) successfully', async () => {
        const res = await request(app)
          .put('/api/auth/me')
          .set('Authorization', `Bearer ${userForUpdateToken}`)
          .send({ name: 'Multi Update Name', email: 'multi.update@example.com' });
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Multi Update Name');
        expect(res.body.email).toBe('multi.update@example.com');
      });

    it('should return validation error for invalid new email format', async () => {
        const res = await request(app)
            .put('/api/auth/me')
            .set('Authorization', `Bearer ${userForUpdateToken}`)
            .send({ email: 'invalid-email' });
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].email).toBe('Must be a valid email address');
    });

    it('should return validation error for new password too short', async () => {
        const res = await request(app)
            .put('/api/auth/me')
            .set('Authorization', `Bearer ${userForUpdateToken}`)
            .send({ currentPassword: initialUserData.password, newPassword: '123' });
        expect(res.statusCode).toBe(400);
        expect(res.body.errors[0].newPassword).toBe('New password must be at least 6 characters long');
    });
  });
});
