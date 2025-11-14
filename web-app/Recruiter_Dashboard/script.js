// Main script for Recruiter Dashboard UI interactions
document.addEventListener('DOMContentLoaded', function() {
  console.log('Recruiter Dashboard script loaded');
  
  // Apply styling to improve aesthetics
  applyVisualEffects();
  
  // Add any UI interactions not related to Firebase
  setupUIInteractions();
  
  // Make sure we have access to the createNotification function
  if (typeof createNotification !== 'function') {
    window.createNotification = function(message, type = 'info') {
      console.log(`Notification (${type}): ${message}`);
      // If the actual function isn't available, use alert as fallback
      if (type === 'error') {
        alert(`Error: ${message}`);
      } else if (message && message.length > 0 && type !== 'success') {
        alert(message);
      }
    };
  }
});

// Apply visual effects to improve UI aesthetics
function applyVisualEffects() {
  // Add subtle hover effects to interactive elements
  const interactiveElements = document.querySelectorAll('.job-card, .sidebar-link, .dropdown-item, button');
  
  interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transition = 'transform 0.2s ease-out';
      
      // Don't apply transform to buttons that already have it in CSS
      if (!this.classList.contains('primary-button') && 
          !this.classList.contains('secondary-button')) {
        this.style.transform = 'translateY(-2px)';
      }
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // Add active state to clicked elements for better feedback
  document.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON' || 
        e.target.classList.contains('sidebar-link') || 
        e.target.classList.contains('dropdown-item')) {
      
      e.target.style.transform = 'scale(0.98)';
      
      // Reset after click
      setTimeout(() => {
        e.target.style.transform = '';
      }, 150);
    }
  });
}

// Set up UI interactions not handled by Firebase client
function setupUIInteractions() {
  // Mobile responsiveness for sidebar
  const sidebar = document.querySelector('.sidebar');
  const mainPanel = document.querySelector('.main-panel');
  
  if (sidebar && mainPanel && window.innerWidth <= 768) {
    // For mobile, expand sidebar when clicked and collapse when main panel is clicked
    sidebar.addEventListener('click', function(e) {
      if (e.target.closest('.sidebar-link')) {
        // If clicking a link, don't keep sidebar expanded
        return;
      }
      
      this.classList.toggle('expanded');
    });
    
    mainPanel.addEventListener('click', function() {
      sidebar.classList.remove('expanded');
    });
  }
  
  // Form validation for job creation
  const jobForm = document.getElementById('job-creation-form');
  if (jobForm) {
    const requiredFields = jobForm.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      field.addEventListener('input', function() {
        validateField(this);
      });
      
      field.addEventListener('blur', function() {
        validateField(this);
      });
    });
    
    jobForm.addEventListener('submit', function(e) {
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        showValidationMessage('Please fill in all required fields correctly.');
      }
    });
  }
  
  // Date validation for deadline field
  const deadlineField = document.getElementById('application-deadline');
  if (deadlineField) {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    deadlineField.setAttribute('min', today);
    
    deadlineField.addEventListener('input', function() {
      const selectedDate = new Date(this.value);
      const currentDate = new Date();
      
      if (selectedDate < currentDate && this.value !== '') {
        this.setCustomValidity('Application deadline cannot be in the past.');
        showFieldError(this, 'Application deadline cannot be in the past.');
      } else {
        this.setCustomValidity('');
        clearFieldError(this);
      }
    });
  }
}

// Validate a form field
function validateField(field) {
  if (field.validity.valueMissing) {
    showFieldError(field, 'This field is required.');
    return false;
  } else if (field.validity.typeMismatch) {
    showFieldError(field, 'Please enter a valid value.');
    return false;
  } else if (field.validity.patternMismatch) {
    showFieldError(field, 'Please match the requested format.');
    return false;
  } else if (field.validity.customError) {
    // Custom error is already set
    return false;
  } else {
    clearFieldError(field);
    return true;
  }
}

// Show error message for a field
function showFieldError(field, message) {
  // Remove any existing error message
  clearFieldError(field);
  
  // Add error class to field
  field.classList.add('error-field');
  
  // Create error message element
  const errorMessage = document.createElement('div');
  errorMessage.className = 'field-error';
  errorMessage.textContent = message;
  
  // Insert after the field
  field.parentNode.insertBefore(errorMessage, field.nextSibling);
}

// Clear error message for a field
function clearFieldError(field) {
  field.classList.remove('error-field');
  
  // Remove any existing error message
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// Show a general validation message
function showValidationMessage(message) {
  // Check if notification system exists from firebase-client.js
  if (typeof createNotification === 'function') {
    createNotification(message, 'error');
    return;
  }
  
  // Fallback if notification system is not available
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;
  
  const notification = document.createElement('div');
  notification.className = 'notification error';
  
  notification.innerHTML = `
    <div class="notification-title">
      <i class="fas fa-exclamation-circle"></i>
      Validation Error
    </div>
    <div class="notification-message">${message}</div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  notificationContainer.appendChild(notification);
  
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Function to show job applicants
async function showJobApplicants(jobId) {
    if (!jobId) return;
    
    try {
        // Get the job data
        const jobRef = firebase.firestore().collection("jobs").doc(jobId);
        const jobDoc = await jobRef.get();
        
        if (!jobDoc.exists) {
            console.error("Job not found");
            return;
        }
        
        const jobData = jobDoc.data();
        const applicants = jobData.applicants || [];
        
        // Display the job title and details
        const applicantsView = document.getElementById("applicants-view");
        const applicantsList = document.getElementById("applicants-list");
        
        // Clear previous content
        applicantsList.innerHTML = "";
        
        // Show the applicants view
        document.getElementById("jobs-list-view").style.display = "none";
        document.getElementById("job-form-view").style.display = "none";
        applicantsView.style.display = "block";
        
        // Set job title
        document.getElementById("applicants-job-title").textContent = jobData.title || "Job Applicants";
        
        // If no applicants, show empty state
        if (!applicants.length) {
            applicantsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No applicants for this job yet.</p>
                </div>
            `;
            return;
        }
        
        // Show loading state
        applicantsList.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading applicants...</p>
            </div>
        `;
        
        // Fetch each applicant's user data, application scores, and quiz scores
        const userPromises = applicants.map(userId => 
            firebase.firestore().collection("users").doc(userId).get()
        );
        
        const applicationPromises = applicants.map(userId =>
            firebase.firestore().collection("applications").where("userId", "==", userId).get()
        );
        
        const quizPromises = applicants.map(userId =>
            firebase.firestore().collection("quizResults").where("userId", "==", userId).get()
        );
        
        // Wait for all promises to resolve
        const [userDocs, applicationResults, quizResults] = await Promise.all([
            Promise.all(userPromises),
            Promise.all(applicationPromises),
            Promise.all(quizPromises)
        ]);
        
        // Process user data and create applicant cards
        applicantsList.innerHTML = "";
        
        userDocs.forEach((userDoc, index) => {
            if (!userDoc.exists) return;
            
            const userData = userDoc.data();
            const applicantId = userDoc.id;
            
            // Get application score (overall_score) from evaluationResults field
            let overallScore = "N/A";
            const applicationDocs = applicationResults[index];
            if (!applicationDocs.empty) {
                applicationDocs.forEach(doc => {
                    const appData = doc.data();
                    // Check if evaluationResults exists and has overall_score
                    if (appData.evaluationResults && appData.evaluationResults.overall_score !== undefined) {
                        overallScore = appData.evaluationResults.overall_score;
                    }
                });
            }
            
            // Get quiz score
            let quizScore = "N/A";
            const quizDocs = quizResults[index];
            if (!quizDocs.empty) {
                quizDocs.forEach(doc => {
                    const quizData = doc.data();
                    if (quizData.score !== undefined) {
                        quizScore = quizData.score;
                    }
                });
            }
            
            // Create applicant card
            const applicantCard = document.createElement("div");
            applicantCard.className = "applicant-card";
            
            applicantCard.innerHTML = `
                <div class="applicant-info">
                    <div class="applicant-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="applicant-details">
                        <h3 class="applicant-name">${userData.fullName || userData.displayName || "Applicant"}</h3>
                        <p class="applicant-email">${userData.email || "No email"}</p>
                        <div class="applicant-scores">
                            <span class="score-item"><i class="fas fa-star"></i> Overall Score: ${overallScore}</span>
                            <span class="score-item"><i class="fas fa-check-circle"></i> Quiz Score: ${quizScore}</span>
                        </div>
                    </div>
                </div>
                <div class="applicant-actions">
                    <button class="view-resume-btn" data-user-id="${applicantId}">
                        <i class="fas fa-file-alt"></i> View Resume
                    </button>
                    <button class="contact-btn" data-email="${userData.email}">
                        <i class="fas fa-envelope"></i> Contact
                    </button>
                </div>
            `;
            
            // Add event listeners
            const viewResumeBtn = applicantCard.querySelector(".view-resume-btn");
            viewResumeBtn.addEventListener("click", function() {
                const userId = this.getAttribute("data-user-id");
                viewApplicantResume(userId);
            });
            
            const contactBtn = applicantCard.querySelector(".contact-btn");
            contactBtn.addEventListener("click", function() {
                const email = this.getAttribute("data-email");
                window.location.href = `mailto:${email}?subject=Regarding your application for ${jobData.title}`;
            });
            
            applicantsList.appendChild(applicantCard);
        });
        
        // Add back button event listener
        const backButton = applicantsView.querySelector(".back-button");
        if (backButton) {
            backButton.addEventListener("click", function() {
                applicantsView.style.display = "none";
                document.getElementById("jobs-list-view").style.display = "block";
            });
        }
        
    } catch (error) {
        console.error("Error loading applicants:", error);
        document.getElementById("applicants-list").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading applicants: ${error.message}</p>
            </div>
        `;
    }
}

// Function to view an applicant's resume
async function viewApplicantResume(userId) {
    if (!userId) {
        console.error("No user ID provided");
        createNotification("User ID is missing", "error");
        return;
    }
    
    try {
        console.log("Fetching resume for user:", userId);
        
        // Find the user's resume - Using correct collection name and query
        const resumeRef = firebase.firestore().collection("resumes");
        // Try to get resume by userId field first
        let resumeSnapshot = await resumeRef.where("userId", "==", userId).get();
        
        // If no results, try with user_id field (different naming convention)
        if (resumeSnapshot.empty) {
            resumeSnapshot = await resumeRef.where("user_id", "==", userId).get();
        }
        
        console.log("Resume query result:", resumeSnapshot.empty ? "No results" : `${resumeSnapshot.size} results`);
        
        if (resumeSnapshot.empty) {
            // Also try checking the users collection directly for resume data
            const userDoc = await firebase.firestore().collection("users").doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            if (userData && userData.resume) {
                // User has resume data embedded in their user document
                displayResumeModal(userData.resume);
            } else {
                console.error("No resume found for this applicant");
                createNotification("No resume found for this applicant", "error");
            }
            return;
        }
        
        const resumeData = resumeSnapshot.docs[0].data();
        console.log("Resume data:", resumeData);
        
        // Display the resume in a modal
        displayResumeModal(resumeData);
        
    } catch (error) {
        console.error("Error viewing resume:", error);
        createNotification("Error viewing resume: " + error.message, "error");
    }
}

// Helper function to display resume data in a modal
function displayResumeModal(resumeData) {
    // Create a modal to display the resume
    const resumeModal = document.createElement("div");
    resumeModal.className = "modal resume-modal";
    resumeModal.style.display = "block";
    
    // Format the resume data
    const education = resumeData.education && resumeData.education.length
        ? resumeData.education.map(edu => `
            <div class="resume-item">
                <p><strong>Institution:</strong> ${edu.institution || "Not specified"}</p>
                <p><strong>Degree:</strong> ${edu.degree || "Not specified"}</p>
                <p><strong>Field of Study:</strong> ${edu.fieldOfStudy || edu.major || "Not specified"}</p>
                <p><strong>Graduation Year:</strong> ${edu.graduationYear || "Not specified"}</p>
            </div>
        `).join("")
        : "<p>No education information provided</p>";
        
    const experience = resumeData.experience && resumeData.experience.length
        ? resumeData.experience.map(exp => `
            <div class="resume-item">
                <p><strong>Company:</strong> ${exp.company || "Not specified"}</p>
                <p><strong>Position:</strong> ${exp.position || "Not specified"}</p>
                <p><strong>Duration:</strong> ${exp.startDate || "Not specified"} - ${exp.endDate || "Present"}</p>
                <p><strong>Description:</strong> ${exp.description || "Not specified"}</p>
            </div>
        `).join("")
        : "<p>No experience information provided</p>";
    
    // Handle various formats of skills data
    let skills = "<p>No skills information provided</p>";
    if (resumeData.skills) {
        if (Array.isArray(resumeData.skills)) {
            // If skills is an array, display as tags
            skills = `<div class="skills-list">${resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join("")}</div>`;
        } else if (typeof resumeData.skills === 'string') {
            // If skills is a string (comma-separated), split and display as tags
            const skillsArray = resumeData.skills.split(',').map(s => s.trim()).filter(s => s);
            if (skillsArray.length) {
                skills = `<div class="skills-list">${skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join("")}</div>`;
            }
        } else if (typeof resumeData.skills === 'object') {
            // If skills is an object, extract values
            const skillsArray = Object.values(resumeData.skills).filter(s => typeof s === 'string');
            if (skillsArray.length) {
                skills = `<div class="skills-list">${skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join("")}</div>`;
            }
        }
    }
        
    const projects = resumeData.projects && resumeData.projects.length
        ? resumeData.projects.map(project => `
            <div class="resume-item">
                <p><strong>Name:</strong> ${project.name || project.title || "Not specified"}</p>
                <p><strong>Description:</strong> ${project.description || "Not specified"}</p>
                <p><strong>Skills:</strong> ${Array.isArray(project.skills) ? project.skills.join(", ") : (project.skills || "Not specified")}</p>
            </div>
        `).join("")
        : "<p>No projects information provided</p>";
    
    resumeModal.innerHTML = `
        <div class="modal-content resume-modal-content">
            <div class="modal-header">
                <h2>Applicant Resume</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="resume-section">
                    <h3>Personal Information</h3>
                    <div class="personal-info">
                        <p><strong>Name:</strong> ${resumeData.personal?.name || resumeData.name || "Not specified"}</p>
                        <p><strong>Phone:</strong> ${resumeData.personal?.phone || resumeData.phone || "Not specified"}</p>
                        <p><strong>Email:</strong> ${resumeData.personal?.email || resumeData.email || "Not specified"}</p>
                    </div>
                </div>
                
                <div class="resume-section">
                    <h3>Education</h3>
                    <div class="education-list">
                        ${education}
                    </div>
                </div>
                
                <div class="resume-section">
                    <h3>Experience</h3>
                    <div class="experience-list">
                        ${experience}
                    </div>
                </div>
                
                <div class="resume-section">
                    <h3>Skills</h3>
                    ${skills}
                </div>
                
                <div class="resume-section">
                    <h3>Projects</h3>
                    <div class="projects-list">
                        ${projects}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-resume-btn">Close</button>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(resumeModal);
    
    // Add event listeners
    resumeModal.querySelector(".close-modal").addEventListener("click", function() {
        resumeModal.remove();
    });
    
    resumeModal.querySelector(".close-resume-btn").addEventListener("click", function() {
        resumeModal.remove();
    });
    
    // Close when clicking outside the modal content
    resumeModal.addEventListener("click", function(event) {
        if (event.target === resumeModal) {
            resumeModal.remove();
        }
    });
}

// Modify renderJobs function to add "View Applicants" button
function renderJobs(jobs) {
    const jobsList = document.getElementById("jobs-list");
    jobsList.innerHTML = "";
    
    if (jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <p>No jobs found. Click "Create New Job" to add your first job listing.</p>
            </div>
        `;
        return;
    }
    
    jobs.forEach(job => {
        const jobCard = document.createElement("div");
        jobCard.className = "job-card";
        
        // Get applicant count
        const applicantCount = job.applicants ? job.applicants.length : 0;
        
        jobCard.innerHTML = `
            <div class="job-card-header">
                <h3 class="job-title">${job.title}</h3>
                <span class="applicant-count">
                    <i class="fas fa-users"></i> ${applicantCount} Applicant${applicantCount !== 1 ? 's' : ''}
                </span>
            </div>
            <p class="job-description">${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}</p>
            <div class="job-meta">
                <span class="job-meta-item">
                    <i class="fas fa-briefcase"></i> ${job.experienceRequired || 'Not specified'}
                </span>
                <span class="job-meta-item">
                    <i class="fas fa-graduation-cap"></i> ${job.requiredDegree || 'Not specified'}
                </span>
                <span class="job-meta-item">
                    <i class="fas fa-calendar-alt"></i> ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline'}
                </span>
            </div>
            <div class="job-actions">
                <button class="view-applicants-btn" data-job-id="${job.id}">
                    <i class="fas fa-users"></i> View Applicants
                </button>
                <button class="edit-job-btn" data-job-id="${job.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-job-btn" data-job-id="${job.id}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
        
        // Add event listeners
        const viewApplicantsBtn = jobCard.querySelector(".view-applicants-btn");
        viewApplicantsBtn.addEventListener("click", function() {
            const jobId = this.getAttribute("data-job-id");
            showJobApplicants(jobId);
        });
        
        // Add existing edit and delete event listeners
        // ...
        
        jobsList.appendChild(jobCard);
    });
} 