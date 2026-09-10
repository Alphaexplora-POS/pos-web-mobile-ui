import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './shared/components/SidebarLayout';
import { RoleProvider } from './shared/hooks/useRole';
import { AuthProvider } from './features/auth/hooks/useAuth';
import { useAuth } from './features/auth/hooks/useAuth';
import type { Role } from './shared/models/userTypes';

const Login = lazy(() => import('./features/auth/views/Login'));
const Register = lazy(() => import('./features/auth/views/Register'));
const Branches = lazy(() => import('./features/branches/views/Branches'));
const Products = lazy(() => import('./features/products/views/Products'));
const GlobalInventory = lazy(() => import('./features/inventory/views/GlobalInventory'));
const Transactions = lazy(() => import('./features/transactions/views/Transactions'));
const Analytics = lazy(() => import('./features/analytics/views/Analytics'));
const Configuration = lazy(() => import('./features/configuration/views/Configuration'));
const Shift = lazy(() => import('./features/transactions/views/Shift'));
import NotFound from './shared/components/NotFound';

const ALL_ROLES: Role[] = ['owner', 'branch_manager'];

const ProtectedLayout: React.FC<{ roles: Role[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
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
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">Loading...</div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/analytics"
              element={
                <ProtectedLayout roles={ALL_ROLES}>
                  <Analytics />
                </ProtectedLayout>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedLayout roles={ALL_ROLES}>
                  <Branches />
                </ProtectedLayout>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedLayout roles={ALL_ROLES}>
                  <Products />
                </ProtectedLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedLayout roles={ALL_ROLES}>
                  <GlobalInventory />
                </ProtectedLayout>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedLayout roles={ALL_ROLES}>
                  <Transactions />
                </ProtectedLayout>
              }
            />
            <Route
              path="/configuration"
              element={
                <ProtectedLayout roles={['owner']}>
                  <Configuration />
                </ProtectedLayout>
              }
            />
            <Route
              path="/shift"
              element={
                <ProtectedLayout roles={['branch_manager']}>
                  <Shift />
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
        </Suspense>
      </RoleProvider>
    </AuthProvider>
  );
};

export default App;