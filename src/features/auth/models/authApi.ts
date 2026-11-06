import type { AuthSession, LoginInput, Profile, RegisterInput } from './authTypes';
import { buildSession } from './session';
import { API_BASE_URL as API_BASE } from '../../../shared/models/apiConfig';

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
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const payload = data as { message?: unknown } | undefined;
    const message = typeof payload?.message === 'string' && payload.message
      ? payload.message
      : `The API request failed (HTTP ${res.status}). Please try again.`;
    if (res.status === 401 || res.status === 403) {
      throw new AuthError(message, res.status);
    }
    throw new Error(message);
  }
  if (!data || typeof data !== 'object') {
    throw new Error('The API returned an unexpected response. Please try again.');
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const payload = await request<MePayload>('/identity/auth/me', { signal: controller.signal });
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
  } finally {
    clearTimeout(timeout);
  }
};

export const logout = async (): Promise<void> => {
  await postJson<unknown>('/identity/auth/logout', {});
};
