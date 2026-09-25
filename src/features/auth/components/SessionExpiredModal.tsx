import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  SESSION_EXPIRED_EVENT,
  clearSignedIn,
  hasBeenSignedIn,
} from '../sessionExpiry';

const SessionExpiredModal: React.FC = () => {
  const { session, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const redirectingRef = useRef(false);
  const starredOnRestartRef = useRef(false);

  useEffect(() => {
    const onExpired = () => {
      if (redirectingRef.current) return;
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
      starredOnRestartRef.current = false;
      return;
    }
    if (!isLoading && !session && hasBeenSignedIn()) {
      starredOnRestartRef.current = true;
      setOpen(true);
    }
  }, [isLoading, session]);

  const handleSignInAgain = async () => {
    setRedirecting(true);
    redirectingRef.current = true;
    await new Promise((r) => setTimeout(r, 800));
    setOpen(false);
    clearSignedIn();
    try {
      await logout();
    } catch {
      /* ignore network/backend errors on expiry */
    }
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (open && starredOnRestartRef.current && !redirectingRef.current) {
      handleSignInAgain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Session expired"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center text-center">
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
          <h2 className="text-lg font-semibold text-ink-primary">Session expired</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Please login again for security purposes.
          </p>
        </div>
        <button
          type="button"
          disabled={redirecting}
          onClick={handleSignInAgain}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          {redirecting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting…
            </>
          ) : (
            'Sign in again'
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SessionExpiredModal;