
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { Role } from '../types';
import { mockLogin, mockRegisterStudent, mockRegisterOwner, mockOwnerLogout } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<User>;
  register: (name: string, phone: string, password: string) => Promise<User>;
  registerOwner: (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (phoneOrEmail: string, password: string): Promise<User> => {
    const loggedInUser = await mockLogin(phoneOrEmail, password);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const newUser = await mockRegisterStudent(name, phone, password);
    // Automatically log in the user after registration
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const registerOwner = useCallback(async (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string): Promise<User> => {
    const newOwner = await mockRegisterOwner(name, email, phone, password, canteenName, idProofUrl);
    // Do not log in; owner must be approved first.
    return newOwner;
  }, []);
  

  const logout = useCallback(async () => {
    if (user && user.role === Role.CANTEEN_OWNER) {
      await mockOwnerLogout(user.id);
    }
    setUser(null);
    localStorage.removeItem('user');
  }, [user]);
  
  const updateUser = useCallback((data: Partial<User>) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    });
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerOwner, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};