import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import SidebarLayout from './shared/components/SidebarLayout';
import {
  AnalyticsSkeleton,
  BranchesSkeleton,
  ConfigurationSkeleton,
  InventorySkeleton,
  ProductsSkeleton,
  TransactionsSkeleton,
} from './shared/components/Skeletons';
import { RoleProvider } from './shared/hooks/useRole';
import { AuthProvider } from './features/auth/hooks/useAuth';
import { useAuth } from './features/auth/hooks/useAuth';
import { hasBeenSignedIn } from './features/auth/sessionExpiry';
import SessionExpiredModal from './features/auth/components/SessionExpiredModal';
import type { Role } from './shared/models/userTypes';

const Login = lazy(() => import('./features/auth/views/Login'));
const Register = lazy(() => import('./features/auth/views/Register'));
const Branches = lazy(() => import('./features/branches/views/Branches'));
const Products = lazy(() => import('./features/products/views/Products'));
const GlobalInventory = lazy(() => import('./features/inventory/views/GlobalInventory'));
const Transactions = lazy(() => import('./features/transactions/views/Transactions'));
const Analytics = lazy(() => import('./features/analytics/views/Analytics'));
const Configuration = lazy(() => import('./features/configuration/views/Configuration'));
import NotFound from './shared/components/NotFound';

const ALL_ROLES: Role[] = ['owner', 'branch_manager'];

const WithSkeleton: React.FC<{ fallback: ReactNode; children: ReactNode }> = ({ fallback, children }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

const ProtectedLayout: React.FC<{ roles: Role[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (!session) {
    // If the user was previously signed in but has no session (expired/restart),
    // keep the app mounted so the content stays visible behind the session-expired modal.
    if (hasBeenSignedIn()) {
      return <SidebarLayout>{children}</SidebarLayout>;
    }
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(session.role)) {
    return (
      <SidebarLayout>
        <NotFound />
      </SidebarLayout>
    );
  }
  return <SidebarLayout>{children}</SidebarLayout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{
            style: { background: '#1B2A47', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        />
        <SessionExpiredModal />
        <Routes>
          <Route
            path="/login"
            element={
              <Suspense fallback={null}>
                <Login />
              </Suspense>
            }
          />
          <Route
            path="/register"
            element={
              <Suspense fallback={null}>
                <Register />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<AnalyticsSkeleton title="Analytics" owner />}>
                  <Analytics />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<BranchesSkeleton />}>
                  <Branches />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<ProductsSkeleton />}>
                  <Products />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<InventorySkeleton title="Global Inventory" />}>
                  <GlobalInventory />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<TransactionsSkeleton />}>
                  <Transactions />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route
            path="/configuration"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <WithSkeleton fallback={<ConfigurationSkeleton />}>
                  <Configuration />
                </WithSkeleton>
              </ProtectedLayout>
            }
          />
          <Route path="/" element={<Navigate to="/analytics" replace />} />
          <Route
            path="*"
            element={
              <ProtectedLayout roles={ALL_ROLES}>
                <NotFound />
              </ProtectedLayout>
            }
          />
        </Routes>
      </RoleProvider>
    </AuthProvider>
  );
};

export default App;