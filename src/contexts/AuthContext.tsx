import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, pin: string) => Promise<void>;
  register: (ownerName: string, phoneNumber: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const loggedIn = await api.isLoggedIn();
      setIsAuthenticated(loggedIn);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, pin: string) => {
    await api.login(phoneNumber, pin);
    setIsAuthenticated(true);
  };

  const register = async (ownerName: string, phoneNumber: string, pin: string) => {
    await api.register(ownerName, phoneNumber, pin);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Error during logout:', e);
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
