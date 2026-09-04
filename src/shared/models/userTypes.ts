export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'member';
}

export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
}
