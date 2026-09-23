import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ICONS } from './icons';
import type { IconType } from './icons';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { Role } from '../models/userTypes';

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
  { to: '/configuration', label: 'Settings', icon: 'config', roles: ['owner', 'branch_manager'] },
];

const SidebarLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { role } = useRole();
  const { session, logout } = useAuth();

  const visibleItems = ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-navy text-white flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand inline-block shrink-0" />
            Alpha POS
          </h1>
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
                    ? 'bg-brand text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {ICONS[item.icon]}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          {session && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {session.firstName.charAt(0)}
                {session.lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">
                  {session.firstName} {session.lastName}
                </p>
                <p className="text-white/60 truncate text-xs">{session.tenantName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                role === 'owner' ? 'bg-brand text-white' : 'bg-white/10 text-white'
              }`}
            >
              {role === 'owner' ? 'Owner' : 'Branch Manager'}
            </span>
            <button
              className="flex-1 text-xs px-3 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
};

export default SidebarLayout;