import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
}

const getInitialUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {}
  }
  return {
    id: 'guest',
    name: 'Rakesh Tank',
    email: 'rakesh@tankr.io',
    role: 'Admin',
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem('accessToken') || 'demo_token',
  isAuthenticated: true,
  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));

