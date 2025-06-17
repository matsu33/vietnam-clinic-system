import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type RegisterInput } from '../schema';
import { login, register, verifyToken } from '../handlers/auth';
import { eq } from 'drizzle-orm';

describe('Authentication', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('register', () => {
    it('should create first admin user successfully', async () => {
      const input: RegisterInput = {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      };

      const result = await register(input);

      expect(result.username).toEqual('admin');
      expect(result.role).toEqual('admin');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save user to database with hashed password', async () => {
      const input: RegisterInput = {
        username: 'testuser',
        password: 'password123',
        role: 'doctor'
      };

      const result = await register(input);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].role).toEqual('doctor');
      expect(users[0].password_hash).not.toEqual('password123');
      expect(users[0].password_hash.length).toBeGreaterThan(0);
    });

    it('should allow registration of multiple users', async () => {
      // Create first user
      await register({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });

      // Create another user - should now be allowed
      const input: RegisterInput = {
        username: 'user2',
        password: 'password123',
        role: 'doctor'
      };

      const result = await register(input);
      expect(result.username).toEqual('user2');
      expect(result.role).toEqual('doctor');
      expect(result.id).toBeDefined();
    });

    it('should handle username uniqueness correctly', async () => {
      const input: RegisterInput = {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      };

      const result = await register(input);
      expect(result.username).toEqual('admin');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await register({
        username: 'testuser',
        password: 'password123',
        role: 'doctor'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: 'password123'
      };

      const result = await login(input);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user.username).toEqual('testuser');
      expect(result.user.role).toEqual('doctor');
      expect(result.user.id).toBeDefined();
    });

    it('should fail with invalid username', async () => {
      const input: LoginInput = {
        username: 'nonexistent',
        password: 'password123'
      };

      expect(login(input)).rejects.toThrow(/Invalid username or password/);
    });

    it('should fail with invalid password', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      expect(login(input)).rejects.toThrow(/Invalid username or password/);
    });

    it('should generate valid token', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: 'password123'
      };

      const result = await login(input);
      
      expect(result.token).toBeDefined();
      expect(result.token.length).toBeGreaterThan(0);
      
      // Test token verification
      const decoded = verifyToken(result.token);
      expect(decoded).not.toBeNull();
      expect(decoded?.username).toEqual('testuser');
      expect(decoded?.role).toEqual('doctor');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // Create and login user
      await register({
        username: 'testuser',
        password: 'password123',
        role: 'doctor'
      });

      const loginResult = await login({
        username: 'testuser',
        password: 'password123'
      });

      const decoded = verifyToken(loginResult.token);
      expect(decoded).not.toBeNull();
      expect(decoded?.username).toEqual('testuser');
      expect(decoded?.role).toEqual('doctor');
    });

    it('should reject invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should reject empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });
});