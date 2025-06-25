// src/lib/apiKeys.ts
import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import CryptoJS from 'crypto-js'; // Make sure crypto-js is installed: npm install crypto-js

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'a-very-secret-key-that-should-be-in-env';

if (ENCRYPTION_KEY === 'a-very-secret-key-that-should-be-in-env') {
  console.warn('WARNING: NEXT_PUBLIC_ENCRYPTION_KEY is not set in your environment variables. Using a default key. This is INSECURE for production.');
}

export const setApiKey = async (userId: string, apiKey: string) => {
  try {
    const encryptedKey = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
    await setDoc(doc(db, 'apiKeys', userId), {
      encryptedKey,
      lastUpdated: serverTimestamp(),
    });
    console.log(`API key set for user ${userId}`);
  } catch (error) {
    console.error('Error setting API key:', error);
    throw error;
  }
};

export const getApiKey = async (userId: string) => {
  try {
    const docRef = doc(db, 'apiKeys', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const decryptedKey = CryptoJS.AES.decrypt(data.encryptedKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return {
        decryptedKey,
        lastUpdated: data.lastUpdated,
      };
    } else {
      console.log(`No API key found for user ${userId}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting API key:', error);
    throw error;
  }
};
