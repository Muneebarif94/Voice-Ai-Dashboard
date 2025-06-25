// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/lib/auth'; // Import AuthProvider
import { Toaster } from 'react-hot-toast'; // Import Toaster for notifications

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* AuthProvider must wrap all children to provide authentication context */}
        <AuthProvider> 
          {children}
        </AuthProvider>
        {/* Toaster for displaying toast notifications */}
        <Toaster />
      </body>
    </html>
  );
}
