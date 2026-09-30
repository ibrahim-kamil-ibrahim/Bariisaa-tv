import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('naik_admin_token', token);
    localStorage.setItem('naik_admin_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('naik_admin_token');
    localStorage.removeItem('naik_admin_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  hydrate: () => {
    const token = localStorage.getItem('naik_admin_token');
    const userStr = localStorage.getItem('naik_admin_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('naik_admin_token');
        localStorage.removeItem('naik_admin_user');
      }
    }
  },
}));
