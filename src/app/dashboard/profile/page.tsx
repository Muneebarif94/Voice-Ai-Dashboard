// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function UserProfile() {
  const { user, loading: authLoading, resetPassword } = useAuth();
  
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      setUserData({
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        businessName: user.businessName || '',
      });
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleResetPassword = async () => {
    if (!user || !user.email) return;
    
    setResetting(true);
    setError('');
    setSuccess('');
    
    try {
      await resetPassword(user.email);
      setSuccess('Password reset email sent successfully. Please check your inbox.');
      setShowResetPassword(false);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">User not found</h2>
        <p className="mt-2">Your profile information could not be loaded.</p>
        <a href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Dashboard
        </a>
      </div>

      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
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
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Password Management</h2>
        
        {showResetPassword ? (
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="mb-4">
              Are you sure you want to reset your password? An email with reset instructions will be sent to your email address.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResetPassword(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {resetting ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetPassword(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Change Password
          </button>
        )}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
        <p>
          If you need to update your profile information or have any issues with your account, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
