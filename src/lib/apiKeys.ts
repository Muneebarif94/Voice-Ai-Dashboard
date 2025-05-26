// src/lib/apiKeys.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
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
