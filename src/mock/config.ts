const envBool = (key: string, fallback: boolean): boolean => {
  const raw = import.meta.env[key];
  return raw === undefined || raw === '' ? fallback : raw !== 'false';
};

export const USE_MOCK = envBool('VITE_USE_MOCK', true);

export const USE_MOCK_IDENTITY = USE_MOCK && envBool('VITE_USE_MOCK_IDENTITY', true);

export const USE_MOCK_REFERENCE = USE_MOCK && envBool('VITE_USE_MOCK_REFERENCE', true);

export const USE_MOCK_PRODUCTS = USE_MOCK && envBool('VITE_USE_MOCK_PRODUCTS', true);

export const USE_MOCK_INVENTORY = USE_MOCK && envBool('VITE_USE_MOCK_INVENTORY', true);

export const USE_MOCK_TRANSACTIONS = USE_MOCK && envBool('VITE_USE_MOCK_TRANSACTIONS', true);

export const USE_MOCK_ANALYTICS = USE_MOCK && envBool('VITE_USE_MOCK_ANALYTICS', true);

export const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 250);

export const mockDelay = (ms: number = MOCK_DELAY_MS): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));