'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const restoreSession = useCallback(async () => {
    const { setUser, setTokens, setLoading, logout } = useAuthStore.getState();
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const refreshRes = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
        });
        if (!refreshRes.ok) {
          logout();
          return;
        }
        const refreshJson = await refreshRes.json();
        setTokens(refreshJson.data.accessToken, refreshJson.data.refreshToken);
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${refreshJson.data.accessToken}` },
        });
        if (!meRes.ok) { logout(); return; }
        const meJson = await meRes.json();
        setUser(meJson.data);
      } else {
        const json = await res.json();
        setUser(json.data);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      useAuthStore.getState().setLoading(false);
      return;
    }
    restoreSession();
  }, [restoreSession, accessToken]);

  return <>{children}</>;
}
