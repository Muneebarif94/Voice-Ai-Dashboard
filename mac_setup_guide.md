# Step-by-Step Guide for Running AI Voice Agent Usage Tracker Locally on Mac

This guide will walk you through setting up and running the AI Voice Agent Usage Tracker application on your Mac.

## Prerequisites

Before you begin, ensure you have the following installed on your Mac:

1. **Node.js and npm**: The application requires Node.js version 16.x or higher
2. **Git**: For cloning the repository (optional)
3. **A code editor**: Such as Visual Studio Code, Sublime Text, or any editor of your choice
4. **A Firebase account**: For authentication and database services

## Step 1: Install Node.js and npm

If you don't have Node.js installed:

1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer and follow the instructions
4. Verify installation by opening Terminal and running:
   ```bash
   node -v
   npm -v
   ```
   Both commands should display version numbers if installation was successful.

## Step 2: Extract the Project Files

1. Locate the `ai-voice-tracker.zip` file you received
2. Right-click and select "Extract All" or use the Archive Utility
3. Choose a location where you want to extract the files (e.g., your Documents folder)

## Step 3: Set Up Firebase Project

1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once your project is created, click on the web icon (</>) to add a web app
4. Register your app with a nickname (e.g., "AI Voice Tracker")
5. Copy the Firebase configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Step 4: Enable Firebase Authentication

1. In the Firebase console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Select "Email/Password" from the sign-in methods
4. Enable the "Email/Password" option and save

## Step 5: Set Up Firestore Database

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Start in test mode for development purposes
4. Choose a location closest to your users
5. Click "Enable"

## Step 6: Configure the Application

1. Open the project folder in your code editor
2. Navigate to `src/lib/firebase.ts`
3. Replace the placeholder Firebase configuration with your actual configuration:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Step 7: Install Dependencies

1. Open Terminal
2. Navigate to your project directory:
   ```bash
   cd /path/to/your/extracted/ai-voice-tracker
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
   This may take a few minutes to complete.

## Step 8: Run the Development Server

1. In the same Terminal window, start the development server:
   ```bash
   npm run dev
   ```
2. Wait for the compilation to complete
3. You should see a message indicating the server is running, typically at `http://localhost:3000`

## Step 9: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:3000`
3. You should see the landing page of the AI Voice Agent Usage Tracker

## Step 10: Create an Account and Add Your ElevenLabs API Key

1. Click "Create Account" on the landing page
2. Fill in your details and create an account
3. Once logged in, go to your profile page
4. Add your ElevenLabs API key in the designated field
5. Save your changes

## Step 11: View Your Dashboard

1. After adding your API key, navigate to the dashboard
2. Click the "Refresh Data" button to fetch your latest usage statistics
3. You should now see your voice usage data displayed on the dashboard

## Troubleshooting

### If the application fails to start:

1. Check that you have the correct Node.js version installed
2. Ensure all dependencies were installed correctly with `npm install`
3. Verify your Firebase configuration is correct
4. Check the Terminal for any error messages

### If authentication doesn't work:

1. Ensure Firebase Authentication is properly enabled in your Firebase console
2. Check that your Firebase configuration in the application is correct
3. Verify your internet connection

### If the ElevenLabs API integration doesn't work:

1. Ensure your API key is entered correctly
2. Verify that your ElevenLabs account is active and has usage data
3. Check your internet connection

## Next Steps

Once you've verified that the application runs correctly locally, you can:

1. Customize the UI to match your brand
2. Add additional features as needed
3. Deploy the application using the provided deployment guide

For any further assistance, refer to the application design document or reach out for support.
