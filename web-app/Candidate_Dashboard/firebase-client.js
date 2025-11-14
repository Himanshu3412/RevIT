// Firebase client-side integration for Candidate Dashboard

// Global variable for currentUser
window.currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase client script loaded for Candidate Dashboard');

    // Initialize Firebase with the same config as other pages
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

    // Create elegant notification system (same as in other pages)
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

    // Make createNotification function globally available
    window.createNotification = createNotification;

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

          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            overflow-y: auto;
            padding: 2rem 0;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .modal.active {
            display: block;
            opacity: 1;
          }
          
          .modal-content {
            background-color: white;
            max-width: 500px;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            transform: translateY(-20px);
            transition: transform 0.3s ease;
          }
          
          .modal.active .modal-content {
            transform: translateY(0);
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .modal-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          
          .close-modal {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 1.25rem;
            cursor: pointer;
            transition: color 0.2s ease;
          }
          
          .close-modal:hover {
            color: #111827;
          }
          
          .modal-body {
            padding: 1.5rem;
          }
          
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
          }
          
          @media (max-width: 640px) {
            .modal-content {
              max-width: 90%;
              margin: 0 auto;
            }
          }
        `;
        document.head.appendChild(styleSheet);
    }

    // CSS for editing resume
    if (!document.querySelector('#resume-edit-styles')) {
        const resumeEditStyles = document.createElement('style');
        resumeEditStyles.id = 'resume-edit-styles';
        resumeEditStyles.textContent = `
          .resume-editable {
            padding: 2px 4px;
            border-radius: 3px;
            transition: background-color 0.2s ease;
          }
          
          .resume-editable.editing {
            background-color: rgba(59, 130, 246, 0.1);
            border: 1px dashed #3b82f6;
            min-width: 30px;
            display: inline-block;
          }
          
          .resume-editable.editing:focus {
            outline: none;
            background-color: rgba(59, 130, 246, 0.2);
            border: 1px solid #3b82f6;
          }

          /* Resume view styles */
          .resume-section {
            margin-bottom: 1.5rem;
          }
          
          .education-item, .experience-item, .project-item {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .education-item:last-child, .experience-item:last-child, .project-item:last-child {
            border-bottom: none;
          }
        `;
        document.head.appendChild(resumeEditStyles);
    }

    // Auth state listener
    const authStateListener = firebase.auth().onAuthStateChanged(async function(user) {
        if (user) {
            console.log('User is signed in:', user.email);
            
            // Set the global currentUser
            window.currentUser = user;
            
            // Check if the user is a candidate (type === 'candidate')
            try {
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    if (userData.type !== 'candidate') {
                        // Not a candidate, redirect to appropriate dashboard
                        console.log('User is not a candidate, redirecting...');
                        if (userData.type === 'recruiter') {
                            window.location.href = '../Recruiter_Dashboard/index.html';
                        } else {
                            // Unknown user type, redirect to login
                            firebase.auth().signOut();
                            window.location.href = '../Login/index.html';
                        }
                        return;
                    }
                    
                    // User is a candidate, dispatch event for script.js to handle
                    console.log('User is a candidate, dispatching auth event...');
                    const authEvent = new CustomEvent('userAuthenticated', { detail: user });
                    document.dispatchEvent(authEvent);
                } else {
                    // User document not found in Firestore
                    console.error('User document not found in Firestore');
                    createNotification('User profile not found. Please contact support.', 'error');
                    setTimeout(() => {
                        firebase.auth().signOut();
                        window.location.href = '../Login/index.html';
                    }, 3000);
                    return;
                }
            } catch (error) {
                console.error('Error checking user type:', error);
                createNotification('Error verifying your account: ' + error.message, 'error');
            }
        } else {
            // No user is signed in, redirect to login page
            console.log('No user signed in, redirecting to login page...');
            window.location.href = '../Login/index.html';
        }
    });
    
    // Detach auth listener when the page is unloaded
    window.addEventListener('beforeunload', () => {
        if (authStateListener) {
            authStateListener();
        }
    });
});

// Additional styles for jobs and the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS for jobs list and details
    const jobsStyles = document.createElement('style');
    jobsStyles.textContent = `
        /* Job Card Badge */
        .job-applied-tag {
            background-color: #10b981;
            color: white;
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
            border-radius: 9999px;
            font-weight: 500;
        }

        /* Skill Tags */
        .skill-tag {
            background-color: #f3f4f6;
            color: #4b5563;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            display: inline-block;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }

        /* Job Details Sections */
        .job-details p {
            margin-bottom: 1rem;
            line-height: 1.6;
        }

        /* Applied Jobs View */
        .applied-job-description {
            margin-top: 0.75rem;
            color: #6b7280;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        /* Make the whole job card clickable */
        .job-card {
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        
        .job-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
    `;
    document.head.appendChild(jobsStyles);

    // Add animation for panel transitions
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        /* Panel transitions */
        .dashboard-overview, .resume-view, .applied-jobs-view, .profile-view {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(animationStyles);
});

// Debug function to check if jobs are being loaded
window.debugJobs = async function() {
    try {
        console.log("Debugging jobs collection...");
        
        // Check if Firebase is initialized
        if (!firebase.apps.length) {
            console.error("Firebase not initialized");
            return;
        }
        
        // Try to fetch jobs collection
        const jobsRef = firebase.firestore().collection("jobs");
        const snapshot = await jobsRef.get();
        
        console.log("Jobs collection access successful");
        console.log("Number of documents:", snapshot.size);
        
        if (snapshot.empty) {
            console.log("No jobs found in the collection");
        } else {
            // Log the first job as a sample
            const firstJob = snapshot.docs[0].data();
            console.log("Sample job:", { id: snapshot.docs[0].id, ...firstJob });
        }
        
        return {
            success: true,
            count: snapshot.size,
            sample: snapshot.empty ? null : snapshot.docs[0].data()
        };
    } catch (error) {
        console.error("Error debugging jobs:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Immediately run a check when the page loads
setTimeout(() => {
    if (firebase.apps.length) {
        console.log("Checking jobs collection on page load...");
        window.debugJobs()
            .then(result => {
                if (!result.success || (result.success && result.count === 0)) {
                    // Add a sample job if none exists
                    const db = firebase.firestore();
                    db.collection("jobs").add({
                        title: "Sample Frontend Developer",
                        company: "RecruitAI",
                        description: "This is a sample job posting to test the system.",
                        requiredSkills: "JavaScript, HTML, CSS, React",
                        experienceRequired: "1-3 years",
                        requiredDegree: "Bachelor's in Computer Science",
                        requiredMajor: "Computer Science",
                        applicationDeadline: new Date().toISOString().split('T')[0],
                        numberOfOpenings: 2,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(docRef => {
                        console.log("Added sample job with ID:", docRef.id);
                        // Force reload the dashboard
                        if (typeof loadDashboard === 'function') {
                            loadDashboard();
                        } else {
                            console.log("loadDashboard function not available");
                            setTimeout(() => window.location.reload(), 2000);
                        }
                    }).catch(error => {
                        console.error("Error adding sample job:", error);
                    });
                }
            });
    }
}, 3000);