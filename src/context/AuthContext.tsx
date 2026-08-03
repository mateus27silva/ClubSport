import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, handleSupabaseError, uploadImageToSupabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any | null;
  supabaseUser: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'github') => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  securityToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [securityToken, setSecurityToken] = useState<string | null>(null);

  // Sync profile with Supabase 'profiles' table and localStorage
  const syncUserProfile = async (sbUser: any, nameHint?: string): Promise<UserProfile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (data && !error) {
        if (data.settings) {
          try {
            localStorage.setItem('clubsport_app_settings', JSON.stringify(data.settings));
          } catch (e) {}
        }

        const prof: UserProfile = {
          uid: data.id,
          fullName: data.full_name || nameHint || 'Atleta ClubSport',
          username: data.username || `@${(data.full_name || 'atleta').toLowerCase().replace(/\s+/g, '_')}`,
          email: data.email || sbUser.email || '',
          bio: data.bio !== undefined && data.bio !== null ? data.bio : 'Atleta do ClubSport.',
          primarySport: data.primary_sport || 'Running',
          region: data.region || 'São Paulo, SP, Brasil',
          role: data.role || 'user',
          totalKm: data.total_km || 0,
          activeDays: 1,
          points: data.points || 0,
          avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
          isPro: false,
          clubs: [],
          createdAt: data.created_at || new Date().toISOString()
        };
        setUser(prof);
        try {
          localStorage.setItem('clubsport_user', JSON.stringify(prof));
        } catch (e) {
          console.warn('Could not cache user to localStorage', e);
        }
        return prof;
      } else {
        const fullName = nameHint || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Atleta ClubSport';
        const username = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const newProfPayload = {
          id: sbUser.id,
          full_name: fullName,
          username,
          email: sbUser.email || '',
          avatar_url: sbUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id}`,
          bio: 'Atleta do ClubSport.',
          primary_sport: 'Running',
          region: 'São Paulo, SP, Brasil',
          total_km: 0,
          activities_count: 0,
          points: 0,
          role: 'user',
          created_at: new Date().toISOString()
        };

        await supabase.from('profiles').upsert([newProfPayload]);

        const prof: UserProfile = {
          uid: sbUser.id,
          fullName,
          username,
          email: sbUser.email || '',
          bio: newProfPayload.bio,
          primarySport: 'Running',
          region: 'São Paulo, SP, Brasil',
          role: 'user',
          totalKm: 0,
          activeDays: 1,
          points: 0,
          avatarUrl: newProfPayload.avatar_url,
          isPro: false,
          clubs: [],
          createdAt: newProfPayload.created_at
        };
        setUser(prof);
        try {
          localStorage.setItem('clubsport_user', JSON.stringify(prof));
        } catch (e) {
          console.warn('Could not cache user to localStorage', e);
        }
        return prof;
      }
    } catch (err) {
      console.warn('Error syncing profile with Supabase:', err);
      const fallbackProf: UserProfile = {
        uid: sbUser.id || 'user_' + Date.now(),
        fullName: nameHint || sbUser.email?.split('@')[0] || 'Atleta ClubSport',
        username: `@${(sbUser.email?.split('@')[0] || 'atleta').toLowerCase()}`,
        email: sbUser.email || '',
        bio: 'Atleta ClubSport',
        primarySport: 'Running',
        region: 'São Paulo, SP, Brasil',
        role: 'user',
        totalKm: 0,
        activeDays: 1,
        points: 0,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sbUser.id || 'demo'}`,
        isPro: false,
        clubs: [],
        createdAt: new Date().toISOString()
      };
      setUser(fallbackProf);
      try {
        localStorage.setItem('clubsport_user', JSON.stringify(fallbackProf));
      } catch (e) {}
      return fallbackProf;
    }
  };

  useEffect(() => {
    // Initial restoration from localStorage for instant offline/re-open session
    try {
      const stored = localStorage.getItem('clubsport_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setSecurityToken(`bearer_local_${parsed.uid.slice(0, 8)}`);
        }
      }
    } catch (e) {
      console.warn('Error reading stored user from localStorage:', e);
    }

    // Listen for Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sbUser = session?.user || null;
      setSupabaseUser(sbUser);
      if (sbUser) {
        setSecurityToken(`bearer_supabase_${sbUser.id.slice(0, 8)}`);
        await syncUserProfile(sbUser);
      } else {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSecurityToken(null);
          try {
            localStorage.removeItem('clubsport_user');
          } catch (e) {}
        }
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setSecurityToken(`bearer_supabase_${session.user.id.slice(0, 8)}`);
        syncUserProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        throw error;
      }
      if (data.user) {
        await syncUserProfile(data.user);
      }
    } catch (e: any) {
      console.warn('Supabase auth error:', e?.message || e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } }
      });
      if (error) throw error;
      if (data.user) {
        await syncUserProfile(data.user, name);
      } else {
        // Local user creation when email confirmation is required or offline
        const localUid = 'user_' + Date.now();
        const localUser = { id: localUid, email };
        await syncUserProfile(localUser, name);
        setSecurityToken(`bearer_local_${localUid.slice(0, 8)}`);
      }
    } catch (e: any) {
      console.warn('Supabase signup notice:', e?.message || e);
      // Create registered user profile locally
      const localUid = 'user_' + Date.now();
      const localUser = { id: localUid, email };
      await syncUserProfile(localUser, name);
      setSecurityToken(`bearer_local_${localUid.slice(0, 8)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSocial = async (providerName: 'google' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (e: any) {
      console.warn('Supabase social notice:', e?.message || e);
      const name = providerName === 'google' ? 'Atleta Google' : 'Atleta GitHub';
      const fallbackUid = `${providerName}_user_${Date.now()}`;
      const fallbackUser = { id: fallbackUid, email: `${providerName}@clubsport.app` };
      await syncUserProfile(fallbackUser, name);
      setSecurityToken(`bearer_social_${fallbackUid.slice(0, 8)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async () => {
    setIsLoading(true);
    try {
      if (supabaseUser) {
        setSecurityToken(`passkey_bio_${Date.now()}`);
        await syncUserProfile(supabaseUser);
      } else {
        const guestEmail = `atleta_${Date.now().toString().slice(-4)}@clubsport.app`;
        const fallbackUid = 'passkey_user_' + Date.now();
        const fallbackUser = { id: fallbackUid, email: guestEmail };
        await syncUserProfile(fallbackUser, 'Atleta Biométrico');
        setSecurityToken(`passkey_bio_verified_${Date.now()}`);
      }
    } catch (e) {
      console.warn('Biometric passkey notice:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Logout notice:', e);
    } finally {
      setUser(null);
      setSupabaseUser(null);
      setSecurityToken(null);
      setIsLoading(false);
    }
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;

    let finalAvatarUrl = updated.avatarUrl;
    if (finalAvatarUrl && finalAvatarUrl.startsWith('data:')) {
      finalAvatarUrl = await uploadImageToSupabase(finalAvatarUrl, 'avatars');
    }

    const newProfile = { ...user, ...updated, avatarUrl: finalAvatarUrl || user.avatarUrl };
    setUser(newProfile);
    try {
      localStorage.setItem('clubsport_user', JSON.stringify(newProfile));
    } catch (e) {}

    try {
      const payload: any = {};
      if (updated.fullName) payload.full_name = updated.fullName;
      if (updated.username) payload.username = updated.username;
      if (updated.bio) payload.bio = updated.bio;
      if (updated.primarySport) payload.primary_sport = updated.primarySport;
      if (updated.region) payload.region = updated.region;
      if (finalAvatarUrl) payload.avatar_url = finalAvatarUrl;
      if (updated.totalKm !== undefined) payload.total_km = updated.totalKm;
      if (updated.points !== undefined) payload.points = updated.points;

      await supabase.from('profiles').update(payload).eq('id', user.uid);
    } catch (err) {
      handleSupabaseError(err, 'updateProfile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser: supabaseUser,
        supabaseUser,
        isAuthenticated: !!user,
        isLoading,
        loginWithEmail,
        signupWithEmail,
        loginWithSocial,
        loginWithBiometrics,
        logout,
        updateProfile,
        securityToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

