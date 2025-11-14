// Firebase client-side integration
document.addEventListener('DOMContentLoaded', function() {
  console.log('Firebase client script loaded');

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

  // Add CSS for notifications
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
      
      @media (max-width: 480px) {
        .notification {
          width: calc(100% - 40px);
          right: 20px;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Get form elements
  const candidateForm = document.getElementById('candidateForm');
  const recruiterForm = document.getElementById('recruiterForm');

  // Override form submission for candidate
  if (candidateForm) {
    candidateForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Show loading state
      const submitButton = candidateForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Processing...';
      submitButton.disabled = true;
      
      // Get form data
      const formData = {
        candidateName: document.getElementById('candidateName').value,
        candidateEmail: document.getElementById('candidateEmail').value,
        candidatePassword: document.getElementById('candidatePassword').value,
        candidateConfirmPassword: document.getElementById('candidateConfirmPassword').value,
        candidateResume: document.getElementById('candidateResume')?.value || '',
        candidateJobRole: document.getElementById('candidateJobRole')?.value || '',
        candidateSkills: document.getElementById('candidateSkills')?.value || ''
      };
      
      console.log("Candidate form data:", formData);
      
      // Validate passwords match
      if (formData.candidatePassword !== formData.candidateConfirmPassword) {
        createNotification('Passwords do not match', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
      }
      
      try {
        // First create the user in Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
          formData.candidateEmail, 
          formData.candidatePassword
        );
        
        const user = userCredential.user;
        
        // Send email verification
        await user.sendEmailVerification({
          url: window.location.origin + '/Login/index.html',
          handleCodeInApp: false
        });
        
        const idToken = await user.getIdToken();
        
        // Then send data to server to create profile
        const response = await fetch('http://localhost:3000/api/auth/register/candidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            ...formData,
            uid: user.uid
          })
        });
        
        const responseData = await response.json();
        console.log("Server response:", responseData);
        
        if (responseData.success) {
          createNotification('Registration successful! Please check your email to verify your account before logging in.', 'success');
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '../Login/index.html';
          }, 3000);
        } else {
          // If server fails but Firebase succeeded, still consider it a success
          // but log the error
          console.error("Server failed but Firebase succeeded:", responseData);
          createNotification('Account created successfully. Please log in to continue.', 'success');
          setTimeout(() => {
            window.location.href = '../Login/index.html';
          }, 1500);
        }
      } catch (error) {
        console.error('Error registering candidate:', error);
        createNotification(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
  
  // Override form submission for recruiter
  if (recruiterForm) {
    recruiterForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Show loading state
      const submitButton = recruiterForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Processing...';
      submitButton.disabled = true;
      
      // Get form data
      const formData = {
        recruiterName: document.getElementById('recruiterName').value,
        recruiterEmail: document.getElementById('recruiterEmail').value,
        recruiterPassword: document.getElementById('recruiterPassword').value,
        recruiterConfirmPassword: document.getElementById('recruiterConfirmPassword').value,
        recruiterOrganization: document.getElementById('recruiterOrganization')?.value || '',
        recruiterIndustry: document.getElementById('recruiterIndustry')?.value || '',
        recruiterOpenings: document.getElementById('recruiterOpenings')?.value || ''
      };
      
      console.log("Recruiter form data:", formData);
      
      // Validate passwords match
      if (formData.recruiterPassword !== formData.recruiterConfirmPassword) {
        createNotification('Passwords do not match', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
      }
      
      try {
        // First create the user in Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
          formData.recruiterEmail, 
          formData.recruiterPassword
        );
        
        const user = userCredential.user;
        
        // Send email verification
        await user.sendEmailVerification({
          url: window.location.origin + '/Login/index.html',
          handleCodeInApp: false
        });
        
        const idToken = await user.getIdToken();
        
        // Then send data to server to create profile
        const response = await fetch('http://localhost:3000/api/auth/register/recruiter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            ...formData,
            uid: user.uid
          })
        });
        
        const responseData = await response.json();
        console.log("Server response:", responseData);
        
        if (responseData.success) {
          createNotification('Registration successful! Please check your email to verify your account before logging in.', 'success');
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '../Login/index.html';
          }, 3000);
        } else {
          // If server fails but Firebase succeeded, still consider it a success
          // but log the error
          console.error("Server failed but Firebase succeeded:", responseData);
          createNotification('Account created successfully. Please log in to continue.', 'success');
          setTimeout(() => {
            window.location.href = '../Login/index.html';
          }, 1500);
        }
      } catch (error) {
        console.error('Error registering recruiter:', error);
        createNotification(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
}); 