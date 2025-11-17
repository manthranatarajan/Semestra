import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserPreferences } from '../lib/supabase';
import { testSupabaseConnection } from '../lib/connectionTest';
import { getInitialTheme, applyTheme } from '../lib/theme';

interface AuthContextType {
  user: User | null;
  userPreferences: UserPreferences | null;
  theme: 'light' | 'dark';
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    profileData?: {
      display_name?: string;
      username?: string | null;
      school?: string | null;
      grad_year?: number | null;
      major?: string | null;
      share_progress?: boolean;
      share_courses?: boolean;
      theme?: 'light' | 'dark';
    }
  ) => Promise<{ user: User | null; sessionPresent: boolean }>;
  signOut: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [loading, setLoading] = useState(true);

  const savePendingProfile = (email: string, payload: Record<string, unknown>) => {
    try {
      localStorage.setItem(`semestra_pending_profile_${email}`, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to persist pending profile locally:', error);
    }
  };

  const consumePendingProfile = (email: string | null | undefined) => {
    if (!email) return null;
    const key = `semestra_pending_profile_${email}`;
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      localStorage.removeItem(key);
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Unable to load pending profile:', error);
      return null;
    }
  };

  const fetchUserPreferences = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      let prefs = data;

      if (!prefs) {
        const metadata = authUser.user_metadata || {};
        const pending = consumePendingProfile(authUser.email);
        const initialTheme = (metadata.theme || pending?.theme || getInitialTheme()) as 'light' | 'dark';
        console.log('[Auth] Seeding user preferences from metadata', { metadata, pending });

        const insertPayload = {
          user_id: authUser.id,
          display_name:
            (pending?.display_name as string) ||
            (metadata.display_name as string) ||
            authUser.email?.split('@')[0] ||
            'User',
          username: (pending?.username as string) || (metadata.username as string) || null,
          school: (pending?.school as string) || (metadata.school as string) || null,
          grad_year: (pending?.grad_year as number) || (metadata.grad_year as number) || null,
          major: (pending?.major as string) || (metadata.major as string) || null,
          theme: initialTheme,
          share_progress:
            (pending?.share_progress as boolean) ??
            (metadata.share_progress as boolean) ??
            true,
          share_courses:
            (pending?.share_courses as boolean) ??
            (metadata.share_courses as boolean) ??
            true,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('user_preferences')
          .insert(insertPayload)
          .select()
          .single();

        if (insertError) throw insertError;
        prefs = inserted;
      }

      if (prefs) {
        setUserPreferences(prefs);
        setThemeState(prefs.theme);
        applyTheme(prefs.theme);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const connectionResult = await testSupabaseConnection();

      if (!connectionResult.success) {
        console.warn('Supabase connection check failed, but continuing...');
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserPreferences(session.user);
        }
        setLoading(false);
      }).catch((error) => {
        console.error('Failed to get session:', error);
        setLoading(false);
      });
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserPreferences(session.user);
        } else {
          setUserPreferences(null);
          const savedTheme = getInitialTheme();
          setThemeState(savedTheme);
          applyTheme(savedTheme);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    profileData?: {
      display_name?: string;
      username?: string | null;
      school?: string | null;
      grad_year?: number | null;
      major?: string | null;
      share_progress?: boolean;
      share_courses?: boolean;
      theme?: 'light' | 'dark';
    }
  ) => {
    console.log('[Auth] Signing up...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: profileData?.display_name,
          username: profileData?.username,
          school: profileData?.school,
          grad_year: profileData?.grad_year,
          major: profileData?.major,
          share_progress: profileData?.share_progress,
          share_courses: profileData?.share_courses,
          theme: profileData?.theme,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;

    if (email && profileData) {
      savePendingProfile(email, profileData);
    }

    return { user: data.user, sessionPresent: !!data.session };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!user) return;

    const payload = {
      ...prefs,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    console.log('[Profile] Saving preferences', payload);

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to update preferences', error);
      throw error;
    }

    if (data) {
      setUserPreferences(data);
      if (data.theme) {
        setThemeState(data.theme);
        applyTheme(data.theme);
      }
    } else {
      await fetchUserPreferences(user);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
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
