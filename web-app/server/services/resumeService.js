const { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  serverTimestamp 
} = require('firebase/firestore');
const { db } = require('../firebase-config');

/**
 * Save a new resume for a user
 * @param {string} userId - The user ID
 * @param {Object} resumeData - The resume data
 * @returns {Promise<Object>} The result of the operation
 */
async function saveResume(userId, resumeData) {
  try {
    // Check if user exists
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Get user data
    const userData = userDoc.data();
    
    // Structure the resume data with user info
    const resume = {
      userId,
      userEmail: userData.email,
      userFullName: userData.fullName || resumeData.name,
      personal: {
        name: resumeData.name,
        phone: resumeData.phone
      },
      education: resumeData.education || [],
      skills: resumeData.skills,
      projects: resumeData.projects || [],
      experience: resumeData.experience || [],
      hasExperience: resumeData.hasExperience || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create a new document in the resumes collection
    const resumeRef = doc(collection(db, "resumes"));
    await setDoc(resumeRef, resume);
    
    // Update user document to store the resume reference
    await updateDoc(doc(db, "users", userId), {
      resumeIds: arrayUnion(resumeRef.id),
      hasFilledResume: true
    });

    return {
      success: true,
      resumeId: resumeRef.id,
      message: "Resume saved successfully"
    };
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}

/**
 * Get a resume by ID
 * @param {string} resumeId - The resume ID
 * @param {string} userId - The user ID (for verification)
 * @returns {Promise<Object>} The resume data
 */
async function getResumeById(resumeId, userId) {
  try {
    const resumeDoc = await getDoc(doc(db, "resumes", resumeId));
    
    if (!resumeDoc.exists()) {
      throw new Error("Resume not found");
    }
    
    const resumeData = resumeDoc.data();
    
    // Verify this resume belongs to the requesting user
    if (resumeData.userId !== userId) {
      throw new Error("Unauthorized access to resume");
    }
    
    return {
      id: resumeId,
      ...resumeData
    };
  } catch (error) {
    console.error("Error getting resume:", error);
    throw error;
  }
}

/**
 * Get all resumes for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of resume data
 */
async function getUserResumes(userId) {
  try {
    const resumesQuery = query(
      collection(db, "resumes"),
      where("userId", "==", userId)
    );
    
    const resumesSnapshot = await getDocs(resumesQuery);
    const resumes = [];
    
    resumesSnapshot.forEach((resumeDoc) => {
      resumes.push({
        id: resumeDoc.id,
        ...resumeDoc.data()
      });
    });
    
    return resumes;
  } catch (error) {
    console.error("Error getting user resumes:", error);
    throw error;
  }
}

/**
 * Update an existing resume
 * @param {string} resumeId - The resume ID
 * @param {string} userId - The user ID (for verification)
 * @param {Object} resumeData - The updated resume data
 * @returns {Promise<Object>} The result of the operation
 */
async function updateResume(resumeId, userId, resumeData) {
  try {
    // First verify ownership
    const resumeDoc = await getDoc(doc(db, "resumes", resumeId));
    
    if (!resumeDoc.exists()) {
      throw new Error("Resume not found");
    }
    
    const existingResume = resumeDoc.data();
    
    // Verify this resume belongs to the requesting user
    if (existingResume.userId !== userId) {
      throw new Error("Unauthorized access to resume");
    }
    
    // Update the resume with new data
    const updatedResume = {
      ...resumeData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, "resumes", resumeId), updatedResume);
    
    return {
      success: true,
      resumeId,
      message: "Resume updated successfully"
    };
  } catch (error) {
    console.error("Error updating resume:", error);
    throw error;
  }
}

/**
 * Check if user has already filled out the resume form
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the user has filled out the resume
 */
async function hasFilledResume(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    return userData.hasFilledResume || false;
  } catch (error) {
    console.error("Error checking resume status:", error);
    throw error;
  }
}

module.exports = {
  saveResume,
  getResumeById,
  getUserResumes,
  updateResume,
  hasFilledResume
}; 