import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ICONS } from './icons';
import type { IconType } from './icons';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Role } from '../models/userTypes';
import { USE_MOCK } from '../../mock/config';

interface SidebarItem {
  to: string;
  label: string;
  icon: IconType;
  roles: Role[];
}

const ITEMS: SidebarItem[] = [
  { to: '/analytics', label: 'Analytics', icon: 'analytics', roles: ['owner', 'branch_manager'] },
  { to: '/branches', label: 'Employees', icon: 'branches', roles: ['owner', 'branch_manager'] },
  { to: '/products', label: 'Product Management', icon: 'products', roles: ['owner', 'branch_manager'] },
  { to: '/inventory', label: 'Global Inventory', icon: 'inventory', roles: ['owner', 'branch_manager'] },
  { to: '/transactions', label: 'Transaction History', icon: 'transactions', roles: ['owner', 'branch_manager'] },
  { to: '/shift', label: 'Shift', icon: 'shift', roles: ['owner', 'branch_manager'] },
  { to: '/configuration', label: 'Settings', icon: 'config', roles: ['owner', 'branch_manager'] },
];

const SidebarLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { role } = useRole();
  const { session, logout } = useAuth();

  const visibleItems = ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Alpha POS</h1>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.to;
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          {session && (
            <div className="text-sm">
              <p className="text-gray-900 font-medium">
                {session.firstName} {session.lastName}
              </p>
              <p className="text-gray-500 truncate">{session.tenantName}</p>
            </div>
          )}
          <button
            className="w-full text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
            onClick={logout}
          >
            Sign out
          </button>
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