import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SidebarLayout from './shared/components/SidebarLayout';
import { RoleProvider } from './shared/hooks/useRole';

const Branches = lazy(() => import('./features/branches/views/Branches'));
const Products = lazy(() => import('./features/products/views/Products'));
const GlobalInventory = lazy(() => import('./features/inventory/views/GlobalInventory'));
const Transactions = lazy(() => import('./features/transactions/views/Transactions'));
const Analytics = lazy(() => import('./features/analytics/views/Analytics'));
const Configuration = lazy(() => import('./features/configuration/views/Configuration'));

const App: React.FC = () => {
  return (
    <RoleProvider>
      <SidebarLayout>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">Loading...</div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/analytics" replace />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<GlobalInventory />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/configuration" element={<Configuration />} />
          </Routes>
        </Suspense>
      </SidebarLayout>
    </RoleProvider>
  );
};

export default App;
