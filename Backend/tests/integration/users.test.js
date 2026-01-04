require('dotenv').config();
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const UsersRouter = require('../../server/users');
const AuthRouter = require('../../server/auth');
const UserService = require('../../data/users/service');
const User = require('../../data/users/users');

const app = express();
app.use(express.json());

// Mock Socket.IO
const mockIo = {
  to: () => mockIo,
  emit: () => {}
};

app.use('/api/users', UsersRouter(mockIo));
app.use('/api/auth', AuthRouter());

describe('Users API Integration Tests', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Create a test user for authentication
    const userData = {
      name: 'apitestuser',
      email: 'apitest@example.com',
      password: 'password123',
      role: {
        name: 'user',
        scope: ['client']
      }
    };
    const userService = UserService(User);
    const result = await userService.create(userData);
    testUserId = result.user._id.toString();

    // Get auth token by logging in
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    if (loginResponse.body.token) {
      authToken = loginResponse.body.token;
    } else if (loginResponse.headers['set-cookie']) {
      // Token might be in cookie
      const cookie = loginResponse.headers['set-cookie'][0];
      authToken = cookie.split('token=')[1]?.split(';')[0];
    }
  });

  describe('PUT /api/users/change-password', () => {
    it('should change password successfully with valid current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully');
      expect(response.body.user).toBeDefined();

      // Verify new password works by trying to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'apitest@example.com',
          password: 'newpassword456'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.auth).toBe(true);
    });

    it('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword789'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('incorrect');
    });

    it('should reject password change without current password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          newPassword: 'newpassword789'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject password change without new password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          currentPassword: 'newpassword456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should reject password change with short new password', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', `token=${authToken}`)
        .send({
          currentPassword: 'newpassword456',
          newPassword: '12345' // Less than 6 characters
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('6 characters');
    });

    it('should reject password change without authentication', async () => {
      const response = await request(app)
        .put('/api/users/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword789'
        });

      expect(response.status).toBe(401);
    });
  });
});

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'registertestuser',
        email: 'registertest@example.com',
        password: 'password123',
        address: 'Test Address',
        country: 'Portugal',
        taxNumber: 123456789,
        role: {
          name: 'user',
          scope: ['client']
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User saved');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        name: 'duplicateuser',
        email: 'duplicate@example.com',
        password: 'password123',
        address: 'Test Address',
        country: 'Portugal',
        taxNumber: 987654321,
        role: {
          name: 'user',
          scope: ['client']
        }
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      const userData = {
        name: 'logintestuser',
        email: 'logintest@example.com',
        password: 'password123',
        address: 'Test Address',
        country: 'Portugal',
        taxNumber: 111222333,
        role: {
          name: 'user',
          scope: ['client']
        }
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      testUser = userData;
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.auth).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.decoded).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.auth).toBe(false);
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });
  });
});

