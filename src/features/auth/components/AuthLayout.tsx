import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, footer, children }) => {
  return (
    <div className="flex min-h-screen justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-6xl my-auto">
          <div className="lg:hidden mb-8 flex justify-center">
            <h1 className="text-2xl font-bold text-ink-primary">Alpha POS</h1>
          </div>
          <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col lg:flex-row lg:min-h-[42rem]">
            <div className="hidden lg:block lg:w-2/5 bg-gradient-to-br from-[#0C1524] via-navy to-[#2C4A7A] shrink-0" />
            <div className="flex-1 p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-ink-primary mb-2">{title}</h2>
              <p className="text-sm text-ink-muted mb-8">{subtitle}</p>
              {children}
              <div className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">
                {footer}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AuthLayout;