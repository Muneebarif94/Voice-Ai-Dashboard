# Deployment Guide for AI Voice Agent Usage Tracker

This guide will help you deploy your AI Voice Agent Usage Tracker application to a production environment.

## Prerequisites

Before deploying, make sure you have:

1. A Firebase project set up with Authentication and Firestore enabled
2. Your Firebase configuration details
3. A Vercel, Netlify, or similar hosting account

## Environment Variables

The application requires the following environment variables to be set in your deployment platform:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## Deployment Steps

### Option 1: Vercel Deployment

1. **Create a Vercel account** if you don't have one already at [vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional for command-line deployment)
   ```bash
   npm install -g vercel
   ```

3. **Connect your repository** to Vercel:
   - Push your code to GitHub, GitLab, or Bitbucket
   - Import the repository in the Vercel dashboard
   - Or use the CLI: `vercel`

4. **Configure environment variables**:
   - In the Vercel dashboard, go to your project settings
   - Add all the Firebase environment variables listed above

5. **Deploy**:
   - Vercel will automatically deploy your application
   - For manual deployment via CLI: `vercel --prod`

### Option 2: Netlify Deployment

1. **Create a Netlify account** if you don't have one already at [netlify.com](https://netlify.com)

2. **Connect your repository** to Netlify:
   - Push your code to GitHub, GitLab, or Bitbucket
   - Import the repository in the Netlify dashboard

3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `out`

4. **Configure environment variables**:
   - In the Netlify dashboard, go to your site settings > Build & deploy > Environment
   - Add all the Firebase environment variables listed above

5. **Deploy**:
   - Netlify will automatically deploy your application

### Option 3: Manual Deployment

If you prefer to deploy to your own hosting:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Export the static files** (if using static export):
   ```bash
   next export
   ```

3. **Upload the output files** to your hosting provider:
   - The built files will be in the `out` directory
   - Ensure your hosting provider supports Next.js applications

## Custom Domain Setup

### Vercel Custom Domain

1. Go to your project in the Vercel dashboard
2. Navigate to "Domains" in the project settings
3. Add your custom domain
4. Follow the DNS configuration instructions provided by Vercel

### Netlify Custom Domain

1. Go to your site in the Netlify dashboard
2. Navigate to "Domain settings"
3. Click "Add custom domain"
4. Follow the DNS configuration instructions provided by Netlify

## Post-Deployment Verification

After deploying, verify that:

1. The application loads correctly
2. User authentication works (sign up, sign in, password reset)
3. API key management functions properly
4. Usage data is fetched and displayed correctly

## Troubleshooting

If you encounter issues:

1. **Authentication issues**: Ensure Firebase Authentication is properly configured and the correct API keys are set
2. **API integration issues**: Verify that the ElevenLabs API is accessible and your API key has the correct permissions
3. **Deployment issues**: Check the build logs in your deployment platform for errors

## Security Considerations

1. Ensure your Firebase Security Rules are properly configured to protect user data
2. Consider implementing additional encryption for API keys stored in Firestore
3. Set up proper CORS configurations if needed

## Maintenance

1. Regularly update dependencies to ensure security and performance
2. Monitor Firebase usage to stay within free tier limits or budget
3. Set up monitoring for application performance and errors
