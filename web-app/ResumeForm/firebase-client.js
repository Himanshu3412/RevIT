// Firebase client for ResumeForm
document.addEventListener('DOMContentLoaded', function() {
  console.log('Resume Form Firebase client loaded');
  
  // Create elegant notification system
  const createNotification = (message, type = 'error') => {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add content
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.add('notification-hide');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto close after 5 seconds for success messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
    }
    
    // Make it visible with animation
    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 10);
    
    return notification;
  };

  // Expose the notification function to the window object so it can be used by other scripts
  window.createNotification = createNotification;

  // Check if user is logged in and is a candidate
  const checkAuthStatus = () => {
    const user = sessionStorage.getItem('user');
    if (!user) {
      // Redirect to login page if not logged in
      window.location.href = '../Login/index.html';
      return false;
    }
    
    try {
      const userData = JSON.parse(user);
      
      // Update navigation based on authentication
      updateNavigation(userData);
      
      if (userData.type !== 'candidate') {
        // If not a candidate, show notification and redirect
        createNotification('Only candidates can access the resume builder', 'error');
        setTimeout(() => {
          if (userData.type === 'recruiter') {
            window.location.href = '../Recruiter_Dashboard/index.html';
          } else {
            window.location.href = '../Login/index.html';
          }
        }, 2000);
        return false;
      }
      
      return userData;
    } catch (err) {
      console.error('Error parsing user data:', err);
      sessionStorage.removeItem('user');
      window.location.href = '../Login/index.html';
      return false;
    }
  };

  // Update navigation based on authentication status
  const updateNavigation = (userData) => {
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    
    if (loginBtn && signupBtn) {
      // Remove login/signup buttons
      loginBtn.parentNode.removeChild(loginBtn);
      signupBtn.parentNode.removeChild(signupBtn);
      
      // Create logout button
      const navLinks = document.querySelector('.nav-links');
      const logoutBtn = document.createElement('a');
      logoutBtn.href = '#';
      logoutBtn.className = 'nav-link logout-btn';
      logoutBtn.textContent = 'Log Out';
      
      // Add user's email as a profile element
      const profileElement = document.createElement('a');
      profileElement.href = '#';
      profileElement.className = 'nav-link profile-link';
      profileElement.innerHTML = `<i class="fas fa-user-circle"></i> ${userData.email}`;
      
      navLinks.appendChild(profileElement);
      navLinks.appendChild(logoutBtn);
      
      // Add logout functionality
      logoutBtn.addEventListener('click', handleLogout);
    }
  };

  // Handle form submission
  const handleResumeSubmit = async (resumeData) => {
    const userData = checkAuthStatus();
    
    if (!userData) {
      return false;
    }
    
    try {
      // Add form validation before submission
      if (!resumeData.personalInfo.name || !resumeData.personalInfo.phone) {
        createNotification('Please fill in all required personal information fields', 'error');
        return false;
      }
      
      if (!resumeData.education || resumeData.education.length === 0) {
        createNotification('Please add at least one education entry', 'error');
        return false;
      }
      
      if (!resumeData.skills || resumeData.skills.length === 0) {
        createNotification('Please add at least one skill', 'error');
        return false;
      }
      
      console.log('Submitting resume data:', resumeData);
      
      // Send resume data to the server
      const response = await fetch('http://localhost:3000/api/resume/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token' // In a real app, this would be a JWT token
        },
        body: JSON.stringify({
          userId: userData.uid,
          name: resumeData.personalInfo.name,
          phone: resumeData.personalInfo.phone,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          experience: resumeData.experience || [],
          hasExperience: resumeData.hasExperience || false
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        createNotification('Resume saved successfully! Redirecting to dashboard...', 'success');
        
        // Set resume flag to true
        sessionStorage.setItem('hasResume', 'true');
        
        // Cache the resume data
        sessionStorage.setItem('resumeData', JSON.stringify({
          id: data.resumeId || 'unknown',
          userId: userData.uid,
          name: resumeData.personalInfo.name,
          phone: resumeData.personalInfo.phone,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          experience: resumeData.experience || [],
          hasExperience: resumeData.hasExperience || false
        }));
        
        // Redirect to Student Dashboard immediately
        window.location.href = '../Student_Dashboard/index.html';
      } else {
        createNotification(data.message || 'Failed to save resume. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      createNotification('Error saving resume. Please try again.', 'error');
      return false;
    }
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      // Call the logout API
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Clear session storage regardless of API response
      sessionStorage.removeItem('user');
      
      // Show success notification
      createNotification('You have been logged out successfully', 'success');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '../Login/index.html';
      }, 1500);
    } catch (error) {
      console.error('Error logging out:', error);
      
      // If the API call fails, still log out locally
      sessionStorage.removeItem('user');
      createNotification('Logged out', 'success');
      
      setTimeout(() => {
        window.location.href = '../Login/index.html';
      }, 1500);
    }
  };

  // Check if user has already submitted a resume
  const checkResumeStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/resume/status/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token' // In a real app, this would be a JWT token
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.hasFilledResume) {
        createNotification('You have already submitted a resume. You can update it here.', 'info');
      }
    } catch (error) {
      console.error('Error checking resume status:', error);
    }
  };

  // Initialize the form
  const initializeForm = () => {
    const userData = checkAuthStatus();
    
    if (!userData) {
      return;
    }
    
    // Check if user has already submitted a resume
    checkResumeStatus(userData.uid);
    
    // Find the submitResume button in the review modal
    const submitResumeBtn = document.getElementById('submitResume');
    
    if (submitResumeBtn) {
      // Set a flag to indicate we're handling the submission
      window.resumeSubmissionHandled = true;
      
      // Override the submit button's click event
      submitResumeBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        
        // Get the form data from the main script's resumeData object
        // This will only work if the main script exposes this variable
        // Alternatively, we could collect the data from the form again
        let resumeData;
        
        try {
          // Try to access resumeData from the parent scope (main script)
          if (typeof window.resumeData !== 'undefined') {
            resumeData = window.resumeData;
          } else {
            // Fallback to collecting form data ourselves
            const form = document.getElementById('resumeForm');
            const formData = new FormData(form);
            
            resumeData = {
              personalInfo: {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value
              },
              hasExperience: document.getElementById('hasExperience').checked,
              skills: document.getElementById('skills').value.split(',').map(skill => skill.trim()),
              education: getEducationData(),
              projects: getProjectsData(),
              experience: getExperienceData()
            };
          }
          
          // Submit the data
          const success = await handleResumeSubmit(resumeData);
          
          if (success) {
            // Reset form and hide modal
            document.getElementById('resumeForm').reset();
            document.getElementById('resumeReviewModal').classList.add('hidden');
            document.body.style.overflow = 'auto';
            
            // Add any additional post-submission logic
            createNotification('Resume created successfully!', 'success');
          }
        } catch (error) {
          console.error('Error in form submission:', error);
          createNotification('An error occurred while submitting your resume', 'error');
        }
      });
    }
  };

  // Helper function to collect education data
  const getEducationData = () => {
    const educationEntries = document.querySelectorAll('.education-entry');
    const education = [];
    
    educationEntries.forEach(entry => {
      // Find the input fields within this education entry
      const inputs = entry.querySelectorAll('input');
      const select = entry.querySelector('select');
      
      if (inputs.length >= 3 && select) {
        const degree = inputs[0].value.trim();
        const major = inputs[1].value.trim();
        const school = inputs[2].value.trim();
        const graduationYear = select.value.trim();
        
        if (degree || school) {
          education.push({
            degree,
            major,
            school,
            graduationYear
          });
        }
      }
    });
    
    return education;
  };

  // Helper function to collect projects data
  const getProjectsData = () => {
    const projectEntries = document.querySelectorAll('.project-entry');
    const projects = [];
    
    projectEntries.forEach(entry => {
      const name = entry.querySelector('[name="projectName[]"]')?.value || '';
      const description = entry.querySelector('[name="projectDescription[]"]')?.value || '';
      const skillsInput = entry.querySelector('[name="projectSkills[]"]')?.value || '';
      const skills = skillsInput ? skillsInput.split(',').map(skill => skill.trim()) : [];
      
      if (name || description) {
        projects.push({
          name,
          description,
          skills
        });
      }
    });
    
    return projects;
  };

  // Helper function to collect experience data
  const getExperienceData = () => {
    if (!document.getElementById('hasExperience').checked) {
      return [];
    }
    
    const experienceEntries = document.querySelectorAll('.experience-entry');
    const experience = [];
    
    experienceEntries.forEach(entry => {
      const companyName = entry.querySelector('[name="companyName[]"]')?.value || '';
      const position = entry.querySelector('[name="position[]"]')?.value || '';
      const duration = entry.querySelector('[name="duration[]"]')?.value || '';
      const description = entry.querySelector('[name="experienceDescription[]"]')?.value || '';
      
      if (companyName || position) {
        experience.push({
          companyName,
          position,
          duration,
          description
        });
      }
    });
    
    return experience;
  };

  // Add CSS for notifications if not already added
  if (!document.querySelector('#notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        transform: translateX(400px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        z-index: 1000;
        overflow: hidden;
      }
      
      .notification.notification-show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .notification.notification-hide {
        transform: translateX(400px);
        opacity: 0;
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        padding: 16px;
      }
      
      .notification-icon {
        margin-right: 12px;
        font-size: 20px;
        color: #333;
      }
      
      .notification.error .notification-icon {
        color: #e53935;
      }
      
      .notification.success .notification-icon {
        color: #43a047;
      }
      
      .notification.info .notification-icon {
        color: #1e88e5;
      }
      
      .notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: #333;
      }
      
      .notification-close {
        background: none;
        border: none;
        padding: 0;
        margin-left: 12px;
        cursor: pointer;
        font-size: 16px;
        color: #999;
      }
      
      .notification.error::before {
        content: '';
        display: block;
        height: 3px;
        width: 100%;
        background-color: #e53935;
      }
      
      .notification.success::before {
        content: '';
        display: block;
        height: 3px;
        width: 100%;
        background-color: #43a047;
      }
      
      .notification.info::before {
        content: '';
        display: block;
        height: 3px;
        width: 100%;
        background-color: #1e88e5;
      }
      
      .profile-link {
        display: flex;
        align-items: center;
      }
      
      .profile-link i {
        margin-right: 8px;
      }
      
      @media (max-width: 480px) {
        .notification {
          width: calc(100% - 40px);
          right: 20px;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Initialize the form
  initializeForm();
}); 