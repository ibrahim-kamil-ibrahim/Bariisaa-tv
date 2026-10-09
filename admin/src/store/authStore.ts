import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  roles: string[];
  avatar?: string | null;
}

export const ADMIN_ROLES = ['super_admin', 'admin'];
export const EDITOR_ROLES = ['super_admin', 'admin', 'editor'];
export const MODERATOR_ROLES = ['super_admin', 'admin', 'moderator'];
export const PANEL_ROLES = ['super_admin', 'admin', 'editor', 'moderator'];

export function hasRole(user: User | null, allowed: string[]): boolean {
  if (!user) return false;
  return user.roles.some((role) => allowed.includes(role));
}

function normalizeUser(user: User): User {
  if (Array.isArray(user.roles) && user.roles.length > 0) return { ...user, roles: user.roles };
  const legacy = user.role === 'superadmin' ? 'super_admin' : user.role === 'admin' ? 'admin' : null;
  return { ...user, roles: legacy ? [legacy] : [] };
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
    const normalized = normalizeUser(user);
    localStorage.setItem('naik_admin_token', token);
    localStorage.setItem('naik_admin_user', JSON.stringify(normalized));
    set({ user: normalized, token, isAuthenticated: true });
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
        const user = normalizeUser(JSON.parse(userStr) as User);
        localStorage.setItem('naik_admin_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('naik_admin_token');
        localStorage.removeItem('naik_admin_user');
      }
    }
  },
}));
