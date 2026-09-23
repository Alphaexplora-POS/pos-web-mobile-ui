import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { roleHome } from '../utils/roleHome';

const NotFound: React.FC = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-ink-muted">404</p>
        <h1 className="mt-4 text-xl font-semibold text-ink-primary">
          Page not found
        </h1>
        <p className="mt-2 text-ink-muted">
          This section doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded bg-brand text-white hover:bg-brand-dark"
          >
            &larr; Back to previous page
          </button>
          <Link
            to={session ? roleHome(session.role) : '/login'}
            className="px-5 py-2 rounded bg-surface-hover text-ink-secondary hover:bg-surface-hover"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;