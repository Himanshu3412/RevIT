// Firebase client-side integration for Recruiter Dashboard
document.addEventListener('DOMContentLoaded', function() {
  console.log('Firebase recruiter dashboard client script loaded');

  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyDe3xYFLAq1_ynAJj16aRqW5ATyLI2ul0c",
    authDomain: "recruitai-89bec.firebaseapp.com",
    projectId: "recruitai-89bec",
    storageBucket: "recruitai-89bec.firebasestorage.app",
    messagingSenderId: "1049430619816",
    appId: "1:1049430619816:web:06ede9826a90681b47749d",
    measurementId: "G-YM15FRGGKH"
  };

  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // References to Firestore collections
  const db = firebase.firestore();
  const jobsCollection = db.collection('jobs');
  const recruitersCollection = db.collection('recruiters');

  // Get current user data from storage
  let currentUser = null;
  
  const getUserFromStorage = () => {
    try {
      // Try to get user from session storage first
      let userData = sessionStorage.getItem('user');
      if (!userData) {
        // If not in session storage, try local storage
        userData = localStorage.getItem('user');
      }
      
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  };

  // Create notification system
  const createNotification = (message, type = 'error') => {
    const notificationContainer = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on notification type
    let iconClass = 'fa-info-circle';
    let title = 'Information';
    
    if (type === 'success') {
      iconClass = 'fa-check-circle';
      title = 'Success';
    } else if (type === 'error') {
      iconClass = 'fa-exclamation-circle';
      title = 'Error';
    }
    
    // Add content
    notification.innerHTML = `
      <div class="notification-title">
        <i class="fas ${iconClass}"></i>
        ${title}
      </div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to DOM
    notificationContainer.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // Auto close after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 5000);
    }
    
    return notification;
  };

  // Check authentication status on page load
  const checkAuth = () => {
    console.log('Checking authentication...');
    currentUser = getUserFromStorage();
    
    if (!currentUser) {
      console.log('No user found in storage, redirecting to login');
      window.location.href = '../Login/index.html';
      return;
    }
    
    // Verify user is a recruiter
    if (currentUser.type !== 'recruiter') {
      console.log('User is not a recruiter, redirecting to appropriate page');
      createNotification('Access denied. Only recruiters can access this dashboard.', 'error');
      
      setTimeout(() => {
        if (currentUser.type === 'candidate') {
          window.location.href = '../ResumeForm/index.html';
        } else {
          window.location.href = '../Login/index.html';
        }
      }, 2000);
      
      return;
    }
    
    console.log('User authenticated as recruiter:', currentUser.email);
    
    // Initialize the dashboard for this recruiter
    initializeDashboard();
  };

  // Initialize the dashboard
  const initializeDashboard = async () => {
    console.log('Initializing dashboard...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load recruiter's jobs
    await loadRecruiterJobs();
    
    console.log('Dashboard initialization complete');
  };

  // Set up event listeners for the dashboard
  const setupEventListeners = () => {
    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout);
    }
    
    // Home button
    const homeLink = document.getElementById('home-link');
    if (homeLink) {
      homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
      });
    }
    
    // View profile button
    const viewProfileBtn = document.getElementById('view-profile');
    if (viewProfileBtn) {
      viewProfileBtn.addEventListener('click', showProfilePanel);
    }
    
    // Back to dashboard button
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', hideProfilePanel);
    }
    
    // Create job button
    const createJobBtn = document.getElementById('mc_button');
    console.log('Create job button element:', createJobBtn);
    if (createJobBtn) {
      console.log('Adding click event listener to create job button');
      createJobBtn.addEventListener('click', showJobForm);
    } else {
      console.error('Create job button not found in the DOM');
    }
    
    // Back to jobs button
    const backToJobsBtn = document.getElementById('back-to-jobs');
    if (backToJobsBtn) {
      backToJobsBtn.addEventListener('click', hideJobForm);
    }
    
    // Cancel job form button
    const cancelJobFormBtn = document.getElementById('cancel-job-form');
    if (cancelJobFormBtn) {
      cancelJobFormBtn.addEventListener('click', hideJobForm);
    }
    
    // Job creation form submission
    const jobForm = document.getElementById('job-creation-form');
    if (jobForm) {
      jobForm.addEventListener('submit', handleJobFormSubmit);
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', showPasswordChangeModal);
    }
    
    // Cancel password change button
    const cancelPasswordChangeBtn = document.getElementById('cancel-password-change');
    if (cancelPasswordChangeBtn) {
      cancelPasswordChangeBtn.addEventListener('click', hidePasswordChangeModal);
    }
    
    // Password change form submission
    const passwordChangeForm = document.getElementById('password-change-form');
    if (passwordChangeForm) {
      passwordChangeForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        if (modal) {
          modal.classList.remove('show');
        }
      });
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
      const modals = document.querySelectorAll('.modal');
      modals.forEach(modal => {
        if (event.target === modal) {
          modal.classList.remove('show');
        }
      });
    });
  };

  // Load recruiter's jobs from Firestore
  const loadRecruiterJobs = async () => {
    if (!currentUser || !currentUser.uid) {
      return;
    }
    
    const jobsList = document.getElementById('jobs-list');
    
    try {
      const snapshot = await jobsCollection.where('recruiterId', '==', currentUser.uid).get();
      
      // Clear loading placeholder
      jobsList.innerHTML = '';
      
      if (snapshot.empty) {
        jobsList.innerHTML = `
          <div class="no-jobs-message">
            <p>You haven't created any job postings yet.</p>
            <p>Click "Create new job" to get started.</p>
          </div>
        `;
        return;
      }
      
      // Process and display jobs
      snapshot.forEach(doc => {
        const job = doc.data();
        const jobCard = createJobCard(job);
        jobsList.appendChild(jobCard);
      });
    } catch (error) {
      console.error('Error loading jobs:', error);
      createNotification('Failed to load your job listings. Please try again.', 'error');
      
      jobsList.innerHTML = `
        <div class="error-message">
          <p>There was a problem loading your job listings. Please refresh the page to try again.</p>
        </div>
      `;
    }
  };

  // Create a job card element
  const createJobCard = (job) => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.dataset.jobId = job.id;
    
    // Format job creation date
    const createdDate = job.createdAt ? new Date(job.createdAt.seconds * 1000) : new Date();
    const formattedDate = createdDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Parse skills array or string
    let skillsArray = [];
    if (job.requiredSkills) {
      if (typeof job.requiredSkills === 'string') {
        skillsArray = job.requiredSkills.split(',').map(skill => skill.trim());
      } else if (Array.isArray(job.requiredSkills)) {
        skillsArray = job.requiredSkills;
      }
    }
    
    // Create skills HTML
    const skillsHTML = skillsArray.map(skill => 
      `<span class="skill-tag">${skill}</span>`
    ).join('');
    
    // Set applicants count
    const applicantsCount = job.applicants ? job.applicants.length : 0;
    
    // Format degree requirement
    const degreeDisplay = job.requiredDegree && job.requiredDegree !== 'None' && job.requiredDegree.trim() !== '' 
      ? job.requiredDegree
      : 'No degree requirement';
    
    jobCard.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.title || 'Untitled Job'}</h3>
        <span class="job-created">Created on ${formattedDate}</span>
      </div>
      <div class="job-details">
        <div class="job-detail">
          <i class="fas fa-user-graduate"></i>
          ${job.requiredMajor || 'Any major'}
        </div>
        <div class="job-detail">
          <i class="fas fa-graduation-cap"></i>
          ${degreeDisplay}
        </div>
        <div class="job-detail">
          <i class="fas fa-briefcase"></i>
          ${job.experienceRequired || 'Not specified'} experience
        </div>
        <div class="job-detail">
          <i class="fas fa-users"></i>
          ${job.numberOfOpenings || '1'} opening${job.numberOfOpenings > 1 ? 's' : ''}
        </div>
        <div class="job-detail">
          <i class="fas fa-calendar-alt"></i>
          ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline'}
        </div>
      </div>
      <div class="job-skills">
        ${skillsHTML || '<span class="no-skills">No skills specified</span>'}
      </div>
      <button class="view-candidates-btn">
        View ${applicantsCount} candidate${applicantsCount !== 1 ? 's' : ''}
        <i class="fas fa-chevron-right"></i>
      </button>
    `;
    
    // Add event listener for viewing candidates
    const viewCandidatesBtn = jobCard.querySelector('.view-candidates-btn');
    viewCandidatesBtn.addEventListener('click', () => {
      // Call the showJobApplicants function defined in script.js
      const jobId = job.id;
      if (typeof showJobApplicants === 'function') {
        showJobApplicants(jobId);
      } else {
        console.error('showJobApplicants function is not defined');
        createNotification('Unable to load applicants. Please try again later.', 'error');
      }
    });
    
    return jobCard;
  };

  // Show the job creation form
  const showJobForm = () => {
    console.log('showJobForm function called');
    const jobsListView = document.getElementById('jobs-list-view');
    const jobFormView = document.getElementById('job-form-view');
    
    if (!jobFormView || !jobsListView) {
      console.error('Required DOM elements not found', { 
        jobsListView: !!jobsListView, 
        jobFormView: !!jobFormView 
      });
      createNotification('An error occurred. Please refresh the page and try again.', 'error');
      return;
    }
    
    jobsListView.style.display = 'none';
    jobFormView.style.display = 'block';
    
    // Make sure applicants view is also hidden
    const applicantsView = document.getElementById('applicants-view');
    if (applicantsView) {
      applicantsView.style.display = 'none';
    }
    
    // Reset form if needed
    const jobForm = document.getElementById('job-creation-form');
    if (jobForm) {
      jobForm.reset();
    }
  };

  // Hide the job creation form
  const hideJobForm = () => {
    document.getElementById('job-form-view').style.display = 'none';
    document.getElementById('jobs-list-view').style.display = 'block';
    
    // Reset the form
    document.getElementById('job-creation-form').reset();
  };

  // Handle job form submission
  const handleJobFormSubmit = async (event) => {
    event.preventDefault();
    
    if (!currentUser || !currentUser.uid) {
      createNotification('You must be logged in to create a job.', 'error');
      return;
    }
    
    const submitButton = document.getElementById('submit-job-form');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Creating...';
    submitButton.disabled = true;
    
    // Get form data
    const formData = {
      title: document.getElementById('job-title').value,
      description: document.getElementById('job-description').value,
      requiredMajor: document.getElementById('required-major').value,
      requiredDegree: document.getElementById('required-degree').value,
      requiredSkills: document.getElementById('required-skills').value,
      experienceRequired: document.getElementById('experience-required').value,
      numberOfOpenings: parseInt(document.getElementById('number-of-openings').value) || 1,
      applicationDeadline: document.getElementById('application-deadline').value || null,
      recruiterId: currentUser.uid,
      recruiterEmail: currentUser.email,
      recruiterCompany: currentUser.company || 'Not specified',
      applicants: [],
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
      // Add job to Firestore
      const jobRef = await jobsCollection.add(formData);
      
      // Update job with its ID
      await jobRef.update({ id: jobRef.id });
      
      // Update recruiter document to add this job
      await recruitersCollection.doc(currentUser.uid).update({
        jobIds: firebase.firestore.FieldValue.arrayUnion(jobRef.id)
      });
      
      createNotification('Job created successfully!', 'success');
      
      // Reset form and go back to jobs list
      hideJobForm();
      
      // Reload jobs list
      await loadRecruiterJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      createNotification('Failed to create job: ' + error.message, 'error');
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  };

  // Show profile modal
  const showProfileModal = async () => {
    const profileModal = document.getElementById('profile-modal');
    
    // Reset modal content
    document.getElementById('profile-name').textContent = currentUser.fullName || 'Not specified';
    document.getElementById('profile-email').textContent = currentUser.email || 'Not specified';
    document.getElementById('profile-company').textContent = currentUser.company || 'Not specified';
    document.getElementById('profile-industry').textContent = currentUser.industry || 'Not specified';
    
    profileModal.classList.add('show');
  };

  // Show profile panel in main content area
  const showProfilePanel = () => {
    // Hide other views
    document.getElementById('jobs-list-view').style.display = 'none';
    document.getElementById('job-form-view').style.display = 'none';
    
    // Show profile panel
    const profilePanel = document.getElementById('profile-panel-view');
    profilePanel.style.display = 'block';
    
    // Update profile panel content
    document.getElementById('profile-panel-name').textContent = currentUser.fullName || 'Not specified';
    document.getElementById('profile-panel-email').textContent = currentUser.email || 'Not specified';
    document.getElementById('profile-panel-company').textContent = currentUser.company || 'Not specified';
    document.getElementById('profile-panel-industry').textContent = currentUser.industry || 'Not specified';
    document.getElementById('profile-panel-uid').textContent = currentUser.uid || 'Not available';
  };

  // Show dashboard (jobs list)
  const showDashboard = () => {
    // Hide other views
    document.getElementById('job-form-view').style.display = 'none';
    document.getElementById('profile-panel-view').style.display = 'none';
    
    // Show jobs list view
    document.getElementById('jobs-list-view').style.display = 'block';
  };

  // Hide profile panel and go back to jobs list
  const hideProfilePanel = () => {
    document.getElementById('profile-panel-view').style.display = 'none';
    document.getElementById('jobs-list-view').style.display = 'block';
  };

  // Show password change modal
  const showPasswordChangeModal = () => {
    // Reset form
    const passwordForm = document.getElementById('password-change-form');
    if (passwordForm) passwordForm.reset();
    
    // Show modal
    const modal = document.getElementById('password-change-modal');
    if (modal) modal.classList.add('show');
  };

  // Hide password change modal
  const hidePasswordChangeModal = () => {
    const modal = document.getElementById('password-change-modal');
    if (modal) modal.classList.remove('show');
  };

  // Handle password change
  const handlePasswordChange = async (event) => {
    event.preventDefault();
    
    // Get form inputs
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Get values
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      createNotification('New passwords do not match.', 'error');
      return;
    }
    
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
      createNotification('Authentication error. Please log in again.', 'error');
      return;
    }
    
    try {
      // Create credentials using current email and password
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      // Re-authenticate user
      await user.reauthenticateWithCredential(credential);
      
      // Update password
      await user.updatePassword(newPassword);
      
      // Success
      createNotification('Password updated successfully!', 'success');
      hidePasswordChangeModal();
    } catch (error) {
      console.error('Error updating password:', error);
      
      // Show specific error messages
      if (error.code === 'auth/wrong-password') {
        createNotification('Current password is incorrect.', 'error');
      } else if (error.code === 'auth/weak-password') {
        createNotification('New password is too weak. Please choose a stronger password.', 'error');
      } else {
        createNotification('Failed to update password: ' + error.message, 'error');
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear user data from storage
      sessionStorage.removeItem('user');
      localStorage.removeItem('user');
      
      // Sign out from Firebase
      await firebase.auth().signOut();
      
      // Redirect to login page
      window.location.href = '../Login/index.html';
    } catch (error) {
      console.error('Error during logout:', error);
      createNotification('Failed to logout. Please try again.', 'error');
    }
  };

  // Initialize the dashboard when the page loads
  console.log('Starting dashboard initialization...');
  checkAuth();
}); 