import type { Role } from '../models/userTypes';

export const roleHome = (role: Role): string =>
  role === 'owner' ? '/analytics' : '/branches';