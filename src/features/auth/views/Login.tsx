import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from '../models/authSchemas';
import type { LoginFields } from '../models/authSchemas';
import { roleHome } from '../../../shared/utils/roleHome';
import PasswordInput from '../../../shared/components/PasswordInput';
import Spinner from '../../../shared/components/Spinner';

const Login: React.FC = () => {
  const { session, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isLoading) return null;
  if (session) return <Navigate to={roleHome(session.role)} replace />;

  const onSubmit = async (values: LoginFields) => {
    setError(null);
    try {
      const next = await login(values);
      navigate(roleHome(next.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <AuthLayout
      title="Sign in to your workspace"
      subtitle="Enter the email and password for your owner or manager account."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand hover:underline">
            Register your business
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm text-ink-secondary">Email</label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`mt-1 w-full rounded border px-3 py-2 focus:outline-none ${
              errors.email ? 'border-error focus:border-error' : 'border-line focus:border-brand'
            }`}
          />
          {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
        </div>
        <div>
          <PasswordInput
            label="Password"
            registration={register('password')}
            autoComplete="current-password"
            hasError={!!errors.password}
          />
          {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 bg-brand text-white rounded px-4 py-2 hover:bg-brand-dark disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Spinner /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
