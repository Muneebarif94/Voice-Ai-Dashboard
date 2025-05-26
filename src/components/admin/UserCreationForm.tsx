// src/components/admin/UserCreationForm.tsx
import { useState } from 'react';
import { useUserManagement } from '@/lib/userManagement';
import { useAuth } from '@/lib/auth';

interface UserCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserCreationForm({ onSuccess, onCancel }: UserCreationFormProps) {
  const { createUser } = useUserManagement();
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    phoneNumber: '',
    businessName: '',
    role: 'user',
    apiKey: '',
    sendWelcomeEmail: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Reset API key validation when the key changes
    if (name === 'apiKey') {
      setApiKeyValid(null);
    }
  };
  
  const validateApiKey = async () => {
    if (!formData.apiKey) {
      setError('API key is required');
      return false;
    }
    
    setLoading(true);
    try {
      // Test the API key with ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: {
          'xi-api-key': formData.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setApiKeyValid(true);
        return true;
      } else {
        setApiKeyValid(false);
        setError('Invalid API key. Please check and try again.');
        return false;
      }
    } catch (err) {
      console.error('Error validating API key:', err);
      setApiKeyValid(false);
      setError('Failed to validate API key. Please check your internet connection.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  //adding here
    
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form fields
    if (!formData.email || !formData.displayName || !formData.phoneNumber || !formData.apiKey) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate API key if not already validated
    if (apiKeyValid !== true) {
      const isValid = await validateApiKey();
      if (!isValid) return;
    }
    
    setLoading(true);
    try {
      await createUser(formData);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Add New User</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">User Information</h3>
          
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-gray-700 mb-2">
              Name*
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-gray-700 mb-2">
              Phone Number*
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="businessName" className="block text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-700 mb-2">
              Role*
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">API Key Management</h3>
          
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-gray-700 mb-2">
              ElevenLabs API Key*
            </label>
            <div className="flex">
              <input
                type="password"
                id="apiKey"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={validateApiKey}
                disabled={loading || !formData.apiKey}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Test Key
              </button>
            </div>
            {apiKeyValid === true && (
              <p className="mt-1 text-sm text-green-600">API key is valid</p>
            )}
            {apiKeyValid === false && (
              <p className="mt-1 text-sm text-red-600">API key is invalid</p>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Account Settings</h3>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="sendWelcomeEmail"
              name="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sendWelcomeEmail" className="ml-2 block text-gray-700">
              Send welcome email with temporary password
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
