export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'member';
}

export type Role = 'owner' | 'branch_manager';

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
}
