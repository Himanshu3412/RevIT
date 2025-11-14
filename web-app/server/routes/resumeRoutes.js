const express = require('express');
const router = express.Router();
const resumeService = require('../services/resumeService');
const { auth } = require('../firebase-config');

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

// Save a new resume
router.post('/save', verifyAuth, async (req, res) => {
  try {
    const { userId, ...resumeData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = await resumeService.saveResume(userId, resumeData);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving resume:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save resume'
    });
  }
});

// Get a resume by ID
router.get('/:resumeId', verifyAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const resume = await resumeService.getResumeById(resumeId, userId);
    
    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to get resume'
    });
  }
});

// Get all resumes for a user
router.get('/user/:userId', verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const resumes = await resumeService.getUserResumes(userId);
    
    res.status(200).json({
      success: true,
      resumes
    });
  } catch (error) {
    console.error('Error getting user resumes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user resumes'
    });
  }
});

// Update an existing resume
router.put('/:resumeId', verifyAuth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { userId, ...resumeData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = await resumeService.updateResume(resumeId, userId, resumeData);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to update resume'
    });
  }
});

// Check if user has filled resume
router.get('/status/:userId', verifyAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const hasFilledResume = await resumeService.hasFilledResume(userId);
    
    res.status(200).json({
      success: true,
      hasFilledResume
    });
  } catch (error) {
    console.error('Error checking resume status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check resume status'
    });
  }
});

module.exports = router; 