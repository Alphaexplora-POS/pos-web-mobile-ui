import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './shared/models/queryClient';
import { onCacheInvalidation } from './shared/models/apiClient';
import './index.css';

// Whenever a feature clears its cached GET data, tell TanStack Query to refetch
// the paginated/list queries it owns too, so navigating back never shows stale
// names, quantities or statuses. Batched so one mutation triggers one sweep.
let queryInvalidationQueued = false;
onCacheInvalidation(() => {
  if (queryInvalidationQueued) return;
  queryInvalidationQueued = true;
  queueMicrotask(() => {
    queryInvalidationQueued = false;
    void queryClient.invalidateQueries();
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);