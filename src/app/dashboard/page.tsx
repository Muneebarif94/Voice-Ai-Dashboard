// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useUsageData } from '@/lib/usageData';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { fetchCurrentUserUsageData } = useUsageData();
  
  const [usageStats, setUsageStats] = useState<any>(null);
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
      const data = await fetchCurrentUserUsageData();
      setUsageStats(data);
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

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please sign in to view your dashboard</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voice Usage Dashboard</h1>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 p-6 rounded-lg animate-pulse h-40"></div>
          ))}
        </div>
      ) : (
        <>
          {usageStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-2 w-24 bg-blue-500 mb-4 rounded"></div>
                <h2 className="text-xl font-semibold mb-2">Total Minutes Used</h2>
                <p className="text-4xl font-bold text-blue-600">{usageStats.totalMinutesUsed.toFixed(2)}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-2 w-24 bg-green-500 mb-4 rounded"></div>
                <h2 className="text-xl font-semibold mb-2">Minutes Remaining</h2>
                <p className="text-4xl font-bold text-green-600">{usageStats.minutesRemaining.toFixed(2)}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-2 w-24 bg-purple-500 mb-4 rounded"></div>
                <h2 className="text-xl font-semibold mb-2">Credits Left</h2>
                <p className="text-4xl font-bold text-purple-600">{usageStats.creditsLeft}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              No usage data available. Try refreshing.
            </div>
          )}
        </>
      )}

      {usageStats && usageStats.history && usageStats.history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Usage History</h2>
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageStats.history.slice().reverse().map((entry: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof entry.minutesUsed === 'number' ? entry.minutesUsed.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.creditsUsed || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usageStats && (
        <div className="mt-8 text-right text-sm text-gray-500">
          Last updated: {new Date(usageStats.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
