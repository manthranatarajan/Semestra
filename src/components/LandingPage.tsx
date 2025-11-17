import { motion } from 'framer-motion';
import { BookOpen, Calendar, TrendingUp, Zap, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SignUpFlow } from './SignUpFlow';

export const LandingPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUpFlow, setShowSignUpFlow] = useState(false);
  const { signIn } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        setShowSignUpFlow(true);
        setLoading(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      if (!isSignUp) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Semestra
            </span>
          </motion.div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">AI-Powered Academic Assistant</span>
            </motion.div>

            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Organize Your{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Semester
              </span>{' '}
              in Seconds
            </h1>

            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Upload your syllabuses and let AI instantly extract assignments, exams, deadlines,
              and grade weights. Stay organized with beautiful timelines and smart predictions.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: Calendar, label: 'Auto Calendar' },
                { icon: TrendingUp, label: 'Grade Predictor' },
                { icon: Zap, label: 'Instant Parse' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <feature.icon className="w-6 h-6 text-blue-400" />
                  <span className="text-sm text-slate-300">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="p-6 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10"
            >
              <h3 className="text-lg font-semibold mb-4">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h3>

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                    required
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </form>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Human-Computer Interaction</h3>
                    <p className="text-sm text-slate-400">Prof. Smith • Fall 2024</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'DP2: Low-Fi Prototype', date: 'Sep 8', weight: '8%', color: 'blue' },
                    { title: 'Midterm Exam', date: 'Oct 15', weight: '22%', color: 'red' },
                    { title: 'Final Project Demo', date: 'Dec 12', weight: '20%', color: 'green' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.1 }}
                      className={`p-4 bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-slate-400">Due: {item.date}</p>
                        </div>
                        <span className={`px-3 py-1 bg-${item.color}-500/20 text-${item.color}-400 rounded-full text-sm font-semibold`}>
                          {item.weight}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Current Grade</span>
                    <span className="text-2xl font-bold text-green-400">A-</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {showSignUpFlow && (
        <SignUpFlow
          email={email}
          password={password}
          onComplete={() => setShowSignUpFlow(false)}
        />
      )}
    </div>
  );
};
