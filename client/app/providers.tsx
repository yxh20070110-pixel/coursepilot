'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE } from '@/lib/api';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  totalCreditsRequired: number;
  major?: string;
  grade?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (studentId: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, studentId: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...data, id: data._id });
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (saved) {
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (studentId: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentId, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };

      localStorage.setItem('token', data.token);
      setUser({ ...data.user, id: data.user.id || data.user._id });
      return {};
    } catch {
      return { error: '登录失败' };
    }
  };

  const register = async (name: string, studentId: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: studentId, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };

      localStorage.setItem('token', data.token);
      setUser({ ...data.user, id: data.user.id || data.user._id });
      return {};
    } catch {
      return { error: '注册失败' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
