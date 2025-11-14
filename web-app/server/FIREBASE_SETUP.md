# Firebase Setup Instructions

This document provides instructions for setting up Firebase for the AI Recruit Pro application.

## Step 1: Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired

## Step 2: Set up Firebase Authentication

1. In the Firebase Console, navigate to "Authentication"
2. Click "Get started"
3. Enable the "Email/Password" sign-in method
4. Optionally, enable Google and LinkedIn authentication if you want to implement social logins

## Step 3: Set up Firestore Database

1. In the Firebase Console, navigate to "Firestore Database"
2. Click "Create database"
3. Start in production mode or test mode as needed
4. Choose a location closest to your primary user base

## Step 4: Get your Firebase configuration

1. In the Firebase Console, click on the gear icon near "Project Overview" and select "Project settings"
2. Scroll down to "Your apps" section
3. If you haven't created an app yet, click on the web icon (</>) to create a new web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 5: Update the Firebase configuration in your project

1. Open the `firebase-config.js` file in your server directory
2. Replace the placeholder configuration with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 6: Set up Firestore security rules

1. In the Firebase Console, navigate to "Firestore Database"
2. Select the "Rules" tab
3. Update the rules to ensure proper security:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles are readable by authenticated users
    // but only writable by the user themselves
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Resume collection security rules
    match /resumes/{resumeId} {
      // Only the owner can read or write their own resumes
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // Recruiters can also read resumes
      allow read: if request.auth != null && 
                exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'recruiter';
    }
  }
}
```

## Step 7: Testing

1. Start your Node.js server
2. Try signing up and logging in with test accounts
3. Verify that user data is correctly stored in Firestore

## Database Structure

The application uses the following collections in Firestore:

### users
Stores user information for both candidates and recruiters:
- For candidates: Full name, email, resume summary, job role interest, skills
- For recruiters: Full name, email, organization, industry, number of openings

Each user document includes a `type` field that distinguishes between "candidate" and "recruiter".

### resumes
Stores resume data submitted by candidates:
- userId: Reference to the user who created the resume
- userEmail: Email of the user (for quick reference)
- userFullName: Full name of the user
- personal: Object containing personal information (name, phone)
- education: Array of education entries
- skills: String of skills
- projects: Array of project entries
- experience: Array of experience entries
- hasExperience: Boolean indicating whether the user has experience
- createdAt: Timestamp when the resume was created
- updatedAt: Timestamp when the resume was last updated 