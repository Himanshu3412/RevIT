const express = require('express');
const router = express.Router();
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
const { db, auth } = require('../firebase-config');

// Middleware to verify user authentication
const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Please log in'
    });
  }
  
  // For this implementation, we'll skip actual token verification since we don't have Firebase Admin SDK
  // In a production environment, you would use Firebase Admin SDK to verify the token properly
  console.log('Authorization header present, proceeding with request');
  
  // Just proceed with the request for now
  next();
};

// Create a new job posting
router.post('/create', verifyAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requiredSkills, 
      requiredMajor, 
      experienceRequired, 
      numberOfOpenings, 
      applicationDeadline, 
      recruiterId, 
      recruiterEmail, 
      recruiterCompany 
    } = req.body;
    
    if (!title || !description || !requiredSkills || !recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify the recruiter exists
    const recruiterDoc = await getDoc(doc(db, "recruiters", recruiterId));
    if (!recruiterDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Create a new job document
    const jobRef = doc(collection(db, "jobs"));
    const jobData = {
      id: jobRef.id,
      title,
      description,
      requiredSkills,
      requiredMajor,
      experienceRequired,
      numberOfOpenings,
      applicationDeadline,
      recruiterId,
      recruiterEmail,
      recruiterCompany,
      applicants: [],
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(jobRef, jobData);
    
    // Update recruiter with reference to this job
    await updateDoc(doc(db, "recruiters", recruiterId), {
      jobIds: arrayUnion(jobRef.id)
    });
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: {
        id: jobRef.id,
        ...jobData
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create job'
    });
  }
});

// Get all jobs by recruiterId
router.get('/recruiter/:recruiterId', verifyAuth, async (req, res) => {
  try {
    const { recruiterId } = req.params;
    
    // Check if recruiter exists
    const recruiterDoc = await getDoc(doc(db, "recruiters", recruiterId));
    if (!recruiterDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found'
      });
    }
    
    // Query jobs by recruiterId
    const jobsQuery = query(
      collection(db, "jobs"),
      where("recruiterId", "==", recruiterId)
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    jobsSnapshot.forEach((jobDoc) => {
      jobs.push({
        id: jobDoc.id,
        ...jobDoc.data()
      });
    });
    
    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error getting recruiter jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recruiter jobs'
    });
  }
});

// Get all available jobs for candidates
router.get('/available', verifyAuth, async (req, res) => {
  try {
    // Query all active jobs
    const jobsQuery = query(
      collection(db, "jobs"),
      where("status", "==", "active")
    );
    
    const jobsSnapshot = await getDocs(jobsQuery);
    const jobs = [];
    
    jobsSnapshot.forEach((jobDoc) => {
      const data = jobDoc.data();
      // Filter out sensitive information
      jobs.push({
        id: jobDoc.id,
        title: data.title,
        description: data.description,
        requiredSkills: data.requiredSkills,
        requiredMajor: data.requiredMajor,
        experienceRequired: data.experienceRequired,
        numberOfOpenings: data.numberOfOpenings,
        applicationDeadline: data.applicationDeadline,
        recruiterCompany: data.recruiterCompany,
        createdAt: data.createdAt
      });
    });
    
    res.status(200).json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Error getting available jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available jobs'
    });
  }
});

// Get job details by ID
router.get('/:jobId', verifyAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobDoc = await getDoc(doc(db, "jobs", jobId));
    if (!jobDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    res.status(200).json({
      success: true,
      job: {
        id: jobDoc.id,
        ...jobDoc.data()
      }
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get job details'
    });
  }
});

// Apply for a job
router.post('/:jobId/apply', verifyAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, resumeId } = req.body;
    
    if (!userId || !resumeId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Resume ID are required'
      });
    }
    
    // Check if job exists
    const jobDoc = await getDoc(doc(db, "jobs", jobId));
    if (!jobDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check if user exists
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if resume exists
    const resumeDoc = await getDoc(doc(db, "resumes", resumeId));
    if (!resumeDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Get job data
    const jobData = jobDoc.data();
    
    // Check if user has already applied
    const existingApplication = jobData.applicants.find(app => app.userId === userId);
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }
    
    // Update job with new applicant
    const applicant = {
      userId,
      resumeId,
      userEmail: userDoc.data().email,
      userName: userDoc.data().fullName,
      appliedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    await updateDoc(doc(db, "jobs", jobId), {
      applicants: arrayUnion(applicant),
      updatedAt: serverTimestamp()
    });
    
    res.status(200).json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply for job'
    });
  }
});

// Get all applicants for a job
router.get('/:jobId/applicants', verifyAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { recruiterId } = req.query;
    
    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }
    
    // Check if job exists
    const jobDoc = await getDoc(doc(db, "jobs", jobId));
    if (!jobDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Verify the job belongs to this recruiter
    const jobData = jobDoc.data();
    if (jobData.recruiterId !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: This job does not belong to you'
      });
    }
    
    res.status(200).json({
      success: true,
      applicants: jobData.applicants || []
    });
  } catch (error) {
    console.error('Error getting job applicants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get job applicants'
    });
  }
});

module.exports = router; 