import { useAuthStore } from '@/stores/auth-store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    useAuthStore.getState().setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch { return false; }
}

export async function apiClient<T>(path: string, options?: RequestInit & { params?: Record<string, string> }): Promise<T> {
  let token: string | null = null;
  try { token = useAuthStore.getState().accessToken; } catch {}
  const url = new URL(`${API}${path}`);
  if (options?.params) url.search = new URLSearchParams(options.params).toString();
  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) return apiClient(path, options);
    useAuthStore.getState().logout();
    throw new Error('Session expired');
  }
  return res.json();
}
