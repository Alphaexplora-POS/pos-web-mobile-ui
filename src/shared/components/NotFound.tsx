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
        <p className="text-6xl font-bold text-gray-300">404</p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-gray-500">
          This section doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            &larr; Back to previous page
          </button>
          <Link
            to={session ? roleHome(session.role) : '/login'}
            className="px-5 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;