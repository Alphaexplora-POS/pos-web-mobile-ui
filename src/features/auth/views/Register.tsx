import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { registerSchema } from '../models/authSchemas';
import { roleHome } from '../../../shared/utils/roleHome';
import PasswordInput from '../../../shared/components/PasswordInput';
import Spinner from '../../../shared/components/Spinner';

const registerWithConfirm = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type RegisterWithConfirm = z.infer<typeof registerWithConfirm>;

const Register: React.FC = () => {
  const { session, isLoading, register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterWithConfirm>({
    resolver: zodResolver(registerWithConfirm),
    defaultValues: {
      businessName: '',
      businessType: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (isLoading) return null;
  if (session) return <Navigate to={roleHome(session.role)} replace />;

  const onSubmit = async (values: RegisterWithConfirm) => {
    setError(null);
    try {
      const next = await registerAccount({
        businessName: values.businessName,
        businessType: values.businessType,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      navigate(roleHome(next.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const inputClass = (hasError: boolean) =>
    `mt-1 w-full rounded border px-3 py-2 focus:outline-none ${
      hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
    }`;

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Register your business and owner account. You can add branch managers and employees after you sign in."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Business name</label>
            <input {...register('businessName')} className={inputClass(!!errors.businessName)} />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700">Business type</label>
            <input {...register('businessType')} placeholder="e.g. Retail, Restaurant" className={inputClass(!!errors.businessType)} />
            {errors.businessType && (
              <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">First name</label>
            <input {...register('firstName')} className={inputClass(!!errors.firstName)} />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700">Last name</label>
            <input {...register('lastName')} className={inputClass(!!errors.lastName)} />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input type="email" autoComplete="email" {...register('email')} className={inputClass(!!errors.email)} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <PasswordInput
              label="Password"
              registration={register('password')}
              autoComplete="new-password"
              hasError={!!errors.password}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <PasswordInput
              label="Confirm password"
              registration={register('confirmPassword')}
              autoComplete="new-password"
              hasError={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Spinner /> Creating workspace…
            </>
          ) : (
            'Create workspace'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;