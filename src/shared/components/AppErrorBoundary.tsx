import { Component } from 'react';
import type { ReactNode } from 'react';
import ErrorState from './ErrorState';

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
          <div className="w-full max-w-md space-y-4">
            <h1 className="text-xl font-semibold text-ink-primary">Unable to load this page</h1>
            <ErrorState
              message="The app could not load this page. Reload to try again."
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
