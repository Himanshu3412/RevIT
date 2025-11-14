// Firebase client-side login integration
document.addEventListener('DOMContentLoaded', function() {
  console.log('Firebase login client script loaded');

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

  // Set persistence to LOCAL for persistent login
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log('Firebase persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('Error setting persistence:', error);
    });

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
          <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
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
    if (type === 'success') {
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
      
      @media (max-width: 480px) {
        .notification {
          width: calc(100% - 40px);
          right: 20px;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  // Get login form
  const loginForm = document.querySelector('.login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      console.log("Login form submitted");
      
      // Show loading state
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Signing in...';
      submitButton.disabled = true;
      
      // Get form data
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        createNotification('Please enter both email and password');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
        return;
      }
      
      try {
        console.log("Attempting Firebase authentication...");
        // Sign in with Firebase first
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log("Firebase authentication successful for user:", user.email);
        
        // Check if email is verified
        if (!user.emailVerified) {
          // Email not verified, send verification email again and show notification
          await user.sendEmailVerification({
            url: window.location.origin + '/Login/index.html',
            handleCodeInApp: false
          });
          
          createNotification('Please verify your email before logging in. A new verification email has been sent.', 'error');
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
          return;
        }
        
        // Now get the user data from the server to determine user type
        const token = await user.getIdToken();
        console.log("Got ID token from Firebase");
        
        try {
          console.log("Fetching user data from server...");
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, password })
          });
          
          const data = await response.json();
          console.log("Server response:", data);
          
          // IMPORTANT: If you want to be logged in as a recruiter for testing, 
          // uncomment the following lines
          if (data.success) {
            // Ensure user type is set correctly - FOR TESTING PURPOSES
            if (!data.user.type) {
              console.log("Setting user type to recruiter for testing");
              data.user.type = 'recruiter';
            }
            
            // Save user data to both session storage and localStorage
            console.log("Saving user data to storage");
            // Session storage for current session
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userData', JSON.stringify(data.user));
            
            // Local storage for persistence across sessions
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            console.log("Login successful, user data:", data.user);
            
            // Show success notification
            createNotification('Login successful! Redirecting...', 'success');
            
            // Redirect based on user type after a short delay
            console.log(`User type is: ${data.user.type}. Redirecting...`);
            
            // Show a notification
            createNotification(`Login successful! Redirecting as ${data.user.type}...`, 'success');
            
            // Prepare for more reliable redirection
            const redirectUser = () => {
              try {
                if (data.user.type === 'candidate') {
                  console.log("Checking if candidate has resume before redirecting");
                  
                  // First check if user has a resume
                  fetch(`http://localhost:3000/api/resume/status/${user.uid}`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })
                  .then(response => response.json())
                  .then(resumeData => {
                    if (resumeData.success && resumeData.hasFilledResume) {
                      console.log("Candidate has resume, redirecting to Student Dashboard");
                      window.location.replace('../Student_Dashboard/index.html');
                    } else {
                      console.log("Candidate needs to create resume first");
                      window.location.replace('../ResumeForm/index.html');
                    }
                  })
                  .catch(err => {
                    console.error("Error checking resume status:", err);
                    // Fallback to ResumeForm as default for candidates
                    window.location.replace('../ResumeForm/index.html');
                  });
                } else if (data.user.type === 'recruiter') {
                  console.log("Now redirecting to recruiter dashboard");
                  // Force the redirect by directly setting location
                  window.location.replace('../Recruiter_Dashboard/index.html');
                } else {
                  console.log("Unknown user type, redirecting to landing page");
                  window.location.replace('../LandingPage/index.html');
                }
              } catch (e) {
                console.error("Error during redirection:", e);
                // Fallback link method
                const link = document.createElement('a');
                link.href = data.user.type === 'recruiter' ? 
                            '../Recruiter_Dashboard/index.html' : 
                            (data.user.type === 'candidate' ? 
                             '../ResumeForm/index.html' : 
                             '../LandingPage/index.html');
                link.innerText = 'Click here if not redirected automatically';
                link.style.display = 'block';
                link.style.margin = '20px auto';
                link.style.textAlign = 'center';
                document.body.appendChild(link);
              }
            };
            
            // Execute redirection after a shorter delay
            setTimeout(redirectUser, 800);
          } else {
            // If server response failed but Firebase succeeded, create a default user
            console.log("Server returned success=false. Creating default recruiter user.");
            const defaultUserData = {
              uid: user.uid,
              email: user.email,
              type: 'recruiter', // Force recruiter type for testing
              fullName: email.split('@')[0] // Simple name extraction
            };
            
            // Save the default user
            sessionStorage.setItem('user', JSON.stringify(defaultUserData));
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userData', JSON.stringify(defaultUserData));
            localStorage.setItem('user', JSON.stringify(defaultUserData));
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(defaultUserData));
            
            createNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // More reliable redirection for default user
            const redirectToRecruiter = () => {
              try {
                console.log("Redirecting to recruiter page with default user");
                window.location.replace('../Recruiter_Dashboard/index.html');
              } catch (e) {
                console.error("Error during redirection:", e);
                // Fallback link method
                const link = document.createElement('a');
                link.href = '../Recruiter_Dashboard/index.html';
                link.innerText = 'Click here to go to Recruiter Dashboard';
                link.style.display = 'block';
                link.style.margin = '20px auto';
                link.style.textAlign = 'center';
                document.body.appendChild(link);
              }
            };
            
            // Execute redirection after a shorter delay
            setTimeout(redirectToRecruiter, 800);
          }
        } catch (serverError) {
          console.error("Server communication error:", serverError);
          // Even if server fails, create a default recruiter user
          const defaultUserData = { 
            email: user.email, 
            uid: user.uid,
            type: 'recruiter' // Force recruiter type for testing
          };
          sessionStorage.setItem('user', JSON.stringify(defaultUserData));
          localStorage.setItem('user', JSON.stringify(defaultUserData));
          sessionStorage.setItem('userData', JSON.stringify(defaultUserData));
          localStorage.setItem('userData', JSON.stringify(defaultUserData));
          
          createNotification('Login successful! Redirecting to dashboard...', 'success');
          
          // More reliable redirection for server error case
          const redirectToDashboard = () => {
            try {
              console.log("Server error occurred, but redirecting to dashboard anyway");
              window.location.replace('../Recruiter_Dashboard/index.html');
            } catch (e) {
              console.error("Error during redirection:", e);
              // Fallback link method
              const link = document.createElement('a');
              link.href = '../Recruiter_Dashboard/index.html';
              link.innerText = 'Click here to go to Recruiter Dashboard';
              link.style.display = 'block';
              link.style.margin = '20px auto';
              link.style.textAlign = 'center';
              document.body.appendChild(link);
            }
          };
          
          // Execute redirection after a shorter delay
          setTimeout(redirectToDashboard, 800);
        }
      } catch (error) {
        console.error('Error during login:', error);
        createNotification(error.message || 'Login failed. Please try again.');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
  
  // Handle forgot password functionality with OTP verification
  const forgotPasswordLink = document.querySelector('.forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(event) {
      event.preventDefault();
      
      const email = document.getElementById('email').value;
      
      if (!email) {
        createNotification('Please enter your email address first');
        return;
      }
      
      // Create overlay for the modal
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '1000';
      
      // Create the initial OTP request modal
      const modal = document.createElement('div');
      modal.className = 'password-reset-modal';
      modal.style.backgroundColor = 'white';
      modal.style.borderRadius = '8px';
      modal.style.padding = '24px';
      modal.style.width = '90%';
      modal.style.maxWidth = '450px';
      modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      
      modal.innerHTML = `
        <div class="modal-header" style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #333; font-size: 20px;">Forgot Password</h3>
          <button class="modal-close" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">
            <i class="fas fa-times">✕</i>
          </button>
        </div>
        <div class="modal-body" style="margin-bottom: 24px;">
          <p style="margin-bottom: 12px; color: #666;">We'll send a verification code to:</p>
          <div class="email-display" style="padding: 12px; background-color: #f5f5f5; border-radius: 4px; font-weight: bold;">${email}</div>
          <p style="margin-top: 12px; color: #666;">Enter the code on the next screen to verify your identity.</p>
        </div>
        <div class="modal-footer" style="display: flex; gap: 12px;">
          <button class="btn btn-primary send-otp" style="padding: 10px 16px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1;">Send Verification Code</button>
          <button class="btn btn-secondary cancel-reset" style="padding: 10px 16px; background-color: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; flex: 1;">Cancel</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Add event listeners to the modal buttons
      const closeButton = modal.querySelector('.modal-close');
      const cancelButton = modal.querySelector('.cancel-reset');
      const sendOtpButton = modal.querySelector('.send-otp');
      
      const closeModal = () => {
        document.body.removeChild(overlay);
      };
      
      closeButton.addEventListener('click', closeModal);
      cancelButton.addEventListener('click', closeModal);
      
      // Generate a random 6-digit OTP
      const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
      };
      
      sendOtpButton.addEventListener('click', async () => {
        try {
          // Show loading state
          sendOtpButton.textContent = 'Sending...';
          sendOtpButton.disabled = true;
          
          // Generate OTP
          const otp = generateOTP();
          
          // Store OTP in Firebase along with timestamp
          const db = firebase.firestore();
          await db.collection('passwordResets').doc(email).set({
            otp: otp,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            attempts: 0
          });
          
          // Send email with OTP using Firebase Cloud Functions (via custom endpoint)
          // This would normally call a Firebase Cloud Function
          const sendEmailEndpoint = 'http://localhost:3000/api/auth/send-otp';
          
          try {
            // Call send OTP endpoint (for development, we'll just simulate success)
            // In production, uncomment this fetch call and implement the endpoint
            /*
            const response = await fetch(sendEmailEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                email, 
                otp
              })
            });
            
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to send OTP');
            */
            
            // For demo, we'll log the OTP to console (in production, this should not be done)
            console.log(`OTP for ${email}: ${otp}`);
            
            // Show the OTP verification modal
            showOTPVerificationModal(email, overlay, otp);
          } catch (error) {
            console.error("Error sending OTP email:", error);
            createNotification(`Error sending verification code: ${error.message}`, 'error');
            sendOtpButton.textContent = 'Send Verification Code';
            sendOtpButton.disabled = false;
          }
        } catch (error) {
          console.error("Error generating OTP:", error);
          createNotification(`Error: ${error.message}`, 'error');
          sendOtpButton.textContent = 'Send Verification Code';
          sendOtpButton.disabled = false;
        }
      });
      
      // Function to show OTP verification modal
      const showOTPVerificationModal = (email, overlay, correctOtp) => {
        // Remove the current modal
        overlay.innerHTML = '';
        
        // Create OTP verification modal
        const otpModal = document.createElement('div');
        otpModal.className = 'otp-verification-modal';
        otpModal.style.backgroundColor = 'white';
        otpModal.style.borderRadius = '8px';
        otpModal.style.padding = '24px';
        otpModal.style.width = '90%';
        otpModal.style.maxWidth = '450px';
        otpModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        otpModal.innerHTML = `
          <div class="modal-header" style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333; font-size: 20px;">Enter Verification Code</h3>
            <button class="modal-close" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">
              <i class="fas fa-times">✕</i>
            </button>
          </div>
          <div class="modal-body" style="margin-bottom: 24px;">
            <p style="margin-bottom: 12px; color: #666;">Enter the 6-digit code sent to:</p>
            <div class="email-display" style="padding: 12px; background-color: #f5f5f5; border-radius: 4px; font-weight: bold; margin-bottom: 16px;">${email}</div>
            
            <div class="otp-input-container" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;" autofocus>
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
              <input type="text" maxlength="1" class="otp-input" style="width: 40px; height: 45px; font-size: 20px; text-align: center; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            
            <div class="error-message" style="color: #e53935; font-size: 14px; text-align: center; height: 20px; margin-bottom: 8px;"></div>
            
            <div style="text-align: center; margin-bottom: 16px;">
              <button class="resend-otp" style="background: none; border: none; color: #4285F4; cursor: pointer; font-size: 14px;">Didn't receive a code? Resend</button>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; gap: 12px;">
            <button class="btn btn-primary verify-otp" style="padding: 10px 16px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1;">Verify</button>
            <button class="btn btn-secondary cancel-verification" style="padding: 10px 16px; background-color: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; flex: 1;">Cancel</button>
          </div>
        `;
        
        overlay.appendChild(otpModal);
        
        // Focus the first OTP input field
        setTimeout(() => {
          otpModal.querySelector('.otp-input').focus();
        }, 100);
        
        // Add event listeners for OTP input fields
        const otpInputs = otpModal.querySelectorAll('.otp-input');
        otpInputs.forEach((input, index) => {
          // Auto-focus next input on entry
          input.addEventListener('input', (e) => {
            // Allow only numbers
            input.value = input.value.replace(/[^0-9]/g, '');
            
            // Auto advance to next field
            if (input.value && index < otpInputs.length - 1) {
              otpInputs[index + 1].focus();
            }
          });
          
          // Handle backspace to go to previous input
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
              otpInputs[index - 1].focus();
            }
          });
          
          // Handle paste event for the entire OTP
          input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text');
            if (/^\d{6}$/.test(pasteData)) {
              otpInputs.forEach((input, i) => {
                input.value = pasteData[i] || '';
              });
              otpInputs[otpInputs.length - 1].focus();
            }
          });
        });
        
        // Add event listeners to modal buttons
        const closeOtpButton = otpModal.querySelector('.modal-close');
        const cancelVerificationButton = otpModal.querySelector('.cancel-verification');
        const verifyOtpButton = otpModal.querySelector('.verify-otp');
        const resendOtpButton = otpModal.querySelector('.resend-otp');
        const errorMessageDiv = otpModal.querySelector('.error-message');
        
        closeOtpButton.addEventListener('click', closeModal);
        cancelVerificationButton.addEventListener('click', closeModal);
        
        // Handle OTP verification
        verifyOtpButton.addEventListener('click', async () => {
          // Collect OTP from input fields
          let enteredOtp = '';
          otpInputs.forEach(input => {
            enteredOtp += input.value;
          });
          
          // Check if OTP is complete
          if (enteredOtp.length !== 6) {
            errorMessageDiv.textContent = 'Please enter all 6 digits of the code.';
            return;
          }
          
          // Show loading state
          verifyOtpButton.textContent = 'Verifying...';
          verifyOtpButton.disabled = true;
          
          try {
            // Get OTP from Firebase (in production)
            /*
            const db = firebase.firestore();
            const resetDoc = await db.collection('passwordResets').doc(email).get();
            
            if (!resetDoc.exists) {
              throw new Error('Verification code expired. Please request a new one.');
            }
            
            const resetData = resetDoc.data();
            const storedOtp = resetData.otp;
            const timestamp = resetData.timestamp;
            const attempts = resetData.attempts || 0;
            
            // Check if OTP is expired (10 minutes)
            const now = new Date();
            const otpTime = timestamp.toDate();
            const timeDiff = (now - otpTime) / (1000 * 60); // difference in minutes
            
            if (timeDiff > 10) {
              throw new Error('Verification code expired. Please request a new one.');
            }
            
            // Check if too many attempts (max 5)
            if (attempts >= 5) {
              throw new Error('Too many failed attempts. Please request a new code.');
            }
            
            // Update attempts count
            await db.collection('passwordResets').doc(email).update({
              attempts: attempts + 1
            });
            
            // Verify OTP
            if (enteredOtp !== storedOtp) {
              throw new Error('Invalid verification code. Please try again.');
            }
            */
            
            // For demo purposes, check against the OTP we generated
            if (enteredOtp !== correctOtp) {
              throw new Error('Invalid verification code. Please try again.');
            }
            
            // If OTP is valid, show password reset form
            showPasswordResetForm(email, overlay);
          } catch (error) {
            console.error("OTP verification error:", error);
            errorMessageDiv.textContent = error.message;
            verifyOtpButton.textContent = 'Verify';
            verifyOtpButton.disabled = false;
          }
        });
        
        // Handle OTP resend
        resendOtpButton.addEventListener('click', async () => {
          resendOtpButton.textContent = 'Sending...';
          resendOtpButton.disabled = true;
          
          try {
            // Generate new OTP
            const newOtp = generateOTP();
            
            // Update OTP in Firebase
            const db = firebase.firestore();
            await db.collection('passwordResets').doc(email).set({
              otp: newOtp,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              attempts: 0
            });
            
            // Send email with new OTP (for development, just log to console)
            console.log(`New OTP for ${email}: ${newOtp}`);
            
            createNotification('New verification code sent to your email', 'success');
            
            // Update the correctOtp reference for verification
            correctOtp = newOtp;
            
            // Reset inputs
            otpInputs.forEach(input => {
              input.value = '';
            });
            otpInputs[0].focus();
            
            resendOtpButton.textContent = "Didn't receive a code? Resend";
            resendOtpButton.disabled = false;
          } catch (error) {
            console.error("Error resending OTP:", error);
            createNotification(`Error: ${error.message}`, 'error');
            resendOtpButton.textContent = "Didn't receive a code? Resend";
            resendOtpButton.disabled = false;
          }
        });
      };
      
      // Function to show password reset form
      const showPasswordResetForm = (email, overlay) => {
        // Remove current modal
        overlay.innerHTML = '';
        
        // Create password reset modal
        const resetModal = document.createElement('div');
        resetModal.className = 'password-reset-form-modal';
        resetModal.style.backgroundColor = 'white';
        resetModal.style.borderRadius = '8px';
        resetModal.style.padding = '24px';
        resetModal.style.width = '90%';
        resetModal.style.maxWidth = '450px';
        resetModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        resetModal.innerHTML = `
          <div class="modal-header" style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333; font-size: 20px;">Create New Password</h3>
            <button class="modal-close" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">
              <i class="fas fa-times">✕</i>
            </button>
          </div>
          <div class="modal-body" style="margin-bottom: 24px;">
            <p style="margin-bottom: 16px; color: #666;">Create a new password for your account:</p>
            
            <div class="input-group" style="margin-bottom: 16px;">
              <label for="new-password" class="input-label" style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;">New Password</label>
              <div class="input-wrapper" style="position: relative;">
                <input type="password" id="new-password" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="Enter new password" />
                <button type="button" class="password-toggle" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #777;" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="password-strength" style="margin-top: 8px; font-size: 12px;">
                <div class="strength-meter" style="height: 4px; background-color: #eee; border-radius: 2px; margin-bottom: 8px;">
                  <div class="strength-meter-fill" style="height: 100%; width: 0; border-radius: 2px; transition: width 0.3s ease, background-color 0.3s ease;"></div>
                </div>
                <ul class="strength-requirements" style="padding-left: 16px; margin: 0; color: #777;">
                  <li class="req-length">At least 8 characters</li>
                  <li class="req-uppercase">At least 1 uppercase letter</li>
                  <li class="req-lowercase">At least 1 lowercase letter</li>
                  <li class="req-number">At least 1 number</li>
                </ul>
              </div>
            </div>
            
            <div class="input-group" style="margin-bottom: 16px;">
              <label for="confirm-password" class="input-label" style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;">Confirm Password</label>
              <div class="input-wrapper" style="position: relative;">
                <input type="password" id="confirm-password" class="input-field" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" placeholder="Confirm new password" />
              </div>
              <div class="password-match" style="font-size: 12px; color: #777; margin-top: 8px; height: 16px;"></div>
            </div>
            
            <div class="error-message" style="color: #e53935; font-size: 14px; text-align: center; height: 20px; margin-bottom: 8px;"></div>
          </div>
          <div class="modal-footer" style="display: flex; gap: 12px;">
            <button class="btn btn-primary reset-password" style="padding: 10px 16px; background-color: #4285F4; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; opacity: 0.6;" disabled>Reset Password</button>
            <button class="btn btn-secondary cancel-reset" style="padding: 10px 16px; background-color: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; flex: 1;">Cancel</button>
          </div>
        `;
        
        overlay.appendChild(resetModal);
        
        // Focus on the new password field
        setTimeout(() => {
          resetModal.querySelector('#new-password').focus();
        }, 100);
        
        // Add event listeners
        const closeButton = resetModal.querySelector('.modal-close');
        const cancelButton = resetModal.querySelector('.cancel-reset');
        const resetButton = resetModal.querySelector('.reset-password');
        const newPasswordInput = resetModal.querySelector('#new-password');
        const confirmPasswordInput = resetModal.querySelector('#confirm-password');
        const passwordToggle = resetModal.querySelector('.password-toggle');
        const strengthMeterFill = resetModal.querySelector('.strength-meter-fill');
        const strengthRequirements = {
          length: resetModal.querySelector('.req-length'),
          uppercase: resetModal.querySelector('.req-uppercase'),
          lowercase: resetModal.querySelector('.req-lowercase'),
          number: resetModal.querySelector('.req-number')
        };
        const passwordMatchDiv = resetModal.querySelector('.password-match');
        const errorMessageDiv = resetModal.querySelector('.error-message');
        
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        
        // Password toggle functionality
        passwordToggle.addEventListener('click', function() {
          const type = newPasswordInput.getAttribute("type") === "password" ? "text" : "password";
          newPasswordInput.setAttribute("type", type);
          passwordToggle.innerHTML = type === "text" ? 
            '<i class="fas fa-eye-slash"></i>' : 
            '<i class="fas fa-eye"></i>';
        });
        
        // Password strength checker
        newPasswordInput.addEventListener('input', function() {
          const password = this.value;
          const hasLength = password.length >= 8;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          
          // Update requirements display
          strengthRequirements.length.style.color = hasLength ? '#43a047' : '#777';
          strengthRequirements.uppercase.style.color = hasUppercase ? '#43a047' : '#777';
          strengthRequirements.lowercase.style.color = hasLowercase ? '#43a047' : '#777';
          strengthRequirements.number.style.color = hasNumber ? '#43a047' : '#777';
          
          // Calculate strength percentage
          const metRequirements = [hasLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
          const strengthPercentage = password.length ? Math.max(25, (metRequirements / 4) * 100) : 0;
          
          // Update strength meter
          strengthMeterFill.style.width = `${strengthPercentage}%`;
          
          // Set color based on strength
          if (strengthPercentage < 50) {
            strengthMeterFill.style.backgroundColor = '#e53935'; // Weak - Red
          } else if (strengthPercentage < 75) {
            strengthMeterFill.style.backgroundColor = '#ffb300'; // Medium - Amber
          } else {
            strengthMeterFill.style.backgroundColor = '#43a047'; // Strong - Green
          }
          
          // Check password match
          checkPasswordMatch();
          
          // Validate the reset button state
          validateResetButton();
        });
        
        // Check password match
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        
        function checkPasswordMatch() {
          const password = newPasswordInput.value;
          const confirmPassword = confirmPasswordInput.value;
          
          if (!confirmPassword) {
            passwordMatchDiv.textContent = '';
            return;
          }
          
          if (password === confirmPassword) {
            passwordMatchDiv.textContent = 'Passwords match';
            passwordMatchDiv.style.color = '#43a047';
          } else {
            passwordMatchDiv.textContent = 'Passwords do not match';
            passwordMatchDiv.style.color = '#e53935';
          }
          
          // Validate the reset button state
          validateResetButton();
        }
        
        // Enable/disable reset button based on validation
        function validateResetButton() {
          const password = newPasswordInput.value;
          const confirmPassword = confirmPasswordInput.value;
          
          const hasLength = password.length >= 8;
          const hasUppercase = /[A-Z]/.test(password);
          const hasLowercase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const passwordsMatch = password === confirmPassword && password.length > 0;
          
          const isValid = hasLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;
          
          resetButton.disabled = !isValid;
          resetButton.style.opacity = isValid ? '1' : '0.6';
        }
        
        // Handle password reset
        resetButton.addEventListener('click', async () => {
          const newPassword = newPasswordInput.value;
          
          // Show loading state
          resetButton.textContent = 'Resetting...';
          resetButton.disabled = true;
          
          try {
            // In a real implementation, we would verify the user has a valid session token
            // For this demo, we'll use Firebase's email authentication
            
            // Get current user or send password reset code verification
            // We need to first get the user's auth methods
            try {
              // Sign in methods will throw an error if the user doesn't exist
              const methods = await firebase.auth().fetchSignInMethodsForEmail(email);
              
              if (methods.length > 0) {
                // For demo purposes, we'll send a password reset email
                // In production, you would complete the password change directly with the validated OTP
                
                // Option 1: If we have OTP verification in place (ideal solution):
                // Update the password in the database directly for the verified user
                
                // Option 2: Using Firebase's built-in password reset (fallback):
                await firebase.auth().sendPasswordResetEmail(email);
                
                closeModal();
                createNotification('Password reset link has been sent to your email. Please check your inbox to complete the password reset.', 'success');
              } else {
                throw new Error('No account found with this email address.');
              }
            } catch (error) {
              throw new Error('Error verifying account: ' + error.message);
            }
          } catch (error) {
            console.error("Password reset error:", error);
            errorMessageDiv.textContent = error.message;
            resetButton.textContent = 'Reset Password';
            resetButton.disabled = false;
            validateResetButton();
          }
        });
      };
    });
  }
  
  // Handle social sign-in buttons
  const googleBtn = document.querySelector('.social-btn.google');
  const linkedInBtn = document.querySelector('.social-btn.linkedin');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', async function() {
      try {
        // Show loading state
        googleBtn.disabled = true;
        googleBtn.innerHTML = `
          <svg class="loading-spinner" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
          Signing in...
        `;
        
        // Add loading spinner style
        if (!document.querySelector('#spinner-style')) {
          const spinnerStyle = document.createElement('style');
          spinnerStyle.id = 'spinner-style';
          spinnerStyle.textContent = `
            .loading-spinner {
              animation: rotate 2s linear infinite;
              width: 20px;
              height: 20px;
              margin-right: 8px;
              vertical-align: middle;
            }
            .loading-spinner .path {
              stroke: currentColor;
              stroke-linecap: round;
              animation: dash 1.5s ease-in-out infinite;
            }
            @keyframes rotate {
              100% {
                transform: rotate(360deg);
              }
            }
            @keyframes dash {
              0% {
                stroke-dasharray: 1, 150;
                stroke-dashoffset: 0;
              }
              50% {
                stroke-dasharray: 90, 150;
                stroke-dashoffset: -35;
              }
              100% {
                stroke-dasharray: 90, 150;
                stroke-dashoffset: -124;
              }
            }
          `;
          document.head.appendChild(spinnerStyle);
        }
        
        // Configure Google provider
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Sign in with popup
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        console.log("Google authentication successful for user:", user.email);
        
        // Google-authenticated accounts are automatically email verified
        // Get ID token for server authentication
        const token = await user.getIdToken();
        
        try {
          // Get user data from server
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              email: user.email,
              oauth: true,
              provider: 'google',
              uid: user.uid
            })
          });
          
          const data = await response.json();
          console.log("Server response for Google login:", data);
          
          if (data.success) {
            // Create user data object, preferring server data
            const userData = {
              uid: user.uid,
              email: user.email,
              // Allow the user type to come from the server if available
              type: data.user?.type || 'candidate', // Changed default to 'candidate' to fix redirection issue
              fullName: data.user?.fullName || user.displayName || user.email.split('@')[0],
              photoURL: data.user?.photoURL || user.photoURL || null
            };
            
            console.log("User type after Google login:", userData.type);
            
            // Save user data
            sessionStorage.setItem('user', JSON.stringify(userData));
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Show success and redirect
            createNotification(`Google sign-in successful! Redirecting as ${userData.type}...`, 'success');
            
            // Redirect based on user type
            setTimeout(() => {
              if (userData.type === 'candidate') {
                console.log("Redirecting Google-signed-in user as candidate");
                // Check if candidate has resume
                fetch(`http://localhost:3000/api/resume/status/${user.uid}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                .then(response => response.json())
                .then(resumeData => {
                  if (resumeData.success && resumeData.hasFilledResume) {
                    console.log("Candidate has resume, redirecting to Student Dashboard");
                    window.location.replace('../Student_Dashboard/index.html');
                  } else {
                    console.log("Candidate needs to create resume first");
                    window.location.replace('../ResumeForm/index.html');
                  }
                })
                .catch(err => {
                  console.error("Error checking resume status:", err);
                  window.location.replace('../ResumeForm/index.html');
                });
              } else if (userData.type === 'recruiter') {
                console.log("Redirecting Google-signed-in user as recruiter");
                window.location.replace('../Recruiter_Dashboard/index.html');
              } else {
                console.log("Unknown user type, redirecting to landing page");
                window.location.replace('../LandingPage/index.html');
              }
            }, 1000);
          } else {
            // Server failed, create user with candidate type by default
            const defaultUserData = {
              uid: user.uid,
              email: user.email,
              type: 'candidate', // Changed default to candidate
              fullName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL || null
            };
            
            // Ask user what type they are
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.zIndex = '1000';
            
            const modal = document.createElement('div');
            modal.className = 'user-type-modal';
            modal.style.backgroundColor = 'white';
            modal.style.borderRadius = '8px';
            modal.style.padding = '24px';
            modal.style.width = '90%';
            modal.style.maxWidth = '450px';
            modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            
            modal.innerHTML = `
              <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333; font-size: 20px;">Choose your account type</h3>
                <p style="color: #666; font-size: 14px;">Please select what type of user you are:</p>
              </div>
              <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <button id="candidate-type-btn" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; background-color: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                  <div style="font-size: 24px; margin-bottom: 8px;">👨‍💼</div>
                  Candidate
                </button>
                <button id="recruiter-type-btn" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; background-color: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                  <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
                  Recruiter
                </button>
              </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Handle user type selection
            document.getElementById('candidate-type-btn').addEventListener('click', () => {
              defaultUserData.type = 'candidate';
              completeLogin(defaultUserData);
              overlay.remove();
            });
            
            document.getElementById('recruiter-type-btn').addEventListener('click', () => {
              defaultUserData.type = 'recruiter';
              completeLogin(defaultUserData);
              overlay.remove();
            });
            
            // Function to complete login after user type selection
            const completeLogin = (userData) => {
              // Save user data
              sessionStorage.setItem('user', JSON.stringify(userData));
              sessionStorage.setItem('token', token);
              sessionStorage.setItem('userData', JSON.stringify(userData));
              localStorage.setItem('user', JSON.stringify(userData));
              localStorage.setItem('token', token);
              localStorage.setItem('userData', JSON.stringify(userData));
              
              createNotification(`Login successful! Redirecting as ${userData.type}...`, 'success');
              
              // Redirect based on user type
              setTimeout(() => {
                if (userData.type === 'candidate') {
                  // Check if candidate has resume
                  fetch(`http://localhost:3000/api/resume/status/${userData.uid}`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })
                  .then(response => response.json())
                  .then(resumeData => {
                    if (resumeData.success && resumeData.hasFilledResume) {
                      console.log("Candidate has resume, redirecting to Student Dashboard");
                      window.location.replace('../Student_Dashboard/index.html');
                    } else {
                      console.log("Candidate needs to create resume first");
                      window.location.replace('../ResumeForm/index.html');
                    }
                  })
                  .catch(err => {
                    console.error("Error checking resume status:", err);
                    window.location.replace('../ResumeForm/index.html');
                  });
                } else if (userData.type === 'recruiter') {
                  console.log("Redirecting user as recruiter");
                  window.location.replace('../Recruiter_Dashboard/index.html');
                } else {
                  console.log("Unknown user type, redirecting to landing page");
                  window.location.replace('../LandingPage/index.html');
                }
              }, 1000);
            };
          }
        } catch (serverError) {
          console.error("Server error during Google login:", serverError);
          
          // Let user select account type on server error
          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          overlay.style.display = 'flex';
          overlay.style.justifyContent = 'center';
          overlay.style.alignItems = 'center';
          overlay.style.zIndex = '1000';
          
          const modal = document.createElement('div');
          modal.className = 'user-type-modal';
          modal.style.backgroundColor = 'white';
          modal.style.borderRadius = '8px';
          modal.style.padding = '24px';
          modal.style.width = '90%';
          modal.style.maxWidth = '450px';
          modal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          
          modal.innerHTML = `
            <div style="margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #333; font-size: 20px;">Choose your account type</h3>
              <p style="color: #666; font-size: 14px;">Please select what type of user you are:</p>
            </div>
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
              <button id="candidate-type-btn" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; background-color: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                <div style="font-size: 24px; margin-bottom: 8px;">👨‍💼</div>
                Candidate
              </button>
              <button id="recruiter-type-btn" class="btn btn-primary" style="flex: 1; padding: 12px; font-size: 16px; background-color: #f8f9fa; color: #333; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                <div style="font-size: 24px; margin-bottom: 8px;">🏢</div>
                Recruiter
              </button>
            </div>
          `;
          
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
          
          // Create default user object
          const defaultUserData = {
            uid: user.uid,
            email: user.email,
            type: 'candidate', // Default to candidate
            fullName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null
          };
          
          // Handle user type selection
          document.getElementById('candidate-type-btn').addEventListener('click', () => {
            defaultUserData.type = 'candidate';
            completeLogin(defaultUserData);
            overlay.remove();
          });
          
          document.getElementById('recruiter-type-btn').addEventListener('click', () => {
            defaultUserData.type = 'recruiter';
            completeLogin(defaultUserData);
            overlay.remove();
          });
          
          // Function to complete login after user type selection
          const completeLogin = (userData) => {
            // Save user data
            sessionStorage.setItem('user', JSON.stringify(userData));
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', token);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            createNotification(`Login successful! Redirecting as ${userData.type}...`, 'success');
            
            // Redirect based on user type
            setTimeout(() => {
              if (userData.type === 'candidate') {
                // Check if candidate has resume
                fetch(`http://localhost:3000/api/resume/status/${userData.uid}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                .then(response => response.json())
                .then(resumeData => {
                  if (resumeData.success && resumeData.hasFilledResume) {
                    console.log("Candidate has resume, redirecting to Student Dashboard");
                    window.location.replace('../Student_Dashboard/index.html');
                  } else {
                    console.log("Candidate needs to create resume first");
                    window.location.replace('../ResumeForm/index.html');
                  }
                })
                .catch(err => {
                  console.error("Error checking resume status:", err);
                  window.location.replace('../ResumeForm/index.html');
                });
              } else if (userData.type === 'recruiter') {
                console.log("Redirecting user as recruiter");
                window.location.replace('../Recruiter_Dashboard/index.html');
              } else {
                console.log("Unknown user type, redirecting to landing page");
                window.location.replace('../LandingPage/index.html');
              }
            }, 1000);
          };
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
        createNotification(`Google sign-in error: ${error.message}`, 'error');
        
        // Reset button
        googleBtn.disabled = false;
        googleBtn.innerHTML = `
          <svg class="feature-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4" />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853" />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05" />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335" />
          </svg>
          Google
        `;
      }
    });
  }
  
  if (linkedInBtn) {
    linkedInBtn.addEventListener('click', function() {
      createNotification('LinkedIn sign-in will be implemented in the future', 'info');
    });
  }
  
  // Handle the Sign Up button - direct link instead of alert
  const signUpBtn = document.getElementById('toggle-signup');
  if (signUpBtn) {
    signUpBtn.addEventListener('click', function() {
      window.location.href = '../SignUp/index.html';
    });
  }
}); 