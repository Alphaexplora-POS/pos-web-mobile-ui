import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ICONS } from './icons';
import type { IconType } from './icons';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../../features/auth/hooks/useAuth';

import Modal from './Modal';
import Spinner from './Spinner';
import type { Role } from '../models/userTypes';

interface SidebarItem {
  to: string;
  label: string;
  icon: IconType;
  roles: Role[];
}

const ITEMS: SidebarItem[] = [
  { to: '/analytics', label: 'Analytics', icon: 'analytics', roles: ['owner', 'branch_manager'] },
  { to: '/branches', label: 'Branches & Employees', icon: 'branches', roles: ['owner', 'branch_manager'] },
  { to: '/products', label: 'Product Management', icon: 'products', roles: ['owner', 'branch_manager'] },
  { to: '/inventory', label: 'Global Inventory', icon: 'inventory', roles: ['owner', 'branch_manager'] },
  { to: '/transactions', label: 'Transaction History', icon: 'transactions', roles: ['owner', 'branch_manager'] },
  { to: '/configuration', label: 'Settings', icon: 'config', roles: ['owner', 'branch_manager'] },
  { to: '/super-admin/pending', label: 'Pending Approvals', icon: 'branches', roles: ['superadmin'] },
];

const SidebarLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const { role } = useRole();
  const { session, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleItems = ITEMS.filter((item) => item.roles.includes(role));
  const branchesLabel = role === 'owner' ? 'Branches & Employees' : 'Employees';

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 1_500));
    setLoggingOut(false);
    setConfirmLogout(false);
    await logout();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <aside className="w-64 bg-navy text-white flex flex-col shrink-0 h-full">
        <div className="px-6 pt-5 pb-5 border-b border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold tracking-tight">Alpha POS</h1>
            <span
              className={`text-xs px-2 py-1 rounded ${
                role === 'owner' || role === 'superadmin' ? 'bg-brand text-white' : 'bg-white/10 text-white'
              }`}
            >
              {role === 'owner' ? 'Owner' : role === 'superadmin' ? 'Super Admin' : 'Branch Manager'}
            </span>
          </div>
          {session && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {session.firstName.charAt(0)}
                {role === 'owner' || role === 'superadmin' ? session.lastName.charAt(0) : ''}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate leading-tight">
                  {session.firstName}
                  {role === 'owner' || role === 'superadmin' ? ` ${session.lastName}` : ''}
                </p>
                <p className="text-white/60 truncate text-xs">
                  {role === 'superadmin' ? 'System Owner' : session.tenantName}
                </p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.to;
            const label = item.to === '/branches' ? branchesLabel : item.label;
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
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <button
            className="w-full text-xs px-3 py-2 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            onClick={() => setConfirmLogout(true)}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>

      {confirmLogout && (
        <Modal title="Sign out" onClose={() => setConfirmLogout(false)} animate={false} size="sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-4 shrink-0">
              {ICONS.logout}
            </div>
            <p className="text-sm text-ink-secondary">Really want to sign out?</p>
          </div>
          <div className="flex justify-center gap-2 pt-6">
            <button
              type="button"
              className="text-sm px-4 py-2 rounded-md border border-line text-ink-secondary hover:bg-canvas transition-colors"
              onClick={() => setConfirmLogout(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-md bg-error text-white hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loggingOut ? (
                <>
                  <Spinner />
                  Signing out…
                </>
              ) : (
                'Sign out'
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SidebarLayout;