# AI Voice Agent Usage Tracker - Application Design

## Application Architecture

The application will follow a modern Next.js architecture with Firebase integration for authentication and database functionality.

### Tech Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS for styling
- **Backend**: Firebase (Authentication, Firestore, Functions)
- **API Integration**: ElevenLabs API
- **Deployment**: Vercel/Netlify (flexible as per user requirements)

## Database Schema

### Users Collection
```
users/
  ├── {userId}/
  │     ├── email: string
  │     ├── displayName: string (optional)
  │     ├── createdAt: timestamp
  │     ├── lastLogin: timestamp
  │     ├── elevenlabsApiKey: string (encrypted)
  │     └── settings: {
  │           ├── theme: string
  │           └── notifications: boolean
  │         }
```

### Usage Data Collection
```
usageData/
  ├── {userId}/
  │     ├── lastUpdated: timestamp
  │     ├── totalMinutesUsed: number
  │     ├── minutesRemaining: number
  │     ├── creditsLeft: number
  │     └── history: [
  │           ├── {
  │           │     ├── date: timestamp
  │           │     ├── minutesUsed: number
  │           │     └── creditsUsed: number
  │           │   }
  │           └── ...
  │         ]
```

## Authentication Flow

1. User signs up with email/password
2. Firebase Authentication creates a new user
3. A new document is created in the users collection
4. User is redirected to dashboard or onboarding (API key setup)

## API Integration

### ElevenLabs API Integration
- User's API key will be securely stored in Firebase
- API calls will be made from the client-side with the stored API key
- For security, we'll implement proper encryption for API key storage
- API calls will be rate-limited to prevent abuse

### API Endpoints to Integrate
- `/v1/user` - To fetch user information and subscription details
- `/v1/user/subscription` - To fetch subscription-specific information
- `/v1/user/history` - To fetch usage history (if available)

## Component Structure

```
/pages
  ├── index.js (Landing page)
  ├── dashboard.js (Main dashboard)
  ├── auth/
  │     ├── signin.js
  │     ├── signup.js
  │     └── reset-password.js
  ├── profile/
  │     ├── index.js (Profile management)
  │     └── api-settings.js (API key management)
  └── api/
        ├── auth/ (Auth API routes)
        └── elevenlabs/ (ElevenLabs API proxy routes)

/components
  ├── layout/
  │     ├── Layout.js (Main layout wrapper)
  │     ├── Navbar.js
  │     ├── Sidebar.js
  │     └── Footer.js
  ├── auth/
  │     ├── AuthForm.js
  │     └── ProtectedRoute.js
  ├── dashboard/
  │     ├── UsageStats.js
  │     ├── UsageChart.js
  │     └── RefreshButton.js
  └── ui/ (Reusable UI components)
        ├── Button.js
        ├── Card.js
        ├── Input.js
        └── ...

/lib
  ├── firebase.js (Firebase configuration)
  ├── auth.js (Authentication utilities)
  └── elevenlabs.js (ElevenLabs API utilities)

/styles
  └── globals.css (Global styles with Tailwind)
```

## Security Considerations

1. **API Key Storage**: 
   - API keys will be encrypted before storage in Firestore
   - Server-side encryption/decryption for API calls

2. **Authentication**: 
   - Firebase Authentication for secure user management
   - Protected routes to prevent unauthorized access

3. **Data Privacy**:
   - Each user can only access their own usage data
   - Rate limiting to prevent API abuse

## UI/UX Design

The dashboard will feature a premium, cool, and user-friendly interface with:

1. **Dashboard Overview**:
   - Cards displaying key metrics (total minutes used, minutes remaining, credits left)
   - Usage trend chart showing historical usage
   - Quick refresh button to sync latest data

2. **Profile Management**:
   - Secure form for updating ElevenLabs API key
   - User profile settings

3. **Responsive Design**:
   - Mobile-first approach
   - Adaptive layout for different screen sizes
   - Touch-friendly interface elements

## Data Flow

1. User logs in with email/password
2. Application fetches user data from Firebase
3. If API key exists, application makes requests to ElevenLabs API
4. Usage data is displayed on the dashboard
5. User can manually refresh data with the sync button
6. Usage history is stored in Firebase for trend analysis

## Future Expansion Possibilities

1. **Admin Dashboard**: For managing multiple users
2. **Usage Alerts**: Notifications when credits are running low
3. **Billing Integration**: Direct purchase of additional credits
4. **Advanced Analytics**: More detailed usage statistics and predictions
