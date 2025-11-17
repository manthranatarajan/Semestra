import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Moon, Sun, Check, Search } from 'lucide-react';

interface SignUpFlowProps {
  email: string;
  password: string;
  onComplete: () => void;
}

export const SignUpFlow = ({ email, password, onComplete }: SignUpFlowProps) => {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [shareProgress, setShareProgress] = useState(true);
  const [shareCourses, setShareCourses] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      await signUp(email, password);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            display_name: displayName,
            username: username || null,
            theme,
            share_progress: shareProgress,
            share_courses: shareCourses,
          });

        if (prefError) {
          if (prefError.code === '23505') {
            setError('Username already taken. Please choose another.');
            setStep(1);
            return;
          }
          throw prefError;
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (step === 1 && username && username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
    else handleSignUp();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md w-full"
      >
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i <= step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 && "Let's personalize your Semestra experience!"}
            {step === 2 && 'Choose your theme'}
            {step === 3 && 'Privacy settings'}
          </h2>
          <p className="text-slate-400 text-sm">
            {step === 1 && 'Tell us a bit about yourself'}
            {step === 2 && 'Select your preferred appearance'}
            {step === 3 && 'Control what you share with friends'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="johndoe"
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Letters, numbers, and underscores only</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme('light')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Sun className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-white font-medium">Light</p>
                  {theme === 'light' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2"
                    >
                      <Check className="w-5 h-5 text-blue-400 mx-auto" />
                    </motion.div>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme('dark')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Moon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <p className="text-white font-medium">Dark</p>
                  {theme === 'dark' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2"
                    >
                      <Check className="w-5 h-5 text-blue-400 mx-auto" />
                    </motion.div>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                  <div>
                    <p className="text-white font-medium">Share Progress</p>
                    <p className="text-sm text-slate-400">Let friends see your completion percentage</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareProgress}
                    onChange={(e) => setShareProgress(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                  <div>
                    <p className="text-white font-medium">Share Active Courses</p>
                    <p className="text-sm text-slate-400">Show friends which courses you're taking</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareCourses}
                    onChange={(e) => setShareCourses(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300">
                  You can always change these settings later from your profile.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mt-4"
          >
            {error}
          </motion.p>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-all"
            >
              Back
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
