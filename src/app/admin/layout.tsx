'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    <ProtectedRoute requireAdmin={true}>
      <div className="admin-layout">
        <header className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">AI Voice Agent Usage Tracker - Admin</h1>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/admin" className="text-blue-600 hover:text-blue-800">Dashboard</a>
                </li>
                <li>
                  <a href="/admin/users" className="text-blue-600 hover:text-blue-800">User Management</a>
                </li>
                <li>
                  <a href="/dashboard" className="text-blue-600 hover:text-blue-800">My Dashboard</a>
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
