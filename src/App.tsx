import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { BookOpen } from 'lucide-react';

function AppContent() {
  const { user, loading, theme } = useAuth();

  if (loading) {
    return (
      <div className={theme === 'light' ? 'light' : 'dark'}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/10">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Semestra</span>
            </div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300">Loading Semestra...</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className={theme === 'light' ? 'light' : 'dark'}>{user ? <Dashboard /> : <LandingPage />}</div>;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
