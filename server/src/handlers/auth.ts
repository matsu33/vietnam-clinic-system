import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type RegisterInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

// Simple hash function for passwords (in production, use bcrypt)
const simpleHash = async (password: string): Promise<string> => {
  // Simple base64 encoding with salt (NOT SECURE FOR PRODUCTION)
  const salt = 'medical_software_salt_2024';
  const combined = password + salt;
  return Buffer.from(combined).toString('base64');
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const hashedInput = await simpleHash(password);
  return hashedInput === hash;
};

// Simple JWT-like token (in production, use jsonwebtoken)
const generateToken = (userId: number, username: string, role: string): string => {
  const payload = { userId, username, role, exp: Date.now() + 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const login = async (input: LoginInput): Promise<{ token: string; user: User }> => {
  try {
    // Fetch user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Compare password hash
    const isValidPassword = await comparePassword(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = generateToken(user.id, user.username, user.role);

    // Return user data (excluding password hash)
    const userData: User = {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { token, user: userData };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const register = async (input: RegisterInput): Promise<User> => {
  try {
    // NOTE: This endpoint should ideally be protected or managed by an admin interface in production
    // Currently allows open registration for development purposes

    // Check if username already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await simpleHash(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password_hash: hashedPassword,
        role: input.role,
      })
      .returning()
      .execute();

    const newUser = result[0];

    // Return user data (excluding password hash)
    return {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    };
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// Token verification function
export const verifyToken = (token: string): { userId: number; username: string; role: string } | null => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return { userId: payload.userId, username: payload.username, role: payload.role };
  } catch (error) {
    return null;
  }
};