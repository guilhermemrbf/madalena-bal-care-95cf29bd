import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cacheUserForOffline, offlineLogin, markSetupComplete } from '@/lib/offlineAuth';

interface Profile {
  full_name: string;
  cargo: string;
  avatar_initials: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: 'admin' | 'funcionario' | null;
  loading: boolean;
  isAdmin: boolean;
  isOfflineSession: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, cargo: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const OFFLINE_SESSION_KEY = 'mb_offline_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'funcionario' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  const fetchUserData = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('full_name, cargo, avatar_initials').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    const userRole = roleRes.data?.role ?? 'funcionario';
    setRole(userRole);
    return { profile: profileRes.data, role: userRole };
  };

  // Try to restore offline session from localStorage
  const restoreOfflineSession = useCallback(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_SESSION_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        setProfile(data.profile);
        setRole(data.role);
        setUser({ id: data.userId, email: data.email } as User);
        setIsOfflineSession(true);
        setLoading(false);
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    // If offline, restore from cache immediately
    if (!navigator.onLine) {
      if (restoreOfflineSession()) return;
      // No cached session and offline — just stop loading
      setLoading(false);
      return;
    }

    // Online flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setIsOfflineSession(false);
      if (sess?.user) {
        setTimeout(() => fetchUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchUserData(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [restoreOfflineSession]);

  const signIn = async (email: string, password: string) => {
    // Try online first
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message };
        }
        if (data.user) {
          const userData = await fetchUserData(data.user.id);
          if (userData.profile) {
            await cacheUserForOffline(email, password, data.user.id, userData.profile, userData.role as 'admin' | 'funcionario');
            localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
              userId: data.user.id, email,
              profile: userData.profile, role: userData.role,
            }));
          }
        }
        return { error: null };
      } catch {
        // Network error — fall through to offline
      }
    }

    // Offline login
    const result = await offlineLogin(email, password);
    if (!result.success || !result.user) {
      return { error: result.error ?? 'Erro no login offline' };
    }

    setUser({ id: result.user.userId, email: result.user.email } as User);
    setProfile(result.user.profile);
    setRole(result.user.role);
    setIsOfflineSession(true);

    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
      userId: result.user.userId, email: result.user.email,
      profile: result.user.profile, role: result.user.role,
    }));

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, cargo: string) => {
    const initials = fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'MB';
    const profileData = { full_name: fullName, cargo, avatar_initials: initials };
    const userId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Try online signup
    if (navigator.onLine) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) return { error: error.message };
        if (data.user) {
          // Wait a moment for the trigger to create the profile
          await new Promise(r => setTimeout(r, 1000));
          // Update profile with cargo and initials
          await supabase.from('profiles').update({ cargo, avatar_initials: initials }).eq('user_id', data.user.id);
          
          // If session exists (auto-confirm enabled), we're logged in
          if (data.session) {
            setSession(data.session);
            setUser(data.user);
            setProfile(profileData);
            setRole('admin');
            await cacheUserForOffline(email, password, data.user.id, profileData, 'admin');
            markSetupComplete();
            localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
              userId: data.user.id, email, profile: profileData, role: 'admin',
            }));
            return { error: null };
          }
          
          // No session — try signing in directly
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) return { error: signInError.message };
          if (signInData.user) {
            await cacheUserForOffline(email, password, signInData.user.id, profileData, 'admin');
            markSetupComplete();
            localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
              userId: signInData.user.id, email, profile: profileData, role: 'admin',
            }));
            return { error: null };
          }
        }
        return { error: null };
      } catch {
        // Network error — fall through to offline
      }
    }

    // Offline signup — store locally only
    await cacheUserForOffline(email, password, userId, profileData, 'admin');
    markSetupComplete();

    setUser({ id: userId, email } as User);
    setProfile(profileData);
    setRole('admin');
    setIsOfflineSession(true);

    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
      userId, email, profile: profileData, role: 'admin',
    }));

    return { error: null };
  };

  const signOut = async () => {
    if (!isOfflineSession) {
      try { await supabase.auth.signOut(); } catch {}
    }
    localStorage.removeItem(OFFLINE_SESSION_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setIsOfflineSession(false);
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      isAdmin: role === 'admin',
      isOfflineSession, signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
