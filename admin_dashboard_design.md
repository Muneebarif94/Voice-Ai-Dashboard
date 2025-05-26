# Admin Dashboard and User Management Design

## Overview

This document outlines the design for the admin dashboard and user management features for the AI Voice Agent Usage Tracker application. The design supports the requirements for super admin functionality, including user management, API key assignment, and usage statistics monitoring.

## Admin Dashboard Layout

### Main Navigation

```
+-----------------------------------------------------------------------+
| AI Voice Agent Usage Tracker                           Admin: John Doe |
+-----------------------------------------------------------------------+
| [Dashboard] [User Management] [Settings] [My Profile]      [Sign Out] |
+-----------------------------------------------------------------------+
```

### Admin Dashboard Home

```
+-----------------------------------------------------------------------+
| Dashboard Overview                                    [Filter by User] |
+-----------------------------------------------------------------------+
| Total Users: 24  |  Active Users: 22  |  Admins: 3   |  [Export Data] |
+-----------------------------------------------------------------------+
| Usage Statistics                                                       |
+-----------------------------------------------------------------------+
| [Chart: Total Minutes Used Across All Users - Last 30 Days]            |
+-----------------------------------------------------------------------+
| Top Users by Usage                                                     |
+-----------------------------------------------------------------------+
| User          | Minutes Used | Minutes Remaining | Credits | Last Used |
|---------------|--------------|-------------------|---------|-----------|
| Alice Smith   | 1,250        | 750               | 100     | Today     |
| Bob Johnson   | 980          | 520               | 75      | Yesterday |
| Carol Davis   | 875          | 625               | 80      | 3 days ago|
| [View All]                                                             |
+-----------------------------------------------------------------------+
| Recent Activity                                                        |
+-----------------------------------------------------------------------+
| Time      | Admin     | Action         | User          | Details      |
|-----------|-----------|----------------|---------------|--------------|
| 10:45 AM  | John Doe  | Added User     | David Wilson  | New account  |
| 09:30 AM  | Jane Smith| Updated API Key| Alice Smith   | Key rotation |
| Yesterday | John Doe  | Deactivated    | Tom Brown     | User request |
| [View All Activity]                                                    |
+-----------------------------------------------------------------------+
```

## User Management Interface

### User List View

```
+-----------------------------------------------------------------------+
| User Management                                      [+ Add New User]  |
+-----------------------------------------------------------------------+
| [Search Users...]                                    [Filter ▼]        |
+-----------------------------------------------------------------------+
| Name          | Email           | Phone      | Business   | Status     |
|---------------|-----------------|------------|------------|------------|
| Alice Smith   | alice@email.com | 555-0101   | ABC Corp   | Active     |
| Bob Johnson   | bob@email.com   | 555-0102   | XYZ Inc    | Active     |
| Carol Davis   | carol@email.com | 555-0103   | 123 LLC    | Active     |
| Tom Brown     | tom@email.com   | 555-0104   | DEF Co     | Inactive   |
+-----------------------------------------------------------------------+
| [Edit] [View Usage] [Reset Password] [Deactivate] for each user row    |
+-----------------------------------------------------------------------+
```

### Add/Edit User Form

```
+-----------------------------------------------------------------------+
| [Back to User List]                                                    |
+-----------------------------------------------------------------------+
| Add New User                                                           |
+-----------------------------------------------------------------------+
| User Information                                                       |
+-----------------------------------------------------------------------+
| Name*:         [                                                     ] |
| Email*:        [                                                     ] |
| Phone Number*: [                                                     ] |
| Business Name: [                                                     ] |
| Role:          [User ▼] (Options: User, Admin)                         |
+-----------------------------------------------------------------------+
| API Key Management                                                     |
+-----------------------------------------------------------------------+
| ElevenLabs API Key*: [                                               ] |
| [Test API Key] (Validates the key with ElevenLabs API)                 |
+-----------------------------------------------------------------------+
| Account Settings                                                       |
+-----------------------------------------------------------------------+
| Status: [Active ▼] (Options: Active, Inactive)                         |
| Send welcome email with temporary password: [x]                        |
+-----------------------------------------------------------------------+
| [Cancel]                                           [Save User]         |
+-----------------------------------------------------------------------+
```

### User Detail View (Admin View)

```
+-----------------------------------------------------------------------+
| [Back to User List]                                                    |
+-----------------------------------------------------------------------+
| User Details: Alice Smith                                              |
+-----------------------------------------------------------------------+
| User Information                                      [Edit]           |
+-----------------------------------------------------------------------+
| Name: Alice Smith                                                      |
| Email: alice@email.com                                                 |
| Phone: 555-0101                                                        |
| Business: ABC Corp                                                     |
| Role: User                                                             |
| Status: Active                                                         |
| Created: Jan 15, 2025 by John Doe (Admin)                             |
| Last Login: Today at 9:45 AM                                           |
+-----------------------------------------------------------------------+
| API Key Management                                   [Update Key]      |
+-----------------------------------------------------------------------+
| ElevenLabs API Key: ••••••••••••••••••••••••••••••  [Show/Hide]       |
| Last Updated: May 10, 2025 by Jane Smith (Admin)                       |
+-----------------------------------------------------------------------+
| Usage Statistics                                     [View Full Stats] |
+-----------------------------------------------------------------------+
| [Chart: Minutes Used vs. Remaining]                                    |
+-----------------------------------------------------------------------+
| Total Minutes Used: 1,250                                              |
| Minutes Remaining: 750                                                 |
| Credits Left: 100                                                      |
| Last Updated: Today at 10:30 AM                                        |
+-----------------------------------------------------------------------+
| Recent Activity                                                        |
+-----------------------------------------------------------------------+
| Date       | Time  | Action                                            |
|------------|-------|---------------------------------------------------|
| Today      | 9:45AM| User logged in                                    |
| Yesterday  | 3:20PM| Used 45 minutes of voice generation               |
| May 19     | 1:15PM| Used 30 minutes of voice generation               |
+-----------------------------------------------------------------------+
```

## User Dashboard (Regular User View)

```
+-----------------------------------------------------------------------+
| AI Voice Agent Usage Tracker                           User: Alice Smith |
+-----------------------------------------------------------------------+
| [Dashboard] [My Profile]                                  [Sign Out]   |
+-----------------------------------------------------------------------+
| Voice Usage Dashboard                                  [Refresh Data]  |
+-----------------------------------------------------------------------+
| [Card: Total Minutes Used]  | [Card: Minutes Remaining] | [Card: Credits Left] |
| 1,250                       | 750                        | 100                  |
+-----------------------------------------------------------------------+
| Usage History                                                          |
+-----------------------------------------------------------------------+
| [Chart: Usage Over Time - Last 30 Days]                                |
+-----------------------------------------------------------------------+
| Recent Activity                                                        |
+-----------------------------------------------------------------------+
| Date       | Minutes Used | Description                                |
|------------|--------------|-------------------------------------------|
| Today      | 45           | Voice generation                           |
| Yesterday  | 30           | Voice generation                           |
| May 19     | 25           | Voice generation                           |
+-----------------------------------------------------------------------+
```

## User Profile (Regular User View)

```
+-----------------------------------------------------------------------+
| [Back to Dashboard]                                                    |
+-----------------------------------------------------------------------+
| My Profile                                                             |
+-----------------------------------------------------------------------+
| Account Information                                    [Edit Profile]  |
+-----------------------------------------------------------------------+
| Name: Alice Smith                                                      |
| Email: alice@email.com                                                 |
| Phone: 555-0101                                                        |
| Business: ABC Corp                                                     |
+-----------------------------------------------------------------------+
| Password Management                                                    |
+-----------------------------------------------------------------------+
| [Change Password]                                                      |
+-----------------------------------------------------------------------+
| Need help? Contact your administrator.                                 |
+-----------------------------------------------------------------------+
```

## Workflow Diagrams

### Admin User Creation Flow

1. Admin navigates to User Management
2. Admin clicks "Add New User"
3. Admin fills in user details and API key
4. System validates the API key with ElevenLabs
5. Admin saves the new user
6. System creates user account and stores encrypted API key
7. System sends welcome email with temporary password (if selected)
8. New user appears in the user list

### API Key Update Flow

1. Admin navigates to User Management
2. Admin selects a user to view details
3. Admin clicks "Update Key" in the API Key Management section
4. Admin enters the new API key
5. System validates the new key with ElevenLabs
6. Admin confirms the update
7. System encrypts and stores the new key
8. System logs the key update in admin activity logs

### User Login and Dashboard View Flow

1. User logs in with email and password
2. System verifies credentials and role
3. User is directed to the user dashboard
4. System fetches usage statistics using the API key (without revealing it to the user)
5. Dashboard displays usage metrics and history
6. User can view profile but cannot see or modify the API key

## Mobile Responsive Considerations

The admin dashboard and user management interfaces will be responsive, with:

1. Collapsible navigation menu for small screens
2. Stacked cards instead of side-by-side layout on mobile
3. Horizontally scrollable tables with fixed headers
4. Touch-friendly buttons and form elements
5. Simplified charts optimized for mobile viewing

## Accessibility Features

1. Proper heading hierarchy for screen readers
2. ARIA labels for interactive elements
3. Sufficient color contrast for all text
4. Keyboard navigation support
5. Focus indicators for interactive elements

## Security Considerations

1. Role-based access control enforced on both client and server
2. API keys never exposed in client-side code
3. Session timeout for admin accounts
4. Audit logging for all admin actions
5. Input validation for all form fields
6. CSRF protection for all forms
7. Rate limiting for authentication attempts
