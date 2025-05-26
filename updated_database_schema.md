# Updated Database Schema for AI Voice Agent Usage Tracker

## Overview

This updated database schema introduces role-based access control with super admin functionality. The key changes include:

1. Adding role-based user management
2. Separating API key storage from user profiles
3. Supporting multiple admin users
4. Enabling admin-only views of API keys
5. Facilitating filtered views of usage statistics

## Firestore Collections

### Users Collection
```
users/
  ├── {userId}/
  │     ├── email: string
  │     ├── displayName: string
  │     ├── phoneNumber: string
  │     ├── businessName: string (optional)
  │     ├── role: string (enum: "admin", "user")
  │     ├── createdAt: timestamp
  │     ├── createdBy: string (userId of admin who created this user)
  │     ├── lastLogin: timestamp
  │     ├── isActive: boolean
  │     └── settings: {
  │           ├── theme: string
  │           └── notifications: boolean
  │         }
```

### API Keys Collection (Admin Access Only)
```
apiKeys/
  ├── {userId}/
  │     ├── elevenlabsApiKey: string (encrypted)
  │     ├── lastUpdated: timestamp
  │     ├── updatedBy: string (userId of admin who last updated)
  │     └── isActive: boolean
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

### Admin Activity Logs (Audit Trail)
```
adminLogs/
  ├── {logId}/
  │     ├── adminId: string
  │     ├── action: string (e.g., "create_user", "update_api_key", "delete_user")
  │     ├── targetUserId: string (if applicable)
  │     ├── timestamp: timestamp
  │     ├── details: map (action-specific details)
  │     └── ipAddress: string
```

## Security Rules

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if the user is an admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    
    // Users collection
    match /users/{userId} {
      // Admins can read all users, users can only read their own data
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      // Only admins can create/update/delete users
      allow write: if isAdmin();
    }
    
    // API Keys collection - admin only access
    match /apiKeys/{userId} {
      allow read, write: if isAdmin();
    }
    
    // Usage Data collection
    match /usageData/{userId} {
      // Admins can read all usage data, users can only read their own
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      // Only system processes and admins can write usage data
      allow write: if isAdmin();
    }
    
    // Admin Logs - admin only access
    match /adminLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update, delete: if false; // Immutable logs
    }
  }
}
```

## Data Flow

### User Creation Flow
1. Admin creates a new user with basic information
2. System creates a user document with role="user"
3. Admin assigns an ElevenLabs API key to the user
4. System stores the encrypted API key in the apiKeys collection
5. System logs the admin action in adminLogs

### Authentication Flow
1. User signs in with email/password
2. System retrieves user document to check role
3. System directs to appropriate dashboard based on role
4. For admins, additional data (all users, API keys) is loaded
5. For regular users, only their own usage data is loaded

### API Key Management Flow
1. Admin accesses user management section
2. System retrieves all API keys (admin only)
3. Admin can view, edit, or reassign API keys
4. System encrypts and stores updated keys
5. System logs all API key changes

### Usage Data Retrieval Flow
1. For regular users:
   - System uses the API key associated with their userId (without revealing it)
   - Fetches and displays only their usage statistics
   
2. For admin users:
   - System can fetch usage data for any/all users
   - Admin can filter and view statistics by user
   - Admin dashboard shows aggregate statistics

## Encryption Considerations

For enhanced security, the ElevenLabs API keys will be:
1. Encrypted before storage using a server-side encryption key
2. Decrypted only when needed for API calls
3. Never exposed in client-side code or to regular users
4. Accessible only to users with admin role

## Migration Strategy

To migrate from the current schema:
1. Add the role field to existing users (default to "user")
2. Create an initial admin user
3. Move existing API keys to the new apiKeys collection
4. Update security rules to enforce the new access patterns
5. Update application code to handle the new schema
