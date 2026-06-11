import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary menangkap error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
          <ShieldAlert className="h-14 w-14 text-danger" />
          <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
            Terjadi kesalahan tak terduga
          </h1>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            Aplikasi mengalami error. Data assessment Anda tetap aman di penyimpanan lokal.
          </p>
          {this.state.message && (
            <code className="mt-3 rounded bg-surface px-3 py-1.5 font-mono text-xs text-danger">
              {this.state.message}
            </code>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-10 rounded-md bg-accent px-5 text-sm font-semibold text-background"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
