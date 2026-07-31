import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { initialCurrentUser } from '../data/mockData';
import { auth, onAuthStateChanged, User, signOut as fbSignOut } from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithSocial: (provider: 'google' | 'github') => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  securityToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(initialCurrentUser);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [securityToken, setSecurityToken] = useState<string | null>('token_bio_auth_8f92a10e');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Map firebase user to profile
        setUser((prev) => ({
          ...(prev || initialCurrentUser),
          uid: fUser.uid,
          email: fUser.email || prev?.email || '',
          fullName: fUser.displayName || prev?.fullName || 'Athlete User',
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));
    setUser({
      ...initialCurrentUser,
      email,
      fullName: email.split('@')[0],
      username: `@${email.split('@')[0]}`
    });
    setSecurityToken(`token_auth_${Date.now()}`);
    setIsLoading(false);
  };

  const signupWithEmail = async (email: string, _pass: string, name: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 700));
    setUser({
      ...initialCurrentUser,
      uid: 'u_' + Date.now(),
      email,
      fullName: name,
      username: `@${name.toLowerCase().replace(/\s+/g, '_')}`
    });
    setSecurityToken(`token_auth_${Date.now()}`);
    setIsLoading(false);
  };

  const loginWithSocial = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 800));
    setUser({
      ...initialCurrentUser,
      fullName: provider === 'google' ? 'Google Athlete' : 'GitHub Athlete',
      username: `@${provider}_runner`,
      email: `athlete@${provider}.com`
    });
    setSecurityToken(`oauth_token_${provider}_${Date.now()}`);
    setIsLoading(false);
  };

  const loginWithBiometrics = async () => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 900));
    // Simulated FaceID / TouchID biometric scan success
    setUser(initialCurrentUser);
    setSecurityToken(`biometric_passkey_verified_${Date.now()}`);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setSecurityToken(null);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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
