// src/lib/auth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthUser extends User {
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  isAdmin: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const authUser = user as AuthUser;
          authUser.role = userData.role || 'user';
          setUser(authUser);
          setUserRole(authUser.role);
        } else {
          setUser(user);
          setUserRole('user'); // Default role
        }
      } else {
        setUser(null);
        setUserRole('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const signUp = async (email: string, password: string, displayName: string, role: string = 'user') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore with role
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true
      });
      
      // Create initial usage data document
      await setDoc(doc(db, 'usageData', user.uid), {
        lastUpdated: serverTimestamp(),
        totalMinutesUsed: 0,
        minutesRemaining: 0,
        creditsLeft: 0,
        history: []
      });
      
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    isAdmin,  // Make sure this is included
    userRole: user?.role || 'user'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
