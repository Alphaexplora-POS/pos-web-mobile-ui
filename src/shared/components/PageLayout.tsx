import type { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, actions, children }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink-primary">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
};

export default PageLayout;
