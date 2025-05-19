
"use client";
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, db, SUPER_ADMIN_EMAIL } from '@/lib/firebase';
import type { UserProfile, SuperAdminProfile } from '@/types';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserProfile | null;
  superAdminProfile: SuperAdminProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [superAdminProfile, setSuperAdminProfile] = useState<SuperAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Case-insensitive check for super admin email
        const isAdmin = firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL?.toLowerCase();
        setIsSuperAdmin(isAdmin);

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isSuperAdmin: isAdmin,
        };
        setUser(userProfile);

        if (isAdmin) {
          try {
            const superAdminRef = doc(db, 'superadmins', firebaseUser.uid);
            const superAdminDoc = await getDoc(superAdminRef);
            if (superAdminDoc.exists()) {
              setSuperAdminProfile(superAdminDoc.data() as SuperAdminProfile);
            } else {
              // Super admin doc might be created on first login logic in dashboard
              console.warn("Super admin profile document not found for UID:", firebaseUser.uid);
            }
          } catch (error) {
            console.error("Error fetching super admin profile:", error);
          }
          // If on login page (root) and is admin, redirect to dashboard
          if (pathname === '/') { 
            router.push('/dashboard');
          }
        } else {
           // If not super admin, sign out and redirect to login
          await firebaseSignOut(auth);
          setUser(null);
          setSuperAdminProfile(null);
          setIsSuperAdmin(false);
          // Only redirect if not already on the login page or a public page
          if (pathname !== '/' && !pathname.startsWith('/public')) { 
            router.push('/?error=authFailed'); 
          }
        }
      } else {
        setUser(null);
        setSuperAdminProfile(null);
        setIsSuperAdmin(false);
        // If not logged in and not on login page or public page, redirect to login
        if (pathname !== '/' && !pathname.startsWith('/public')) { 
          router.push('/'); 
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]); // Removed SUPER_ADMIN_EMAIL from dependency array as it's an env var, effectively constant per build

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setSuperAdminProfile(null);
      setIsSuperAdmin(false);
      router.push('/'); // Redirect to root for login
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally show a toast message for error
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, superAdminProfile, loading, isSuperAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
