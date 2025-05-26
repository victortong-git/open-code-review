import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="flex flex-col items-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                {this.state.error?.message || 'An unexpected error occurred.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 btn btn-primary"
              >
                Reload the page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-2 btn btn-secondary"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
