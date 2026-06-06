import { create } from 'zustand';

interface UserState {
  id: number | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
}

interface AuthStore {
  token: string | null;
  user: UserState | null;
  isAuthenticated: boolean;
  login: (token: string, role: string, fullName: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token: string, role: string, fullName: string) => {
    localStorage.setItem('aegis_token', token);
    localStorage.setItem('aegis_role', role);
    localStorage.setItem('aegis_name', fullName);
    set({
      token,
      user: { id: null, email: null, full_name: fullName, role },
      isAuthenticated: true,
    });
  },
  logout: () => {
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_role');
    localStorage.removeItem('aegis_name');
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: () => {
    const token = localStorage.getItem('aegis_token');
    const role = localStorage.getItem('aegis_role');
    const name = localStorage.getItem('aegis_name');
    if (token && role) {
      set({
        token,
        user: { id: null, email: null, full_name: name, role },
        isAuthenticated: true,
      });
    }
  },
}));
