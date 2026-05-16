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

function setAuthCookie(value: string) {
  document.cookie = `auth-storage=${encodeURIComponent(value)};path=/;max-age=604800;samesite=lax`;
}

function clearAuthCookie() {
  document.cookie = 'auth-storage=;path=/;max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      setUser: (user) => {
        set({ user });
        const state = useAuthStore.getState();
        setAuthCookie(JSON.stringify({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }));
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        const state = useAuthStore.getState();
        setAuthCookie(JSON.stringify({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }));
      },
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        clearAuthCookie();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
