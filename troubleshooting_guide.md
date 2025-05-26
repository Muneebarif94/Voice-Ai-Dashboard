# Troubleshooting Guide for AI Voice Agent Usage Tracker

## Styling Issues

If your application appears unstyled (plain HTML without the expected design), follow these steps:

### 1. Tailwind CSS Configuration

Ensure Tailwind CSS is properly configured:

```bash
# Check if tailwindcss is in your package.json
grep tailwindcss package.json

# If not installed, install it
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Verify your `tailwind.config.js` file includes the correct paths:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 2. CSS Imports

Ensure your global CSS file contains the Tailwind directives:

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Make sure the CSS file is imported in your layout:

```tsx
// src/app/layout.tsx
import './globals.css';
```

### 3. Client-Side Rendering

Add the `'use client'` directive at the top of your layout file:

```tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Development Server

Restart your development server completely:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### 5. Browser Cache

Clear your browser cache or try in an incognito/private window.

## Firebase Integration Issues

If you're experiencing issues with Firebase:

### 1. Environment Variables

Make sure your environment variables are set correctly. Create a `.env.local` file in the root of your project:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Configuration

Verify your Firebase configuration in `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

### 3. Firebase Console Settings

Ensure Authentication is enabled in your Firebase console:
- Go to Firebase Console > Authentication > Sign-in method
- Enable Email/Password authentication

### 4. Firestore Rules

Check your Firestore security rules to ensure they allow read/write operations:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /usageData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Console Errors

Always check your browser's developer console (F12 or right-click > Inspect > Console) for specific error messages that can help identify the issue.

## ElevenLabs API Integration Issues

If you're having trouble with the ElevenLabs API:

1. Verify your API key is correct
2. Check the API endpoint URLs in `src/lib/elevenlabs.ts`
3. Ensure your ElevenLabs account has active usage data

## Need More Help?

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Review the Next.js and Firebase documentation
3. Consider posting specific error messages for more targeted assistance
