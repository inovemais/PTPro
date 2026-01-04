require('dotenv').config();
const UserService = require('../../data/users/service');
const User = require('../../data/users/users');
const bcrypt = require('bcrypt');

describe('UserService', () => {
  let userService;

  beforeAll(() => {
    userService = UserService(User);
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        name: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: {
          name: 'user',
          scope: ['client']
        }
      };

      const result = await userService.create(userData);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(userData.name);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.password).not.toBe(userData.password);
      expect(result.user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should reject user creation without password', async () => {
      const userData = {
        name: 'testuser',
        email: 'test@example.com',
        role: {
          name: 'user',
          scope: ['client']
        }
      };

      await expect(userService.create(userData)).rejects.toBeDefined();
    });
  });

  describe('changePassword', () => {
    let testUser;
    const originalPassword = 'password123';

    beforeEach(async () => {
      // Create a test user
      const userData = {
        name: 'changepassworduser',
        email: 'changepassword@example.com',
        password: originalPassword,
        role: {
          name: 'user',
          scope: ['client']
        }
      };
      const result = await userService.create(userData);
      testUser = result.user;
    });

    it('should change password successfully with correct current password', async () => {
      const newPassword = 'newpassword456';
      
      const result = await userService.changePassword(
        testUser._id.toString(),
        originalPassword,
        newPassword
      );

      expect(result).toBeDefined();
      expect(result.message).toBe('Password changed successfully');
      expect(result.user._id.toString()).toBe(testUser._id.toString());

      // Verify new password works
      const updatedUser = await User.findById(testUser._id);
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
      expect(passwordMatch).toBe(true);
    });

    it('should reject password change with incorrect current password', async () => {
      await expect(
        userService.changePassword(
          testUser._id.toString(),
          'wrongpassword',
          'newpassword456'
        )
      ).rejects.toContain('incorrect');
    });

    it('should reject password change with empty new password', async () => {
      await expect(
        userService.changePassword(
          testUser._id.toString(),
          originalPassword,
          ''
        )
      ).rejects.toContain('required');
    });

    it('should reject password change with short new password', async () => {
      await expect(
        userService.changePassword(
          testUser._id.toString(),
          originalPassword,
          '12345' // Less than 6 characters
        )
      ).rejects.toContain('6 characters');
    });

    it('should reject password change for non-existent user', async () => {
      const fakeId = new require('mongoose').Types.ObjectId();
      await expect(
        userService.changePassword(
          fakeId.toString(),
          originalPassword,
          'newpassword456'
        )
      ).rejects.toContain('not found');
    });
  });

  describe('findUser', () => {
    let testUser;
    const userData = {
      name: 'finduser',
      email: 'find@example.com',
      password: 'password123',
      role: {
        name: 'user',
        scope: ['client']
      }
    };

    beforeEach(async () => {
      const result = await userService.create(userData);
      testUser = result.user;
    });

    it('should find user by email with correct password', async () => {
      const foundUser = await userService.findUser({
        email: userData.email,
        password: userData.password
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.name).toBe(userData.name);
    });

    it('should find user by name with correct password', async () => {
      const foundUser = await userService.findUser({
        name: userData.name,
        password: userData.password
      });

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.name).toBe(userData.name);
    });

    it('should reject login with incorrect password', async () => {
      await expect(
        userService.findUser({
          email: userData.email,
          password: 'wrongpassword'
        })
      ).rejects.toBeDefined();
    });

    it('should reject login with non-existent user', async () => {
      await expect(
        userService.findUser({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      ).rejects.toBeDefined();
    });
  });

  describe('findUserById', () => {
    let testUser;

    beforeEach(async () => {
      const userData = {
        name: 'findbyiduser',
        email: 'findbyid@example.com',
        password: 'password123',
        role: {
          name: 'user',
          scope: ['client']
        }
      };
      const result = await userService.create(userData);
      testUser = result.user;
    });

    it('should find user by ID', async () => {
      const foundUser = await userService.findUserById(testUser._id.toString());
      
      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(testUser._id.toString());
      expect(foundUser.email).toBe(testUser.email);
    });

    it('should reject with invalid ID', async () => {
      await expect(
        userService.findUserById('invalidid')
      ).rejects.toBeDefined();
    });
  });

  describe('createToken', () => {
    it('should create a valid JWT token', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        name: 'testuser',
        role: {
          scope: ['client']
        }
      };

      const result = userService.createToken(user);

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.auth).toBe(true);
      expect(result.decoded).toBeDefined();
      expect(result.decoded.id).toBe(user._id);
      expect(result.decoded.name).toBe(user.name);
      expect(result.decoded.role).toEqual(['client']);
    });
  });
});

