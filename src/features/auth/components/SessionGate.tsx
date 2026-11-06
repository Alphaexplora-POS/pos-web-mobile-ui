import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import ErrorState from '../../../shared/components/ErrorState';
import Spinner from '../../../shared/components/Spinner';

const SessionGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoading, sessionError, retrySession } = useAuth();
  if (isLoading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center gap-3 bg-canvas p-6 text-sm text-ink-secondary">
        <span className="text-brand"><Spinner /></span>
        Checking your session…
      </div>
    );
  }
  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl font-semibold text-ink-primary">Unable to connect to your workspace</h1>
          <ErrorState message={sessionError} onRetry={() => { void retrySession(); }} />
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export default SessionGate;
