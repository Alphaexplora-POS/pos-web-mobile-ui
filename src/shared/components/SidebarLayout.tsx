import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ICONS } from './icons';
import type { IconType } from './icons';
import { useRole } from '../hooks/useRole';
import { USE_MOCK } from '../../mock/config';

interface SidebarItem {
  to: string;
  label: string;
  icon: IconType;
}

const ITEMS: SidebarItem[] = [
  { to: '/analytics', label: 'Centralized Analytics', icon: 'analytics' },
  { to: '/branches', label: 'Branch and Employees', icon: 'branches' },
  { to: '/products', label: 'Product Management', icon: 'products' },
  { to: '/inventory', label: 'Global Inventory', icon: 'inventory' },
  { to: '/transactions', label: 'Transaction History', icon: 'transactions' },
  { to: '/configuration', label: 'Configuration', icon: 'config' },
];

const SidebarLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { role, setRole } = useRole();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Alpha POS</h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {ITEMS.map((item) => {
            const isActive = pathname === item.to;
            const label =
              item.to === '/inventory' && role !== 'owner'
                ? 'Branch Inventory'
                : item.label;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {ICONS[item.icon]}
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-2">Viewing as</p>
          <div className="flex gap-2">
            <button
              className={`text-xs px-3 py-1 rounded ${role === 'owner' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setRole('owner')}
            >
              Owner
            </button>
            <button
              className={`text-xs px-3 py-1 rounded ${role === 'branch_manager' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setRole('branch_manager')}
            >
              Branch Manager
            </button>
          </div>
          {USE_MOCK && (
            <p className="mt-3 text-[10px] uppercase tracking-wide text-green-600 bg-green-50 rounded px-2 py-1 text-center">
              Demo mode · mock data
            </p>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
};

export default SidebarLayout;
