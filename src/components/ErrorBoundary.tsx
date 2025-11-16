import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isSupabaseError = this.state.error?.message.includes('Supabase');

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-md rounded-2xl border border-red-500/20 p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {isSupabaseError ? 'Configuration Error' : 'Something Went Wrong'}
                </h1>
                <p className="text-slate-300 mb-4">
                  {isSupabaseError
                    ? 'Failed to connect to Supabase. Please check your environment configuration.'
                    : 'The application encountered an unexpected error.'}
                </p>

                {isSupabaseError && (
                  <div className="bg-black/30 rounded-xl p-4 mb-4 font-mono text-sm">
                    <p className="text-red-400 mb-3">Required environment variables:</p>
                    <div className="space-y-1 text-slate-300">
                      <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
                      <p>VITE_SUPABASE_ANON_KEY=your_anon_key_here</p>
                    </div>
                  </div>
                )}

                <div className="bg-black/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-400 font-semibold mb-2">Error Details:</p>
                  <p className="text-sm text-slate-300 font-mono break-all">
                    {this.state.error?.message}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-400">To fix this issue:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                    <li>Create a <code className="px-2 py-1 bg-white/5 rounded">.env</code> file in your project root</li>
                    <li>Copy the required variables from <code className="px-2 py-1 bg-white/5 rounded">.env.example</code></li>
                    <li>Add your Supabase project URL and anon key</li>
                    <li>Restart the development server</li>
                  </ol>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
