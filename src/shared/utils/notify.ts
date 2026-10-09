import { toast } from 'sonner';

export const notifySuccess = (message: string): void => {
  toast.success(message);
};

export const notifyError = (err: unknown, fallback?: string): string => {
  return err instanceof Error && err.message ? err.message : (fallback ?? 'Something went wrong');
};