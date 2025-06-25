// src/lib/auth.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  User // Directly import the User type
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

// Extend FirebaseUser to include custom fields
interface CustomFirebaseUser extends User { // Use the directly imported User type here
  role?: 'user' | 'admin';
  displayName?: string;
  phoneNumber?: string;
  businessName?: string;
  elevenLabsAgentId?: string; // Add this field
}

interface AuthContextType {
  user: CustomFirebaseUser | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, phoneNumber: string, businessName?: string, elevenLabsAgentId?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; phoneNumber?: string; businessName?: string; elevenLabsAgentId?: string }) => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomFirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user document from Firestore to get custom claims like role and other profile data
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({
            ...firebaseUser,
            role: userData.role,
            displayName: userData.displayName,
            phoneNumber: userData.phoneNumber,
            businessName: userData.businessName,
            elevenLabsAgentId: userData.elevenLabsAgentId, // Fetch elevenLabsAgentId
          });
        } else {
          // If user document doesn't exist (e.g., new signup via Firebase Auth directly)
          // This case should ideally be handled by creating the Firestore doc during signup
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName: string, phoneNumber: string, businessName?: string, elevenLabsAgentId?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email,
      displayName,
      phoneNumber,
      businessName: businessName || '',
      role: 'user', // Default role for new signups
      elevenLabsAgentId: elevenLabsAgentId || null, // Store elevenLabsAgentId
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    // Re-fetch user data to update context with new fields
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      setUser({
        ...firebaseUser,
        role: userData.role,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        businessName: userData.businessName,
        elevenLabsAgentId: userData.elevenLabsAgentId,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update last login timestamp
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLogin: serverTimestamp(),
    });

    // Re-fetch user data to update context with latest fields
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      setUser({
        ...firebaseUser,
        role: userData.role,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        businessName: userData.businessName,
        elevenLabsAgentId: userData.elevenLabsAgentId,
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserPassword = (password: string) => {
    if (auth.currentUser) {
      return updatePassword(auth.currentUser, password);
    }
    return Promise.reject(new Error('No user logged in.'));
  };

  const updateUserProfile = async (data: { displayName?: string; phoneNumber?: string; businessName?: string; elevenLabsAgentId?: string }) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...data,
      });
      // Update local state to reflect changes
      setUser(prevUser => ({
        ...(prevUser as CustomFirebaseUser),
        ...data,
      }));
    } else {
      return Promise.reject(new Error('No user logged in.'));
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserPassword,
    updateUserProfile,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
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
