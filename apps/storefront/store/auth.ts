import { create } from 'zustand';

export type UserRole = 'GUEST' | 'CUSTOMER' | 'INFLUENCEUR';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: 'GUEST',
  setRole: (role) => set({ role }),
  login: (user) => set({ user, role: user.role }),
  logout: () => set({ user: null, role: 'GUEST' }),
}));
