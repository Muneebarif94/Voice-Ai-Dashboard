# AI Voice Agent Usage Tracker - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## Installation Steps

1. **Clone or extract the project**
   ```bash
   cd ai-voice-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase configuration from Project Settings > General > Your apps > SDK setup and configuration
   - Create a `.env.local` file in the project root with the following content:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Set up Firebase Security Rules**
   - Go to Firestore Database > Rules
   - Copy and paste the contents of `firebase_security_rules.txt` into the rules editor
   - Publish the rules

5. **Create an Admin User**
   - Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   - Open http://localhost:3000 in your browser
   - Sign up for a new account
   - In the Firebase console, go to Firestore Database
   - Find the user document in the `users` collection
   - Edit the document and change the `role` field to `admin`

6. **Test the Application**
   - Sign in with your admin account
   - You should be redirected to the admin dashboard
   - Try creating a new user and assigning an ElevenLabs API key
   - Sign out and sign in with the new user account
   - Verify that the user can only see their usage statistics and not their API key

## Deployment

### Vercel Deployment
1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy the application

### Netlify Deployment
1. Push your code to a GitHub repository
2. Connect your repository to Netlify
3. Add your environment variables in the Netlify project settings
4. Deploy the application

## Troubleshooting

### Common Issues

1. **Firebase Authentication Issues**
   - Ensure that Email/Password authentication is enabled in Firebase console
   - Check that your Firebase configuration is correct in `.env.local`

2. **Firestore Permission Denied**
   - Verify that your security rules are properly set up
   - Check that user roles are correctly assigned

3. **API Key Issues**
   - Ensure that ElevenLabs API keys are valid
   - Check that API keys are being properly encrypted and stored

4. **Styling Issues**
   - Make sure Tailwind CSS is properly installed and configured
   - Verify that `globals.css` is imported in your layout component

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [ElevenLabs API Documentation](https://docs.elevenlabs.io/api-reference)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
