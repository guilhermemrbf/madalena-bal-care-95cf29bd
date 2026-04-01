import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cacheUserForOffline, offlineLogin, markSetupComplete, isSetupComplete } from '@/lib/offlineAuth';

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

  // Fetch profile and role
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

  // Restore offline session on load
  useEffect(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_SESSION_KEY);
      if (cached && !navigator.onLine) {
        const data = JSON.parse(cached);
        setProfile(data.profile);
        setRole(data.role);
        setUser({ id: data.userId, email: data.email } as User);
        setIsOfflineSession(true);
        setLoading(false);
        return;
      }
    } catch {}

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
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

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchUserData(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Try online first
    if (navigator.onLine) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message };
      }
      
      // Cache for offline use
      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        if (userData.profile) {
          await cacheUserForOffline(email, password, data.user.id, userData.profile, userData.role as 'admin' | 'funcionario');
          // Also save session data for offline restore
          localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
            userId: data.user.id,
            email,
            profile: userData.profile,
            role: userData.role,
          }));
        }
      }
      return { error: null };
    }

    // Offline login
    const result = await offlineLogin(email, password);
    if (!result.success || !result.user) {
      return { error: result.error ?? 'Erro no login offline' };
    }

    // Set offline session
    setUser({ id: result.user.userId, email: result.user.email } as User);
    setProfile(result.user.profile);
    setRole(result.user.role);
    setIsOfflineSession(true);
    
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
      userId: result.user.userId,
      email: result.user.email,
      profile: result.user.profile,
      role: result.user.role,
    }));

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, cargo: string) => {
    const initials = fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'MB';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };

    // Update profile with cargo and initials
    if (data.user) {
      await supabase.from('profiles').update({ cargo, avatar_initials: initials }).eq('user_id', data.user.id);
      
      // Cache for offline
      const profileData = { full_name: fullName, cargo, avatar_initials: initials };
      await cacheUserForOffline(email, password, data.user.id, profileData, 'admin');
      markSetupComplete();
    }
    return { error: null };
  };

  const signOut = async () => {
    if (!isOfflineSession) {
      await supabase.auth.signOut();
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
      isOfflineSession,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
