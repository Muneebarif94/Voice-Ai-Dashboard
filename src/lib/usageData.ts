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
