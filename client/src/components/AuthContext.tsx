import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trpc } from '@/utils/trpc';
import type { User } from '../../../server/src/schema';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  registerAdmin: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await trpc.auth.login.mutate({ username, password });
      
      setToken(response.token);
      setUser(response.user);
      setIsLoggedIn(true);
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const registerAdmin = async (username: string, password: string) => {
    try {
      await trpc.auth.register.mutate({ 
        username, 
        password, 
        role: 'admin' 
      });
    } catch (error) {
      console.error('Admin registration failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    registerAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};