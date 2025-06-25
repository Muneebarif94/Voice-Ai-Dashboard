// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllUsers } from '@/lib/userManagement'; // Import getAllUsers directly
import { useUsageData } from '@/lib/usageData'; // Import the useUsageData hook
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { fetchAllUsageData } = useUsageData(); // Correctly destructure fetchAllUsageData from the hook

  const [usersData, setUsersData] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]); // State for all usage data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin()) {
        setError('Access Denied: You must be an admin to view this page.');
        setLoading(false);
      } else {
        fetchUsers();
        fetchUsageData(); // Call the correct function name
      }
    }
  }, [user, authLoading, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Pass isAdmin() flag to getAllUsers
      const data = await getAllUsers(isAdmin());
      setUsersData(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      toast.error(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // Call fetchAllUsageData from the hook
      const data = await fetchAllUsageData(); // This is the correct function call
      setUsageData(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching usage data:', err);
      setError(err.message || 'Failed to fetch usage data');
      toast.error(`Failed to fetch usage data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Admin Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Error</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold text-blue-600">{usersData.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Active Users</h2>
          <p className="text-3xl font-bold text-green-600">{usersData.filter(u => u.isActive).length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Admins</h2>
          <p className="text-3xl font-bold text-purple-600">{usersData.filter(u => u.role === 'admin').length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent ID
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {userItem.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userItem.elevenLabsAgentId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/admin/users/${userItem.id}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Overall Usage Statistics</h2>
        {usageData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* You might want to aggregate these values from 'usageData' array */}
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Total Minutes Used (Aggregated)</h3>
              <p className="text-3xl font-bold text-blue-600">
                {usageData.reduce((sum, item) => sum + (item.totalMinutesUsed || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Total Minutes Remaining (Aggregated)</h3>
              <p className="text-3xl font-bold text-green-600">
                {usageData.reduce((sum, item) => sum + (item.minutesRemaining || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Total Credits Left (Aggregated)</h3>
              <p className="text-3xl font-bold text-purple-600">
                {usageData.reduce((sum, item) => sum + (item.creditsLeft || 0), 0)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No overall usage data available.</p>
        )}
      </div>
    </div>
  );
}
