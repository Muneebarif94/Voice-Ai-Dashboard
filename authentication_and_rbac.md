# Authentication and Role-Based Access Control

## Overview

This document outlines the updated authentication and role-based access control (RBAC) system for the AI Voice Agent Usage Tracker application. The system now supports multiple admin users and regular users with different permission levels.

## Authentication Flow

### User Types and Roles

1. **Super Admin / Admin**
   - Can create and manage all users
   - Can view and modify API keys for all users
   - Can view usage statistics for all users
   - Can create other admin users

2. **Regular User**
   - Can view their own usage statistics
   - Can update their profile information
   - Cannot view or modify their API key
   - Cannot access admin features

### Authentication Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Login Screen   │────▶│  Authenticate   │────▶│  Check Role     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  User Dashboard │◀────│  Role = User?   │
                        │                 │     │                 │
                        └─────────────────┘     └────────┬────────┘
                                                         │ No
                                                         ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │ Admin Dashboard │
                                                │                 │
                                                └─────────────────┘
```

## Role-Based Access Implementation

### Firebase Authentication Integration

```typescript
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
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = () => {
    return userRole === 'admin';
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
    userRole,
    loading,
    signUp,
    signIn,
    logout,
    resetPassword,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userRole, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/signin');
      } else if (requireAdmin && !isAdmin()) {
        // Redirect to dashboard if not admin but admin route is required
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireAdmin, router, isAdmin, userRole]);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // If not authenticated or doesn't have required role, don't render children
  if (!user || (requireAdmin && !isAdmin())) {
    return null;
  }

  // Render children if authenticated and has required role
  return <>{children}</>;
}
```

### Admin Route Protection

```typescript
// src/app/admin/layout.tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="admin-layout">
        {/* Admin navigation and layout components */}
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

### User Route Protection

```typescript
// src/app/dashboard/layout.tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        {/* User dashboard layout components */}
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

## API Key Management

### Secure API Key Storage

```typescript
// src/lib/apiKeys.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';

// Encryption utility (simplified example - use a proper encryption library in production)
const encryptApiKey = (apiKey: string): string => {
  // In a real application, use a proper encryption method
  return btoa(apiKey); // Base64 encoding (NOT secure for production)
};

const decryptApiKey = (encryptedKey: string): string => {
  // In a real application, use a proper decryption method
  return atob(encryptedKey); // Base64 decoding (NOT secure for production)
};

export const useApiKeyManagement = () => {
  const { user, isAdmin } = useAuth();

  // Get API key for a specific user (admin only)
  const getApiKey = async (userId: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      const apiKeyDoc = await getDoc(doc(db, 'apiKeys', userId));
      if (apiKeyDoc.exists()) {
        const data = apiKeyDoc.data();
        return {
          encryptedKey: data.elevenlabsApiKey,
          decryptedKey: decryptApiKey(data.elevenlabsApiKey),
          lastUpdated: data.lastUpdated,
          updatedBy: data.updatedBy,
          isActive: data.isActive
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching API key:', error);
      throw error;
    }
  };

  // Set API key for a specific user (admin only)
  const setApiKey = async (userId: string, apiKey: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      const encryptedKey = encryptApiKey(apiKey);
      await setDoc(doc(db, 'apiKeys', userId), {
        elevenlabsApiKey: encryptedKey,
        lastUpdated: serverTimestamp(),
        updatedBy: user.uid,
        isActive: true
      });
      
      // Log admin activity
      await setDoc(doc(db, 'adminLogs', `${Date.now()}-${user.uid}`), {
        adminId: user.uid,
        action: 'update_api_key',
        targetUserId: userId,
        timestamp: serverTimestamp(),
        details: { action: 'API key updated' },
        ipAddress: 'client-ip' // In a real app, get from request
      });
      
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  };

  // Get API key for current user's usage data (internal use only, never exposed to UI)
  const getCurrentUserApiKey = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const apiKeyDoc = await getDoc(doc(db, 'apiKeys', user.uid));
      if (apiKeyDoc.exists()) {
        const data = apiKeyDoc.data();
        // Only return the decrypted key for internal API calls, never expose to UI
        return decryptApiKey(data.elevenlabsApiKey);
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user API key:', error);
      throw error;
    }
  };

  return {
    getApiKey,
    setApiKey,
    getCurrentUserApiKey
  };
};
```

### Usage Data Service with Hidden API Key

```typescript
// src/lib/usageData.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import { useApiKeyManagement } from './apiKeys';

export const useUsageData = () => {
  const { user, isAdmin } = useAuth();
  const { getCurrentUserApiKey, getApiKey } = useApiKeyManagement();

  // Fetch usage data for current user
  const fetchCurrentUserUsageData = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get the API key (never exposed to UI)
      const apiKey = await getCurrentUserApiKey();
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Fetch data from ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Process and store usage data
      const usageData = processElevenLabsData(data);
      await storeUsageData(user.uid, usageData);
      
      return usageData;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw error;
    }
  };

  // Admin function to fetch usage data for any user
  const fetchUserUsageData = async (userId: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      // Get the user's API key (admin only)
      const apiKeyData = await getApiKey(userId);
      if (!apiKeyData) {
        throw new Error('API key not found');
      }

      // Fetch data from ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': apiKeyData.decryptedKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Process and store usage data
      const usageData = processElevenLabsData(data);
      await storeUsageData(userId, usageData);
      
      return usageData;
    } catch (error) {
      console.error('Error fetching user usage data:', error);
      throw error;
    }
  };

  // Admin function to fetch usage data for all users
  const fetchAllUsersUsageData = async () => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      const usersQuery = query(collection(db, 'users'), where('isActive', '==', true));
      const userSnapshot = await getDocs(usersQuery);
      
      const usagePromises = userSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Get stored usage data (don't fetch from API to avoid rate limits)
        const usageDoc = await getDoc(doc(db, 'usageData', userId));
        
        return {
          userId,
          displayName: userData.displayName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          businessName: userData.businessName,
          usageData: usageDoc.exists() ? usageDoc.data() : null
        };
      });
      
      return await Promise.all(usagePromises);
    } catch (error) {
      console.error('Error fetching all users usage data:', error);
      throw error;
    }
  };

  // Helper function to process ElevenLabs API response
  const processElevenLabsData = (data: any) => {
    // Calculate usage metrics (example calculation)
    const characterCount = data.subscription.character_count;
    const characterLimit = data.subscription.character_limit;
    
    // Approximate conversion from characters to minutes (this is an example)
    const charsPerMinute = 1000; // Example value
    const totalMinutesUsed = characterCount / charsPerMinute;
    const minutesRemaining = (characterLimit - characterCount) / charsPerMinute;
    
    // Credits calculation (example)
    const creditsLeft = Math.floor(minutesRemaining / 10); // Example: 1 credit = 10 minutes
    
    return {
      totalMinutesUsed,
      minutesRemaining,
      creditsLeft,
      lastUpdated: new Date(),
      rawData: data // Store raw data for potential future use
    };
  };

  // Helper function to store usage data in Firestore
  const storeUsageData = async (userId: string, usageData: any) => {
    const { totalMinutesUsed, minutesRemaining, creditsLeft, lastUpdated } = usageData;
    
    // Get existing history
    const usageDoc = await getDoc(doc(db, 'usageData', userId));
    let history = [];
    
    if (usageDoc.exists()) {
      const existingData = usageDoc.data();
      history = existingData.history || [];
    }
    
    // Add new history entry
    history.push({
      date: lastUpdated,
      minutesUsed: totalMinutesUsed,
      creditsUsed: creditsLeft
    });
    
    // Limit history to last 30 entries
    if (history.length > 30) {
      history = history.slice(history.length - 30);
    }
    
    // Update usage data document
    await setDoc(doc(db, 'usageData', userId), {
      lastUpdated: serverTimestamp(),
      totalMinutesUsed,
      minutesRemaining,
      creditsLeft,
      history
    }, { merge: true });
  };

  return {
    fetchCurrentUserUsageData,
    fetchUserUsageData,
    fetchAllUsersUsageData
  };
};
```

## User Management Service

```typescript
// src/lib/userManagement.ts
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from './firebase';
import { useAuth } from './auth';
import { useApiKeyManagement } from './apiKeys';

export const useUserManagement = () => {
  const { user, isAdmin } = useAuth();
  const { setApiKey } = useApiKeyManagement();

  // Get all users (admin only)
  const getAllUsers = async () => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      const usersQuery = query(collection(db, 'users'));
      const userSnapshot = await getDocs(usersQuery);
      
      return userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  // Get user by ID (admin only)
  const getUserById = async (userId: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  };

  // Create new user (admin only)
  const createUser = async (userData: {
    email: string;
    displayName: string;
    phoneNumber: string;
    businessName?: string;
    role: string;
    apiKey: string;
    sendWelcomeEmail: boolean;
  }) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        tempPassword
      );
      
      const newUser = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        businessName: userData.businessName || '',
        role: userData.role,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        lastLogin: null,
        isActive: true
      });
      
      // Store API key
      await setApiKey(newUser.uid, userData.apiKey);
      
      // Create initial usage data document
      await setDoc(doc(db, 'usageData', newUser.uid), {
        lastUpdated: serverTimestamp(),
        totalMinutesUsed: 0,
        minutesRemaining: 0,
        creditsLeft: 0,
        history: []
      });
      
      // Send password reset email if requested
      if (userData.sendWelcomeEmail) {
        await sendPasswordResetEmail(auth, userData.email);
      }
      
      // Log admin activity
      await setDoc(doc(db, 'adminLogs', `${Date.now()}-${user.uid}`), {
        adminId: user.uid,
        action: 'create_user',
        targetUserId: newUser.uid,
        timestamp: serverTimestamp(),
        details: { 
          email: userData.email,
          role: userData.role,
          sendWelcomeEmail: userData.sendWelcomeEmail
        },
        ipAddress: 'client-ip' // In a real app, get from request
      });
      
      return {
        id: newUser.uid,
        email: userData.email,
        displayName: userData.displayName
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  // Update user (admin only)
  const updateUser = async (userId: string, userData: {
    displayName?: string;
    phoneNumber?: string;
    businessName?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        ...userData,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      // Log admin activity
      await setDoc(doc(db, 'adminLogs', `${Date.now()}-${user.uid}`), {
        adminId: user.uid,
        action: 'update_user',
        targetUserId: userId,
        timestamp: serverTimestamp(),
        details: { updatedFields: Object.keys(userData) },
        ipAddress: 'client-ip' // In a real app, get from request
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Deactivate user (admin only)
  const deactivateUser = async (userId: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        deactivatedAt: serverTimestamp(),
        deactivatedBy: user.uid
      });
      
      // Log admin activity
      await setDoc(doc(db, 'adminLogs', `${Date.now()}-${user.uid}`), {
        adminId: user.uid,
        action: 'deactivate_user',
        targetUserId: userId,
        timestamp: serverTimestamp(),
        details: { action: 'User deactivated' },
        ipAddress: 'client-ip' // In a real app, get from request
      });
      
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  };

  // Reset user password (admin only)
  const resetUserPassword = async (email: string) => {
    if (!user || !isAdmin()) {
      throw new Error('Unauthorized access');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      
      // Find user ID by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        const userId = userSnapshot.docs[0].id;
        
        // Log admin activity
        await setDoc(doc(db, 'adminLogs', `${Date.now()}-${user.uid}`), {
          adminId: user.uid,
          action: 'reset_password',
          targetUserId: userId,
          timestamp: serverTimestamp(),
          details: { action: 'Password reset email sent' },
          ipAddress: 'client-ip' // In a real app, get from request
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  return {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deactivateUser,
    resetUserPassword
  };
};
```

## Security Considerations

1. **Server-Side Validation**
   - All role-based access checks must be performed on both client and server sides
   - Firebase security rules must enforce the same permissions as the client code

2. **API Key Protection**
   - API keys must be encrypted before storage
   - API keys must never be exposed in client-side code
   - API keys should only be decrypted when needed for API calls

3. **Audit Logging**
   - All admin actions must be logged for accountability
   - Logs should include admin ID, action, target user, timestamp, and details

4. **Session Management**
   - Admin sessions should have shorter timeouts than regular user sessions
   - Consider implementing IP-based restrictions for admin access

5. **Password Security**
   - Enforce strong password policies
   - Use temporary passwords and force reset on first login
   - Implement rate limiting for authentication attempts

## Implementation Checklist

1. Update Firebase security rules to enforce role-based access
2. Implement the AuthProvider with role checking
3. Create the ProtectedRoute component for route protection
4. Implement the API key management service with encryption
5. Implement the usage data service with hidden API keys
6. Implement the user management service for admin functions
7. Add audit logging for all admin actions
8. Test all security measures thoroughly
