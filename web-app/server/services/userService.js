const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} = require('firebase/auth');
const { 
  collection, 
  doc, 
  setDoc, 
  getDoc 
} = require('firebase/firestore');
const { auth, db } = require('../firebase-config');

/**
 * Register a new candidate user
 * @param {Object} userData - User data including email, password, and candidate profile
 * @returns {Promise<Object>} User data and authentication result
 */
async function registerCandidate(userData) {
  try {
    // Create the user with email and password
    const { email, password, ...profileData } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add user profile data to Firestore with user type
    await setDoc(doc(db, "users", user.uid), {
      ...profileData,
      email,
      type: 'candidate',
      createdAt: new Date().toISOString()
    });

    return {
      uid: user.uid,
      email: user.email,
      type: 'candidate'
    };
  } catch (error) {
    console.error("Error registering candidate:", error);
    throw error;
  }
}

/**
 * Register a new recruiter user
 * @param {Object} userData - User data including email, password, and recruiter profile
 * @returns {Promise<Object>} User data and authentication result
 */
async function registerRecruiter(userData) {
  try {
    // Create the user with email and password
    const { email, password, ...profileData } = userData;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Add user profile data to Firestore with user type
    await setDoc(doc(db, "users", user.uid), {
      ...profileData,
      email,
      type: 'recruiter',
      createdAt: new Date().toISOString()
    });

    return {
      uid: user.uid,
      email: user.email,
      type: 'recruiter'
    };
  } catch (error) {
    console.error("Error registering recruiter:", error);
    throw error;
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and authentication result
 */
async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user type and profile data
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        type: userData.type,
        profile: userData
      };
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

module.exports = {
  registerCandidate,
  registerRecruiter,
  signIn,
  logOut
}; 