import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, footer, children }) => {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-navy text-white p-12">
        <h1 className="text-3xl font-bold">Alpha POS</h1>
        <div>
          <p className="text-4xl font-semibold leading-tight mb-4">
            Multi-branch retail, one workspace.
          </p>
          <p className="text-ink-muted">
            Signing up creates a workspace (tenant) and an owner profile. Branch managers get their
            own accounts with a PIN.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold text-ink-primary">Alpha POS</h1>
          </div>
          <h2 className="text-2xl font-bold text-ink-primary mb-2">{title}</h2>
          <p className="text-sm text-ink-muted mb-8">{subtitle}</p>
          {children}
          <div className="mt-8 text-sm text-ink-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
