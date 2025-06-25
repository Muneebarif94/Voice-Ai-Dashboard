// src/app/admin/users/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUserById, updateUser, deleteUser } from '@/lib/userManagement'; // Import individual functions
import { getApiKey, setApiKey } from '@/lib/apiKeys'; // Import getApiKey and setApiKey directly
import { fetchUserUsageData } from '@/lib/usageData'; // Assuming this is correct
import { useAuth } from '@/lib/auth'; // Import useAuth
import { toast } from 'react-hot-toast'; // For better error/success messages

export default function UserDetail() {
  const params = useParams();
  const userId = params.id as string;
  
  // Destructure properties from useAuth hook
  const { user, isAdmin, loading: authLoading, resetPassword } = useAuth(); 
  
  const [userData, setUserData] = useState<any>(null);
  const [apiKeyData, setApiKeyData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showUpdateKey, setShowUpdateKey] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Only fetch data if user is authenticated, auth loading is complete, and userId is available
    if (user && !authLoading && userId) {
      fetchUserData();
    }
  }, [user, authLoading, userId]); // Depend on user, authLoading, and userId

  const fetchUserData = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    
    // Ensure admin privileges before fetching data
    if (!user || !isAdmin()) {
      setError('Unauthorized: You must be an admin to view this page.');
      setLoading(false);
      return;
    }

    try {
      // Fetch user details - pass isAdmin() flag to getUserById
      const fetchedUserData = await getUserById(isAdmin(), userId);
      setUserData(fetchedUserData);
      
      // Fetch API key
      const fetchedApiKeyData = await getApiKey(userId); // Call getApiKey directly
      setApiKeyData(fetchedApiKeyData);
      
      // Fetch usage data
      const fetchedUsageData = await fetchUserUsageData(userId);
      setUsageData(fetchedUsageData);
      
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to fetch user data');
      toast.error(`Failed to fetch user data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userData || !user || !isAdmin()) {
      toast.error('Unauthorized or user data not available.');
      return;
    }
    
    try {
      // Use the resetPassword function from useAuth
      await resetPassword(userData.email);
      toast.success('Password reset email sent successfully!');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error(`Failed to reset password: ${err.message}`);
    }
  };

  const handleToggleStatus = async () => {
    if (!userData || !user || !isAdmin()) {
      toast.error('Unauthorized or user data not available.');
      return;
    }
    
    try {
      // Use the updateUser function from userManagement.ts
      // Pass adminUserId (user.uid) and isAdmin() flag
      await updateUser(user.uid, isAdmin(), userId, { isActive: !userData.isActive });
      
      toast.success(`User ${userData.isActive ? 'deactivated' : 'activated'} successfully!`);
      // Refresh user data to reflect the change
      fetchUserData();
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast.error(`Failed to update user status: ${err.message}`);
    }
  };

  const handleUpdateApiKey = async () => {
    if (!newApiKey) {
      toast.error('Please enter a new API key');
      return;
    }
    if (!user || !isAdmin()) {
      toast.error('Unauthorized: You must be an admin to update API keys.');
      return;
    }
    
    setUpdating(true);
    try {
      await setApiKey(userId, newApiKey); // Call setApiKey directly
      setNewApiKey('');
      setShowUpdateKey(false);
      
      // Refresh API key data
      const updatedApiKeyData = await getApiKey(userId); // Call getApiKey directly
      setApiKeyData(updatedApiKeyData);
      
      toast.success('API key updated successfully!');
    } catch (err: any) {
      console.error('Error updating API key:', err);
      toast.error(`Failed to update API key: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // If not an admin, show access denied
  if (!user || !isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="text-red-500">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">User not found</h2>
        <p className="mt-2">The requested user could not be found or you don't have permission to view it.</p>
        <a href="/admin/users" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to User List
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/admin/users" className="text-blue-600 hover:text-blue-800">
          &larr; Back to User List
        </a>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Details: {userData.displayName}</h1>
        <div className="space-x-2">
          <button 
            onClick={handleResetPassword}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Reset Password
          </button>
          <button 
            onClick={handleToggleStatus}
            className={`px-4 py-2 ${userData.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md`}
          >
            {userData.isActive ? 'Deactivate User' : 'Activate User'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{userData.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{userData.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Business</p>
              <p className="font-medium">{userData.businessName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userData.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {userData.role}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {userData.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ElevenLabs Agent ID</p>
              <p className="font-medium">{userData.elevenLabsAgentId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">
                {userData.lastLogin ? new Date(userData.lastLogin.toDate()).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Key Management</h2>
            <button 
              onClick={() => setShowUpdateKey(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Update Key
            </button>
          </div>
          
          {apiKeyData ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">ElevenLabs API Key</p>
                <div className="flex items-center mt-1">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={apiKeyData.decryptedKey || ''} // Ensure it's not null/undefined
                    readOnly 
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {apiKeyData.lastUpdated ? new Date(apiKeyData.lastUpdated.toDate()).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No API key found for this user</p>
              <button 
                onClick={() => setShowUpdateKey(true)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add API Key
              </button>
            </div>
          )}

          {showUpdateKey && (
            <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-lg font-medium mb-3">Update API Key</h3>
              <div className="mb-4">
                <label htmlFor="newApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  New API Key
                </label>
                <input
                  type="text"
                  id="newApiKey"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new ElevenLabs API key"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowUpdateKey(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateApiKey}
                  disabled={updating || !newApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {updating ? 'Updating...' : 'Update Key'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
        
        {usageData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Total Minutes Used</h3>
              <p className="text-3xl font-bold text-blue-600">{usageData.totalMinutesUsed.toFixed(2)}</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Minutes Remaining</h3>
              <p className="text-3xl font-bold text-green-600">{usageData.minutesRemaining.toFixed(2)}</p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Credits Left</h3>
              <p className="text-3xl font-bold text-purple-600">{usageData.creditsLeft}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No usage data available for this user</p>
          </div>
        )}
        
        <div className="mt-4 text-right text-sm text-gray-500">
          Last updated: {usageData?.lastUpdated ? new Date(usageData.lastUpdated.toDate()).toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}
