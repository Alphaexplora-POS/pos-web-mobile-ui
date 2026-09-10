import type { AuthSession, LoginInput, Profile, RegisterInput } from './authTypes';
import { buildSession } from './session';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

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

export const registerTenantOwner = async (input: RegisterInput): Promise<AuthSession> => {
  const signup = await postJson<{ userId: string; accessToken: string }>('/identity/auth/signup', {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
  });

  const tenant = await postJson<{ id: string; name: string }>('/identity/tenants', {
    name: input.businessName,
    businessType: input.businessType,
  });

  const profile = await postJson<Profile>('/identity/profiles', {
    tenantId: tenant.id,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'owner',
  });

  return buildSession({ profile, tenantName: tenant.name, accessToken: signup.accessToken });
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

export const fetchMe = async (): Promise<AuthSession | null> => {
  try {
    const payload = await request<MePayload>('/identity/auth/me');
    return buildSession({
      profile: payload.profile,
      tenantName: payload.tenantName,
      accessToken: '',
    });
  } catch {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  await postJson<unknown>('/identity/auth/logout', {});
};