# AI Recruit Pro - Node.js Server

This is the server application for AI Recruit Pro, which connects the frontend pages and handles authentication using Firebase.

## Setup

1. Ensure you have Node.js installed (v14 or higher)
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Firebase (see [Firebase Setup Instructions](./FIREBASE_SETUP.md))

## Running the Server

### Development Mode

```
npm run dev
```

This will start the server with nodemon, which automatically restarts when you make changes.

### Production Mode

```
npm start
```

## Available Routes

### Frontend Routes
- `/` - Landing Page
- `/login` - Login Page
- `/signup` - Sign Up Page 
- `/resume` - Resume Form Page

### API Routes
- POST `/api/auth/register/candidate` - Register a new candidate
- POST `/api/auth/register/recruiter` - Register a new recruiter
- POST `/api/auth/login` - Login a user
- POST `/api/auth/logout` - Logout a user

## Project Structure

- `app.js` - Main application logic
- `server.js` - Entry point for the server
- `firebase-config.js` - Firebase configuration
- `routes/` - API routes
  - `authRoutes.js` - Authentication routes
- `services/` - Service layer
  - `userService.js` - User authentication and management
- `package.json` - Project configuration and dependencies

## Firebase Integration

This project uses Firebase for:
1. **User Authentication** - Email/password authentication for candidates and recruiters
2. **Database Storage** - Firestore to store user profiles and application data
3. **Security Rules** - To protect user data

For detailed Firebase setup instructions, see [Firebase Setup Instructions](./FIREBASE_SETUP.md). 