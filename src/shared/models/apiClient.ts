import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ApiErrorResponse {
  message?: string;
}

export const unwrapData = <T>(data: unknown): T => {
  if (data && typeof data === 'object' && 'data' in data && typeof (data as { data: unknown }).data === 'object') {
    return (data as { data: T }).data;
  }
  return data as T;
};

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const payload = data as ApiErrorResponse;
    const message = payload.message ?? 'Request failed';
    const method = init?.method ?? 'GET';
    if (method !== 'GET') {
      toast.error(message);
    }
    throw new Error(message);
  }
  return unwrapData<T>(data);
};