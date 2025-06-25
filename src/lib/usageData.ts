// src/lib/usageData.ts
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getApiKey } from './apiKeys'; // Import getApiKey directly
import { useAuth } from './auth'; // Assuming useAuth is correctly implemented and provides user/isAdmin

export const useUsageData = () => {
  const { user, isAdmin } = useAuth();

  // Fetch usage data for current user
  const fetchCurrentUserUsageData = async () => {
    if (!user) {
      console.warn('No user logged in to fetch usage data.');
      return null;
    }
    return fetchUserUsageData(user.uid);
  };

  // Fetch usage data for a specific user (can be called by admin or self)
  const fetchUserUsageData = async (userId: string) => {
    try {
      const docRef = doc(db, 'usageData', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // You might want to fetch ElevenLabs usage data here using the API key
        // For now, we'll just return the stored data
        return {
          ...data,
          lastUpdated: data.lastUpdated ? data.lastUpdated.toDate() : null, // Convert Firestore Timestamp to Date
        };
      } else {
        console.log(`No usage data found for user ${userId}`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw error;
    }
  };

  // Function to update usage data (e.g., after an ElevenLabs API call)
  const updateUsageData = async (userId: string, newData: { totalMinutesUsed?: number; minutesRemaining?: number; creditsLeft?: number }) => {
    try {
      const docRef = doc(db, 'usageData', userId);
      await setDoc(docRef, {
        ...newData,
        lastUpdated: serverTimestamp(),
      }, { merge: true }); // Merge to update existing fields without overwriting others
      console.log(`Usage data updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating usage data:', error);
      throw error;
    }
  };

  // Function to fetch all usage data (for admin)
  const fetchAllUsageData = async () => {
    if (!isAdmin()) {
      throw new Error('Unauthorized: Only admins can fetch all usage data.');
    }
    const usageCollectionRef = collection(db, 'usageData');
    const q = query(usageCollectionRef);
    const querySnapshot = await getDocs(q);

    const allUsage: any[] = [];
    querySnapshot.forEach((docSnap) => {
      allUsage.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
    return allUsage;
  };

  return {
    fetchCurrentUserUsageData,
    fetchUserUsageData,
    updateUsageData,
    fetchAllUsageData, // This is the function that should be called
  };
};
