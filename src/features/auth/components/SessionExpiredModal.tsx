import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CLOSE_ALL_MODALS_EVENT } from '../../../shared/components/Modal';
import {
  SESSION_EXPIRED_EVENT,
  clearSignedIn,
  hasBeenSignedIn,
} from '../sessionExpiry';
import Spinner from '../../../shared/components/Spinner';

const closeAllModals = () => {
  window.dispatchEvent(new Event(CLOSE_ALL_MODALS_EVENT));
};

const SessionExpiredModal: React.FC = () => {
  const { session, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const onExpired = () => {
      if (redirectingRef.current) return;
      if (!hasBeenSignedIn()) return;
      closeAllModals();
      setOpen(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (session) {
      redirectingRef.current = false;
      setRedirecting(false);
      setOpen(false);
      return;
    }
    if (!isLoading) {
      if (hasBeenSignedIn()) {
        closeAllModals();
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
  }, [isLoading, session]);

  const handleSignInAgain = async () => {
    setRedirecting(true);
    redirectingRef.current = true;
    await logout();
    clearSignedIn();
    setOpen(false);
    setRedirecting(false);
    navigate('/login', { replace: true });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Session expired"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={redirecting ? undefined : () => setOpen(false)}
      />
      <div className="relative bg-white rounded-lg border border-line shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-ink-primary">Session expired</h2>
          <button
            type="button"
            disabled={redirecting}
            aria-label="Close"
            className="text-ink-muted hover:text-ink-secondary text-2xl leading-none disabled:opacity-50"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-sm text-ink-secondary">
            Please login again for security purposes.
          </p>
          <button
            type="button"
            disabled={redirecting}
            onClick={handleSignInAgain}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            {redirecting ? (
              <>
                <Spinner />
                Redirecting…
              </>
            ) : (
              'Sign in again'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;