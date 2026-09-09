export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 250);

export const mockDelay = (ms: number = MOCK_DELAY_MS): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));