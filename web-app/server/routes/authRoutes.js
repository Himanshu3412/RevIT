const express = require('express');
const router = express.Router();
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const { collection, doc, setDoc, getDoc } = require('firebase/firestore');
const { db, auth } = require('../firebase-config');

// Middleware to verify Firebase token
// For this implementation, we'll skip actual token verification since we don't have Firebase Admin SDK
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token provided, proceed with the existing implementation
    return next();
  }
  
  // Since we don't have proper token verification on server-side yet,
  // we'll just log the token and proceed
  console.log('Token received but skipping verification');
  
  // In a production environment, you would use Firebase Admin SDK
  // to verify the token properly
  
  // For now, let's proceed with the request
  next();
};

// Register a new candidate
router.post('/register/candidate', verifyFirebaseToken, async (req, res) => {
  try {
    const { 
      candidateName: fullName, 
      candidateEmail: email, 
      candidatePassword: password,
      candidateJobRole: jobRole = '',
      candidateSkills: skills = '',
      candidateResume: resumeSummary = '',
      uid // This would come from Firebase Authentication
    } = req.body;
    
    console.log("Registering candidate with data:", { fullName, email, jobRole, skills, resumeSummary });
    
    let userId = uid;
    
    // If no Firebase token or uid, create the user in Firebase Auth
    if (!userId) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      } catch (authError) {
        console.error('Firebase Auth Error:', authError);
        return res.status(400).json({
          success: false,
          message: authError.message || 'Failed to register candidate'
        });
      }
    }
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      email,
      fullName,
      type: 'candidate',
      jobRole,
      skills,
      resumeSummary,
      hasFilledResume: false,
      resumeIds: [],
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Candidate registered successfully'
    });
  } catch (error) {
    console.error('Error registering candidate:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register candidate'
    });
  }
});

// Register a new recruiter
router.post('/register/recruiter', verifyFirebaseToken, async (req, res) => {
  try {
    const {
      recruiterName: fullName,
      recruiterEmail: email,
      recruiterPassword: password,
      recruiterOrganization: company = '',
      recruiterIndustry: industry = '',
      recruiterOpenings: numberOfOpenings = '0',
      uid // This would come from Firebase Authentication
    } = req.body;
    
    console.log("Registering recruiter with data:", { fullName, email, company, industry, numberOfOpenings });
    
    let userId = uid;
    
    // If no Firebase token or uid, create the user in Firebase Auth
    if (!userId) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userId = userCredential.user.uid;
      } catch (authError) {
        console.error('Firebase Auth Error:', authError);
        return res.status(400).json({
          success: false,
          message: authError.message || 'Failed to register recruiter'
        });
      }
    }
    
    // Create a recruiter document in Firestore
    // This should be in the "recruiters" collection, not "users"
    const recruiterData = {
      uid: userId,
      email,
      fullName,
      type: 'recruiter',
      company,
      industry,
      numberOfOpenings: parseInt(numberOfOpenings) || 0,
      jobIds: [],
      createdAt: new Date().toISOString()
    };
    
    console.log("Saving recruiter data:", recruiterData);
    
    try {
      await setDoc(doc(db, "recruiters", userId), recruiterData);
      
      res.status(201).json({
        success: true,
        message: 'Recruiter registered successfully'
      });
    } catch (dbError) {
      console.error('Firestore Error:', dbError);
      return res.status(500).json({
        success: false,
        message: dbError.message || 'Failed to save recruiter data'
      });
    }
  } catch (error) {
    console.error('Error registering recruiter:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register recruiter'
    });
  }
});

// Login user
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, password, oauth, provider } = req.body;
    let user;
    
    // If a token is provided but we don't have verification,
    // we'll trust the client-side authentication for now
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Extract UID from the request if possible
      const uidFromRequest = req.body.uid;
      if (uidFromRequest) {
        user = { uid: uidFromRequest, email };
      } else if (oauth && provider === 'google') {
        // For OAuth logins, we trust the Firebase token without password
        // This is the case for Google Sign-In
        console.log("Processing OAuth login from Google");
        const decodedToken = req.headers.authorization.split(' ')[1]; // Just using the token as-is for now
        user = { uid: req.body.uid || email, email };
      } else {
        // Otherwise use the provided credentials
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } catch (authError) {
          console.error('Firebase Auth Error:', authError);
          return res.status(400).json({
            success: false,
            message: authError.message || 'Failed to log in'
          });
        }
      }
    } else {
      // No token provided, require credentials unless it's OAuth
      if (oauth && provider === 'google') {
        return res.status(400).json({
          success: false,
          message: 'OAuth login requires a valid Firebase token'
        });
      }
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError) {
        console.error('Firebase Auth Error:', authError);
        return res.status(400).json({
          success: false,
          message: authError.message || 'Failed to log in'
        });
      }
    }
    
    // First, try to get user from recruiters collection
    const recruiterDoc = await getDoc(doc(db, "recruiters", user.uid));
    
    // Then, try users collection if not found in recruiters
    const candidateDoc = !recruiterDoc.exists() ? 
      await getDoc(doc(db, "users", user.uid)) : null;
    
    let userData = null;
    
    if (recruiterDoc.exists()) {
      userData = recruiterDoc.data();
      console.log("Found recruiter data:", userData);
    } else if (candidateDoc && candidateDoc.exists()) {
      userData = candidateDoc.data();
      console.log("Found candidate data:", userData);
    } else {
      console.log("User not found in either collection, creating default candidate");
      // Handle case where user auth exists but no document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        type: 'candidate',
        createdAt: new Date().toISOString()
      });
      
      userData = {
        uid: user.uid,
        email: user.email,
        type: 'candidate'
      };
    }
    
    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to log in'
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    await signOut(auth);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to log out'
    });
  }
});

module.exports = router; 