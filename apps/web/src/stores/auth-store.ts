import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from '@next-tickets/shared';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setUser: (user: UserDto) => void;
  setTokens: (access: string, refresh: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage', partialize: (state) => ({ refreshToken: state.refreshToken }) },
  ),
);
