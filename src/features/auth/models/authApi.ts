import type { AuthSession, LoginInput, Profile, RegisterInput } from './authTypes';
import { buildSession } from './session';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const unwrap = (data: unknown): unknown => {
  if (data && typeof data === 'object' && 'data' in data && typeof (data as { data: unknown }).data === 'object') {
    return (data as { data: unknown }).data;
  }
  return data;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
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
    const payload = data as { message?: string };
    if (res.status === 401) {
      throw new AuthError(payload.message ?? 'Not authenticated', res.status);
    }
    throw new Error(payload.message ?? 'Request failed');
  }
  return unwrap(data) as T;
};

const postJson = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

interface LoginPayload {
  userId: string;
  accessToken: string;
  profile: Profile | null;
  tenantName: string;
}

interface MePayload {
  userId: string;
  profile: Profile;
  tenantName: string;
}

export const registerTenantOwner = async (input: RegisterInput): Promise<{ email: string }> => {
  await postJson<{ userId: string; accessToken: string }>('/identity/auth/signup', {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    businessName: input.businessName,
    businessType: input.businessType,
  });

  return { email: input.email };
};

export const loginWithEmail = async (input: LoginInput): Promise<AuthSession> => {
  const payload = await postJson<LoginPayload>('/identity/auth/login', {
    email: input.email,
    password: input.password,
  });

  if (!payload.profile) {
    throw new Error('Workspace setup is incomplete. Please contact your branch owner');
  }

  return buildSession({
    profile: payload.profile,
    tenantName: payload.tenantName,
    accessToken: payload.accessToken,
  });
};

export const fetchMe = async (): Promise<AuthSession | null | undefined> => {
  try {
    const payload = await request<MePayload>('/identity/auth/me');
    return buildSession({
      profile: payload.profile,
      tenantName: payload.tenantName,
      accessToken: '',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AuthError') {
      return null;
    }
    return undefined;
  }
};

export const logout = async (): Promise<void> => {
  await postJson<unknown>('/identity/auth/logout', {});
};