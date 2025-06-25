// src/lib/userManagement.ts
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// Function to create a new user (called by admin)
export const createUser = async (
  adminUserId: string, // ID of the admin performing the action
  isAdminFlag: boolean, // Flag indicating if the caller is an admin
  userData: {
    email: string;
    displayName: string;
    phoneNumber: string;
    businessName?: string;
    role: string;
    apiKey: string;
    elevenLabsAgentId?: string;
    sendWelcomeEmail: boolean;
  }
) => {
  if (!isAdminFlag) {
    throw new Error('Unauthorized access: Only admins can create users.');
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
      elevenLabsAgentId: userData.elevenLabsAgentId || null,
      createdAt: serverTimestamp(),
      createdBy: adminUserId, // Use the passed adminUserId
      lastLogin: null,
      isActive: true
    });
    
    console.log('User document created in Firestore');
    
    // Store API key (assuming setApiKey is imported or available globally)
    const { setApiKey } = await import('./apiKeys'); // Dynamic import
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
    await setDoc(doc(db, 'adminLogs', `${Date.now()}-${adminUserId}`), { // Use the passed adminUserId
      adminId: adminUserId,
      action: 'create_user',
      targetUserId: newUser.uid,
      timestamp: serverTimestamp(),
      details: { 
        email: userData.email,
        role: userData.role,
        elevenLabsAgentId: userData.elevenLabsAgentId,
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

// Function to fetch all users (for admin dashboard)
export const getAllUsers = async (isAdminFlag: boolean) => { // Accept isAdminFlag
  if (!isAdminFlag) {
    throw new Error('Unauthorized access: Only admins can view all users.');
  }

  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef);
  const querySnapshot = await getDocs(q);

  const usersList: any[] = [];
  for (const docSnap of querySnapshot.docs) {
    const userData = docSnap.data();
    // Fetch API key for admin view
    const { getApiKey } = await import('./apiKeys'); // Dynamic import
    const apiKeyData = await getApiKey(docSnap.id);
    usersList.push({
      id: docSnap.id,
      ...userData,
      apiKey: apiKeyData?.decryptedKey || 'Not set', // Include API key for admin view
    });
  }
  return usersList;
};

// Function to update a user's details (for admin)
export const updateUser = async (
  adminUserId: string, // ID of the admin performing the action
  isAdminFlag: boolean, // Flag indicating if the caller is an admin
  userId: string, 
  data: {
    displayName?: string;
    phoneNumber?: string;
    businessName?: string;
    role?: string;
    isActive?: boolean;
    elevenLabsAgentId?: string;
  }
) => {
  if (!isAdminFlag) {
    throw new Error('Unauthorized access: Only admins can update users.');
  }

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, data);

  // Log admin activity
  await setDoc(doc(db, 'adminLogs', `${Date.now()}-${adminUserId}`), { // Use the passed adminUserId
    adminId: adminUserId,
    action: 'update_user',
    targetUserId: userId,
    timestamp: serverTimestamp(),
    details: data
  });
};

// Function to delete a user (for admin)
export const deleteUser = async (
  adminUserId: string, // ID of the admin performing the action
  isAdminFlag: boolean, // Flag indicating if the caller is an admin
  userId: string
) => {
  if (!isAdminFlag) {
    throw new Error('Unauthorized access: Only admins can delete users.');
  }

  // In a real application, you'd also delete the user from Firebase Auth
  // and clean up associated data (API key, usage data, etc.)
  // For simplicity, this example only marks as inactive or deletes the Firestore doc.
  // A more robust solution would involve Firebase Cloud Functions for cleanup.
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, { isActive: false }); // Or deleteDoc(userDocRef);

  // Log admin activity
  await setDoc(doc(db, 'adminLogs', `${Date.now()}-${adminUserId}`), { // Use the passed adminUserId
    adminId: adminUserId,
    action: 'delete_user',
    targetUserId: userId,
    timestamp: serverTimestamp(),
  });
};

// Function to get a single user by ID (for admin)
export const getUserById = async (isAdminFlag: boolean, userId: string) => { // Accept isAdminFlag
  if (!isAdminFlag) {
    throw new Error('Unauthorized access: Only admins can view user details.');
  }

  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    const { getApiKey } = await import('./apiKeys'); // Dynamic import
    const apiKeyData = await getApiKey(userId);
    return {
      id: userDocSnap.id,
      ...userData,
      apiKey: apiKeyData?.decryptedKey || 'Not set',
    };
  } else {
    throw new Error('User not found');
  }
};
