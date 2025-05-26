import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
// Interface for ElevenLabs API response
interface ElevenLabsUserInfo {
  subscription: {
    character_count: number;
    character_limit: number;
    available_models: string[];
    status: string;
  };
  is_new_user: boolean;
  xi_api_key: string;
  can_use_delayed_payment_methods: boolean;
}

interface UsageStats {
  totalMinutesUsed: number;
  minutesRemaining: number;
  creditsLeft: number;
  lastUpdated: Date;
}

export const useElevenLabs = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Fetch the user's API key from Firestore
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // In a production app, this would be decrypted here
          setApiKey(userData.elevenlabsApiKey || '');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching API key:', err);
        setError('Failed to fetch API key');
        setLoading(false);
      }
    };

    fetchApiKey();
  }, [user]);

  // Save API key to Firestore
  const saveApiKey = async (newApiKey: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // In a production app, this would be encrypted before storage
      await setDoc(doc(db, 'users', user.uid), {
        elevenlabsApiKey: newApiKey
      }, { merge: true });
      
      setApiKey(newApiKey);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key');
      setLoading(false);
      return false;
    }
  };

  // Fetch usage data from ElevenLabs API
  const fetchUsageData = async () => {
    if (!apiKey) {
      setError('API key is required');
      return null;
    }

    try {
      setLoading(true);
      
      // Fetch user subscription data from ElevenLabs
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

      const data: ElevenLabsUserInfo = await response.json();
      
      // Calculate usage metrics
      // Note: This is a simplified example - actual calculation would depend on ElevenLabs' specific metrics
      const characterCount = data.subscription.character_count;
      const characterLimit = data.subscription.character_limit;
      
      // Approximate conversion from characters to minutes (this is an example)
      const charsPerMinute = 1000; // Example value
      const totalMinutesUsed = characterCount / charsPerMinute;
      const minutesRemaining = (characterLimit - characterCount) / charsPerMinute;
      
      // Credits calculation (example)

      const creditsLeft = Math.floor(minutesRemaining / 10); // Example: 1 credit = 10 minutes
      
      const stats: UsageStats = {
        totalMinutesUsed,
        minutesRemaining,
        creditsLeft,
        lastUpdated: new Date()
      };
      
      // Save usage data to Firestore
      if (user) {
        await setDoc(doc(db, 'usageData', user.uid), {
          lastUpdated: new Date(),
          totalMinutesUsed,
          minutesRemaining,
          creditsLeft,
          history: [
            {
              date: new Date(),
              minutesUsed: totalMinutesUsed,
              creditsUsed: creditsLeft
            }
          ]
        }, { merge: true });
      }
      
      setUsageStats(stats);
      setLoading(false);
      return stats;
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to fetch usage data');
      setLoading(false);
      return null;
    }
  };

  return {
    apiKey,
    saveApiKey,
    fetchUsageData,
    usageStats,
    loading,
    error
  };
};
