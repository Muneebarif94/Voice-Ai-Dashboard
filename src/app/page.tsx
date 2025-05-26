//*src/app/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
//import TestFirebase from '@/components/TestFirebase';


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect to dashboard
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">AI Voice Agent Usage Tracker</h1>
          {!loading && !user && (
            <div>
              <Link href="/auth/signin" className="inline-block bg-blue-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
          
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Monitor your ElevenLabs voice usage with our simple, elegant dashboard.</h2>
              <p className="text-lg mb-8">Track minutes used, minutes remaining, and credits left in one place.</p>
              
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : !user ? (
                <div className="space-x-4">
                  <Link href="/auth/signin" className="inline-block bg-blue-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700">
                    Sign In
                  </Link>
                </div>
              ) : (
                <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="inline-block bg-blue-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
