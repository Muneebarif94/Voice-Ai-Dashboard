// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useUsageData } from '@/lib/usageData';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { fetchAllUsersUsageData } = useUsageData();
  
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchUsageData();
    }
  }, [user, authLoading]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsersUsageData();
      setUsersData(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching usage data:', err);
      setError(err.message || 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsageData();
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-2 w-24 bg-blue-500 mb-4 rounded"></div>
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-4xl font-bold text-blue-600">{usersData.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-2 w-24 bg-green-500 mb-4 rounded"></div>
          <h2 className="text-xl font-semibold mb-2">Active Users</h2>
          <p className="text-4xl font-bold text-green-600">
            {usersData.filter(u => u.usageData && u.usageData.lastUpdated).length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-2 w-24 bg-purple-500 mb-4 rounded"></div>
          <h2 className="text-xl font-semibold mb-2">Total Minutes Used</h2>
          <p className="text-4xl font-bold text-purple-600">
            {usersData.reduce((sum, user) => {
              return sum + (user.usageData?.totalMinutesUsed || 0);
            }, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">User Statistics</h2>
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse h-40"></div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minutes Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minutes Remaining
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits Left
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.length > 0 ? (
                  usersData.map((userData, index) => (
                    <tr key={userData.userId || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userData.displayName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.usageData?.totalMinutesUsed?.toFixed(2) || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.usageData?.minutesRemaining?.toFixed(2) || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.usageData?.creditsLeft || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.usageData?.lastUpdated 
                            ? new Date(userData.usageData.lastUpdated.toDate()).toLocaleString() 
                            : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href={`/admin/users/${userData.userId}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          View
                        </a>
                        <a href={`/admin/users/${userData.userId}/edit`} className="text-blue-600 hover:text-blue-900">
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
