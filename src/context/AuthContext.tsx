import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserPreferences } from '../lib/supabase';
import { testSupabaseConnection } from '../lib/connectionTest';

interface AuthContextType {
  user: User | null;
  userPreferences: UserPreferences | null;
  theme: 'light' | 'dark';
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);

  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUserPreferences(data);
        setThemeState(data.theme);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const connectionResult = await testSupabaseConnection();

      if (!connectionResult.success) {
        console.warn('⚠️ Supabase connection check failed, but continuing...');
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserPreferences(session.user.id);
        }
        setLoading(false);
      }).catch((error) => {
        console.error('❌ Failed to get session:', error);
        setLoading(false);
      });
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserPreferences(session.user.id);
        } else {
          setUserPreferences(null);
          setThemeState('dark');
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) throw error;

    await fetchUserPreferences(user.id);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (user) {
      updatePreferences({ theme: newTheme });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userPreferences, theme, loading, signIn, signUp, signOut, updatePreferences, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
