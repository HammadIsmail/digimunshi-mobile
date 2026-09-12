import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ShopInfo {
  shop_id: string;
  owner_name: string;
  phone_number: string;
  shop_name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  shop: ShopInfo | null;
  login: (phoneNumber: string, pin: string) => Promise<void>;
  register: (ownerName: string, phoneNumber: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  shop: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    const unsubscribe = api.onUnauthorized(() => {
      setIsAuthenticated(false);
      setShop(null);
    });
    return unsubscribe;
  }, []);

  const checkAuth = async () => {
    try {
      const loggedIn = await api.isLoggedIn();
      if (loggedIn) {
        try {
          const info = await api.getMe();
          setShop(info);
        } catch {
          // ignore
        }
      } else {
        setShop(null);
      }
      setIsAuthenticated(loggedIn);
    } catch {
      setIsAuthenticated(false);
      setShop(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, pin: string) => {
    await api.login(phoneNumber, pin);
    try {
      const info = await api.getMe();
      setShop(info);
    } catch {
      // ignore
    }
    setIsAuthenticated(true);
  };

  const register = async (ownerName: string, phoneNumber: string, pin: string) => {
    await api.register(ownerName, phoneNumber, pin);
    try {
      const info = await api.getMe();
      setShop(info);
    } catch {
      // ignore
    }
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Error during logout:', e);
    } finally {
      setShop(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, shop, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
