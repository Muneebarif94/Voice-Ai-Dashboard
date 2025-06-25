'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">AI Voice Agent Usage Tracker</h1>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
                </li>
                <li>
                  <a href="/dashboard/conversations" className="text-blue-600 hover:text-blue-800">Conversations</a>
                </li>
                <li>
                  <a href="/dashboard/profile" className="text-blue-600 hover:text-blue-800">My Profile</a>
                </li>
                <li>
                  <button onClick={handleSignOut} className="text-red-600 hover:text-red-800">Sign Out</button>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}