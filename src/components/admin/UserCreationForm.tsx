// src/components/admin/UserCreationForm.tsx
'use client';

import React, { useState } from 'react';
import { createUser } from '@/lib/userManagement'; // Ensure this import is correct
import { toast } from 'react-hot-toast'; // Assuming you have react-hot-toast installed
import { useAuth } from '@/lib/auth'; // Import useAuth

interface UserCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const UserCreationForm: React.FC<UserCreationFormProps> = ({ onSuccess, onCancel }) => {
  const { user, isAdmin } = useAuth(); // Get user and isAdmin from context

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [apiKey, setApiKey] = useState('');
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation to ensure admin is logged in before attempting to create user
    if (!user || !isAdmin()) {
      toast.error('You must be logged in as an admin to create users.');
      setLoading(false);
      return;
    }

    try {
      await createUser(
        user.uid, // Pass adminUserId
        isAdmin(), // Pass isAdminFlag
        {
          email,
          displayName,
          phoneNumber,
          businessName,
          role,
          apiKey,
          elevenLabsAgentId,
          sendWelcomeEmail,
        }
      );
      toast.success('User created successfully! A password reset email has been sent.');
      onSuccess(); // Call onSuccess callback
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Error creating user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name (Optional)</label>
        <input
          type="text"
          id="businessName"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">ElevenLabs API Key</label>
        <input
          type="password" // Use password type for security
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {/* New field for ElevenLabs Agent ID */}
      <div>
        <label htmlFor="elevenLabsAgentId" className="block text-sm font-medium text-gray-700">ElevenLabs Agent ID (Optional)</label>
        <input
          type="text"
          id="elevenLabsAgentId"
          value={elevenLabsAgentId}
          onChange={(e) => setElevenLabsAgentId(e.target.value)}
          placeholder="e.g., 9FpqM6pomrbjTnEmxnwY"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          If provided, this user will only see conversations associated with this agent ID.
        </p>
      </div>
      <div className="flex items-center">
        <input
          id="sendWelcomeEmail"
          type="checkbox"
          checked={sendWelcomeEmail}
          onChange={(e) => setSendWelcomeEmail(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-900">
          Send welcome email with password reset link
        </label>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserCreationForm;