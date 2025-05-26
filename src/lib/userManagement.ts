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

  // Update the createUser function:
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
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    console.log('Creating user with email:', userData.email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      tempPassword
    );
    
    const newUser = userCredential.user;
    console.log('User created with ID:', newUser.uid);
    
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
    
    console.log('User document created in Firestore');
    
    // Store API key
    await setApiKey(newUser.uid, userData.apiKey);
    console.log('API key stored');
    
    // Create initial usage data document
    await setDoc(doc(db, 'usageData', newUser.uid), {
      lastUpdated: serverTimestamp(),
      totalMinutesUsed: 0,
      minutesRemaining: 0,
      creditsLeft: 0,
      history: []
    });
    
    console.log('Usage data document created');
    
    // Send password reset email if requested
    if (userData.sendWelcomeEmail) {
      await sendPasswordResetEmail(auth, userData.email);
      console.log('Password reset email sent');
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
      }
    });
    
    console.log('Admin activity logged');
    
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
