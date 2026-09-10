import type { AuthSession, Profile, SessionRole } from './authTypes';

const WEB_ROLES: Record<string, SessionRole> = { owner: 'owner', manager: 'branch_manager' };

export const buildSession = (input: {
  profile: Profile;
  tenantName: string;
  accessToken: string;
}): AuthSession => {
  const role = WEB_ROLES[input.profile.role];
  if (!role) {
    throw new Error('Invalid username or password');
  }
  return {
    userId: input.profile.id,
    tenantId: input.profile.tenantId,
    tenantName: input.tenantName,
    branchId: input.profile.branchId,
    email: input.profile.email,
    firstName: input.profile.firstName,
    lastName: input.profile.lastName,
    role,
    accessToken: input.accessToken,
  };
};
