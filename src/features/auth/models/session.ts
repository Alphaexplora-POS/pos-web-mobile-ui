import type { AuthSession, Profile } from './authTypes';

export const buildSession = (input: {
  profile: Profile;
  tenantName: string;
  accessToken: string;
}): AuthSession => ({
  userId: input.profile.id,
  tenantId: input.profile.tenantId,
  tenantName: input.tenantName,
  branchId: input.profile.branchId,
  email: input.profile.email,
  firstName: input.profile.firstName,
  lastName: input.profile.lastName,
  role: input.profile.role === 'manager' ? 'branch_manager' : 'owner',
  accessToken: input.accessToken,
});