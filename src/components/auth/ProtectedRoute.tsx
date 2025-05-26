// src/components/auth/ProtectedRoute.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = () => user && user.role === 'admin';

  useEffect(() => {
    if (!loading) {
      console.log('[ProtectedRoute] user:', user);
      console.log('[ProtectedRoute] isAdmin:', isAdmin());
      console.log('[ProtectedRoute] requireAdmin:', requireAdmin);

      if (!user) {
        router.push('/auth/signin');
      } else if (requireAdmin && !isAdmin()) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requireAdmin, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user || (requireAdmin && !isAdmin())) {
    return null;
  }

  return <>{children}</>;
}
