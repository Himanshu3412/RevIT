// DOM Elements and initialization
document.addEventListener("DOMContentLoaded", function () {
    // Initialize the current user
    let currentUser = null;
    let userResume = null;
    let jobsData = [];
    let appliedJobs = [];
    let selectedJobId = null;

    // Panel visibility controls
    const panels = {
        jobsDashboard: document.getElementById("jobs-dashboard-view"),
        resume: document.getElementById("resume-view"),
        appliedJobs: document.getElementById("applied-jobs-view"),
        profile: document.getElementById("profile-view")
    };

    // Navigation handlers
    document.getElementById("home-link").addEventListener("click", function (e) {
        e.preventDefault();
        showPanel("jobsDashboard");
        toggleActiveNavItem(this.parentElement);
    });

    document.getElementById("resume-link").addEventListener("click", function (e) {
        e.preventDefault();
        showPanel("resume");
        toggleActiveNavItem(this.parentElement);
        loadUserResume();
    });

    document.getElementById("applied-jobs-link").addEventListener("click", function (e) {
        e.preventDefault();
        showPanel("appliedJobs");
        toggleActiveNavItem(this.parentElement);
        loadAppliedJobs();
    });

    document.getElementById("view-profile").addEventListener("click", function (e) {
        e.preventDefault();
        showPanel("profile");
        toggleActiveNavItem(document.getElementById("home-link").parentElement);
        loadUserProfile();
    });

    document.getElementById("logout-button").addEventListener("click", function (e) {
        e.preventDefault();
        logoutUser();
    });

    // Search functionality
    document.getElementById("search-button").addEventListener("click", function () {
        const searchQuery = document.getElementById("job-search").value.trim().toLowerCase();
        filterJobs(searchQuery);
    });

    document.getElementById("job-search").addEventListener("keyup", function (e) {
        if (e.key === "Enter") {
            const searchQuery = this.value.trim().toLowerCase();
            filterJobs(searchQuery);
        }
    });

    // Resume edit controls
    document.getElementById("edit-resume").addEventListener("click", function () {
        makeResumeEditable(true);
    });

    document.getElementById("save-resume-changes").addEventListener("click", function () {
        saveResumeChanges();
    });

    // Modal handling
    const modals = document.querySelectorAll(".modal");
    const closeButtons = document.querySelectorAll(".close-modal, .cancel-modal");

    closeButtons.forEach(button => {
        button.addEventListener("click", function () {
            modals.forEach(modal => {
                modal.classList.remove("active");
            });
        });
    });

    // Password change form handling
    document.getElementById("change-password-btn").addEventListener("click", function () {
        const modal = document.getElementById("password-change-modal");
        modal.classList.add("active");
    });

    document.getElementById("password-change-form").addEventListener("submit", function (e) {
        e.preventDefault();
        changeUserPassword();
    });

    // Function to show a specific panel and hide others
    function showPanel(panelName) {
        Object.keys(panels).forEach(key => {
            if (panels[key]) {
                panels[key].style.display = key === panelName ? "block" : "none";
            }
        });
    }

    // Toggle active state in navigation
    function toggleActiveNavItem(item) {
        document.querySelectorAll(".sidebar-item").forEach(navItem => {
            navItem.classList.remove("active");
        });
        if (item) {
            item.classList.add("active");
        }
    }

    // Function to filter jobs based on search query
    function filterJobs(query) {
        if (!query) {
            renderJobs(jobsData);
            return;
        }

        const filtered = jobsData.filter(job => {
            return (
                job.title.toLowerCase().includes(query) ||
                job.company.toLowerCase().includes(query) ||
                (job.requiredSkills && job.requiredSkills.toLowerCase().includes(query))
            );
        });

        renderJobs(filtered);
    }

    // Function to check if user has a resume and redirect if needed
    async function checkResumeAndRedirect() {
        if (!currentUser) return;

        try {
            const userResumesRef = firebase.firestore().collection("resumes");
            const snapshot = await userResumesRef.where("userId", "==", currentUser.uid).get();
            
            if (snapshot.empty) {
                // User doesn't have a resume, redirect to ResumeForm
                window.location.href = "../ResumeForm/index.html";
            } else {
                // User has a resume, load the dashboard
                userResume = snapshot.docs[0].data();
                userResume.id = snapshot.docs[0].id;
                loadDashboard();
            }
        } catch (error) {
            console.error("Error checking resume:", error);
            createNotification("Error checking resume: " + error.message, "error");
        }
    }

    // Function to load the dashboard data
    async function loadDashboard() {
        try {
            console.log("Loading dashboard data...");
            const jobsList = document.getElementById("jobs-list");
            
            // Show loading state
            jobsList.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading available jobs...</p>
                </div>
            `;
            
            // Load jobs from Firestore
            console.log("Fetching jobs from Firestore...");
            const jobsRef = firebase.firestore().collection("jobs");
            const snapshot = await jobsRef.get();
            
            console.log("Jobs snapshot received:", snapshot.size, "documents");
            
            if (snapshot.empty) {
                console.log("No jobs found in the database");
                jobsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-briefcase"></i>
                        <p>No jobs available at this time.</p>
                    </div>
                `;
                
                // Add a sample job for testing
                try {
                    console.log("Adding a sample job...");
                    const sampleJobRef = await firebase.firestore().collection("jobs").add({
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
                    });
                    console.log("Sample job added with ID:", sampleJobRef.id);
                    
                    // Reload the dashboard after adding sample job
                    setTimeout(() => loadDashboard(), 1000);
                } catch (error) {
                    console.error("Error adding sample job:", error);
                }
                
                return;
            }
            
            // Map the job documents to an array
            jobsData = [];
            snapshot.forEach(doc => {
                jobsData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log("Loaded jobs:", jobsData.length);
            
            // Load applied jobs
            await loadAppliedJobsData();
            
            // Render jobs
            renderJobs(jobsData);
        } catch (error) {
            console.error("Error loading dashboard:", error);
            createNotification("Error loading jobs: " + error.message, "error");
            
            // Show error state
            document.getElementById("jobs-list").innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading jobs: ${error.message}</p>
                    <button id="retry-load" class="primary-button" style="margin-top: 1rem;">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                </div>
            `;
            
            // Add retry button functionality
            document.getElementById("retry-load")?.addEventListener("click", () => {
                loadDashboard();
            });
        }
    }

    // Function to load user's applied jobs
    async function loadAppliedJobsData() {
        if (!currentUser) return;

        try {
            const applicationsRef = firebase.firestore().collection("applications");
            const snapshot = await applicationsRef.where("candidateId", "==", currentUser.uid).get();
            
            appliedJobs = snapshot.docs.map(doc => {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            });
        } catch (error) {
            console.error("Error loading applied jobs:", error);
        }
    }

    // Function to render jobs in the jobs list
    async function renderJobs(jobs) {
        const jobsList = document.getElementById("jobs-list");
        
        if (!jobs.length) {
            jobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No jobs found. Try a different search term.</p>
                </div>
            `;
            return;
        }
        
        jobsList.innerHTML = "";
        
        // Get company names for all jobs
        const recruiterEmails = jobs.map(job => job.recruiterEmail).filter(Boolean);
        let companyNameMap = {};
        
        if (recruiterEmails.length > 0) {
            try {
                const recruitersRef = firebase.firestore().collection("recruiters");
                const recruiterSnapshots = await Promise.all(
                    recruiterEmails.map(email => 
                        recruitersRef.where("email", "==", email).get()
                    )
                );
                
                recruiterSnapshots.forEach((snapshot, index) => {
                    if (!snapshot.empty) {
                        const recruiterData = snapshot.docs[0].data();
                        companyNameMap[recruiterEmails[index]] = recruiterData.company || 'Company Name';
                    }
                });
            } catch (error) {
                console.error("Error fetching company names:", error);
            }
        }
        
        jobs.forEach(job => {
            const isApplied = appliedJobs.some(application => application.jobId === job.id);
            const companyName = job.recruiterEmail && companyNameMap[job.recruiterEmail] 
                ? companyNameMap[job.recruiterEmail] 
                : (job.company || 'Company Name');
            
            const jobCard = document.createElement("div");
            jobCard.className = `job-card ${selectedJobId === job.id ? 'selected' : ''}`;
            jobCard.dataset.id = job.id;
            
            jobCard.innerHTML = `
                <div class="job-card-header">
                    <h3 class="job-title">${job.title}</h3>
                    ${isApplied ? '<span class="job-applied-tag">Applied</span>' : ''}
                </div>
                <p class="job-company">${companyName}</p>
                <div class="job-meta">
                    <span class="job-meta-item">
                        <i class="fas fa-briefcase"></i> ${job.experienceRequired || 'Not specified'}
                    </span>
                    <span class="job-meta-item">
                        <i class="fas fa-graduation-cap"></i> ${job.requiredDegree || 'Not specified'}
                    </span>
                </div>
            `;
            
            jobCard.addEventListener("click", function() {
                selectedJobId = job.id;
                document.querySelectorAll('.job-card').forEach(card => {
                    card.classList.remove('selected');
                });
                this.classList.add('selected');
                renderJobDetails(job, companyName);
            });
            
            jobsList.appendChild(jobCard);
        });
        
        // If there was a selected job, keep it selected
        if (selectedJobId) {
            const selectedJob = jobs.find(job => job.id === selectedJobId);
            if (selectedJob) {
                const companyName = selectedJob.recruiterEmail && companyNameMap[selectedJob.recruiterEmail] 
                    ? companyNameMap[selectedJob.recruiterEmail] 
                    : (selectedJob.company || 'Company Name');
                renderJobDetails(selectedJob, companyName);
            } else if (jobs.length > 0) {
                // If the selected job is no longer in the list, select the first one
                selectedJobId = jobs[0].id;
                const companyName = jobs[0].recruiterEmail && companyNameMap[jobs[0].recruiterEmail] 
                    ? companyNameMap[jobs[0].recruiterEmail] 
                    : (jobs[0].company || 'Company Name');
                renderJobDetails(jobs[0], companyName);
                document.querySelector('.job-card').classList.add('selected');
            }
        } else if (jobs.length > 0) {
            // If no job was selected, select the first one
            selectedJobId = jobs[0].id;
            const companyName = jobs[0].recruiterEmail && companyNameMap[jobs[0].recruiterEmail] 
                ? companyNameMap[jobs[0].recruiterEmail] 
                : (jobs[0].company || 'Company Name');
            renderJobDetails(jobs[0], companyName);
            document.querySelector('.job-card').classList.add('selected');
        }
    }

    // Function to render job details
    function renderJobDetails(job, companyName) {
        const jobDetails = document.getElementById("job-details");
        const isApplied = appliedJobs.some(application => application.jobId === job.id);
        
        // If companyName was not passed, try to use job.company or default
        if (!companyName) {
            companyName = job.company || 'Company Name';
        }
        
        jobDetails.innerHTML = `
            <div class="job-details-header">
                <h2 class="job-details-title">${job.title}</h2>
                <p class="job-details-company">${companyName}</p>
                <div class="job-details-meta">
                    <span class="job-details-meta-item">
                        <i class="fas fa-briefcase"></i> Experience: ${job.experienceRequired || 'Not specified'}
                    </span>
                    <span class="job-details-meta-item">
                        <i class="fas fa-graduation-cap"></i> Degree: ${job.requiredDegree || 'Not specified'}
                    </span>
                    <span class="job-details-meta-item">
                        <i class="fas fa-user-graduate"></i> Major: ${job.requiredMajor || 'Not specified'}
                    </span>
                    <span class="job-details-meta-item">
                        <i class="fas fa-calendar-alt"></i> Deadline: ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not specified'}
                    </span>
                </div>
            </div>

            <div class="job-details-section">
                <h3 class="job-details-section-title">Job Description</h3>
                <p>${job.description || 'No description provided.'}</p>
            </div>

            <div class="job-details-section">
                <h3 class="job-details-section-title">Required Skills</h3>
                <div class="skills-list">
                    ${job.requiredSkills ? job.requiredSkills.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('') : 'No specific skills required.'}
                </div>
            </div>

            <div class="job-details-actions">
                ${isApplied ? 
                    '<button class="applied-badge" disabled><i class="fas fa-check"></i> Applied</button>' : 
                    '<button class="apply-button" id="apply-job-button"><i class="fas fa-paper-plane"></i> Apply</button>'
                }
            </div>
        `;
        
        // Add event listener to apply button if not already applied
        if (!isApplied) {
            const applyButton = document.getElementById("apply-job-button");
            if (applyButton) {
                applyButton.addEventListener("click", function() {
                    openJobApplicationModal(job);
                });
            }
        }
    }

    // Function to open job application modal
    function openJobApplicationModal(job) {
        const modal = document.getElementById("job-application-modal");
        modal.classList.add("active");
        
        const form = document.getElementById("job-application-form");
        form.dataset.jobId = job.id;
        
        form.addEventListener("submit", submitJobApplication);
    }

    // Function to submit a job application
    async function submitJobApplication(e) {
        e.preventDefault();
        
        if (!currentUser) {
            createNotification("You must be logged in to apply for jobs", "error");
            return;
        }
        
        const form = e.target;
        const jobId = form.dataset.jobId;
        const message = document.getElementById("application-message").value.trim();
        
        try {
            // Show loading screen with guru image
            const modal = document.getElementById("job-application-modal");
            modal.classList.remove("active");
            
            // Create and show evaluation loading screen
            showEvaluationLoadingScreen();
            
            // Get job data for evaluation
            const job = jobsData.find(job => job.id === jobId);
            if (!job) {
                throw new Error("Job data not found");
            }
            
            // Get user resume data
            const userResumesRef = firebase.firestore().collection("resumes");
            const resumeSnapshot = await userResumesRef.where("userId", "==", currentUser.uid).get();
            
            if (resumeSnapshot.empty) {
                throw new Error("Resume not found");
            }
            
            const resumeData = resumeSnapshot.docs[0].data();
            
            // Prepare evaluation data
            const jobMajor = job.requiredMajor || "Computer Science";
            const jobDegree = job.requiredDegree || "BSc";
            const jobSkills = job.requiredSkills || "python,machine learning,sql";
            
            // Extract candidate data from resume
            const candidateMajors = resumeData.education 
                ? resumeData.education.map(edu => edu.fieldOfStudy || edu.major).filter(Boolean).join(',')
                : "Software Engineering,IT,Data Science";
                
            const candidateDegrees = resumeData.education
                ? resumeData.education.map(edu => edu.degree).filter(Boolean).join(',')
                : "MSc,BSc";
                
            const candidateSkills = resumeData.skills
                ? (Array.isArray(resumeData.skills) 
                   ? resumeData.skills.join(',') 
                   : typeof resumeData.skills === 'string' 
                     ? resumeData.skills 
                     : typeof resumeData.skills === 'object' 
                       ? Object.values(resumeData.skills).filter(s => typeof s === 'string').join(',') 
                       : "")
                : "python,data analysis";
                
            // Prepare projects data
            const projectsData = {
                projects: resumeData.projects 
                    ? resumeData.projects.map(project => ({
                        name: project.name || project.title || "",
                        description: project.description || "",
                        skills: project.skills || []
                    }))
                    : [
                        {
                            name: "ML Project",
                            description: "Built ML model using Python",
                            skills: ["python", "tensorflow"]
                        },
                        {
                            name: "SQL Dashboard",
                            description: "Created dashboards using SQL and Power BI",
                            skills: ["sql", "power bi"]
                        },
                        {
                            name: "Data Cleaner",
                            description: "Developed tool to clean data using Python and Pandas",
                            skills: ["python", "pandas"]
                        }
                    ]
            };
            
            const projectsJson = JSON.stringify(projectsData);
            
            // Send evaluation request
            const evaluationUrl = `http://127.0.0.1:8000/simple-evaluation?job_major=${encodeURIComponent(jobMajor)}&job_degree=${encodeURIComponent(jobDegree)}&job_skills=${encodeURIComponent(jobSkills)}&candidate_majors=${encodeURIComponent(candidateMajors)}&candidate_degrees=${encodeURIComponent(candidateDegrees)}&candidate_skills=${encodeURIComponent(candidateSkills)}&projects_json=${encodeURIComponent(projectsJson)}`;
            
            const response = await fetch(evaluationUrl);
            
            if (!response.ok) {
                throw new Error("Evaluation request failed");
            }
            
            const evaluationResults = await response.json();
            
            // Remove loading screen
            const loadingScreen = document.getElementById("evaluation-loading-screen");
            if (loadingScreen) {
                loadingScreen.remove();
            }
            
            // Process evaluation results
            showEvaluationResults(evaluationResults, job);
            
            // Add to applications collection in Firestore
            const applicationsRef = firebase.firestore().collection("applications");
            
            await applicationsRef.add({
                jobId: jobId,
                candidateId: currentUser.uid,
                candidateName: currentUser.displayName || currentUser.email,
                candidateEmail: currentUser.email,
                resumeId: userResume.id,
                message: message,
                status: "pending",
                appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
                evaluationResults: evaluationResults
            });
            
            // Add to local applied jobs array
            appliedJobs.push({
                jobId: jobId,
                status: "pending",
                appliedAt: new Date()
            });
            
            // Clear form for next use
            form.reset();
            
        } catch (error) {
            console.error("Error submitting application:", error);
            createNotification("Error submitting application: " + error.message, "error");
            
            // Remove loading screen if exists
            const loadingScreen = document.getElementById("evaluation-loading-screen");
            if (loadingScreen) {
                loadingScreen.remove();
            }
            
            // Re-show application modal if there was an error
            const modal = document.getElementById("job-application-modal");
            modal.classList.add("active");
        }
    }
    
    // Function to show the evaluation loading screen
    function showEvaluationLoadingScreen() {
        // Create loading screen overlay
        const loadingScreen = document.createElement('div');
        loadingScreen.id = "evaluation-loading-screen";
        loadingScreen.className = "evaluation-loading-screen";
        
        // Guru image and loading text
        loadingScreen.innerHTML = `
            <div class="evaluation-loading-content">
                <img src="https://cdn-icons-png.flaticon.com/512/2532/2532062.png" alt="HR Guru" class="guru-image">
                <h2>Let us check what our HR guru says...</h2>
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p>Analyzing your profile against job requirements...</p>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(loadingScreen);
    }
    
    // Function to show evaluation results
    function showEvaluationResults(results, job) {
        // Create modal for results
        const resultsModal = document.createElement('div');
        resultsModal.id = "evaluation-results-modal";
        resultsModal.className = "modal active";
        
        // Calculate if passing score (>= 75)
        const overallScore = results.overall_score;
        const isPassing = overallScore >= 75;
        
        // Get component reports
        const componentReports = results.component_reports || {
            degree: "Your degree matches partially with the job requirements.",
            major: "Your major is aligned with the job requirements.",
            skills: "You have most of the required skills for this position.",
            projects: "Your projects demonstrate relevant experience."
        };
        
        resultsModal.innerHTML = `
            <div class="modal-content evaluation-results-content">
                <div class="modal-header ${isPassing ? 'success-header' : 'warning-header'}">
                    <h2>${isPassing ? 'Congratulations!' : 'Application Results'}</h2>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="evaluation-score-section">
                        <div class="overall-score ${isPassing ? 'passing-score' : 'failing-score'}">
                            <div class="score-circle">
                                <span class="score-value">${Math.round(overallScore)}%</span>
                            </div>
                            <h3>Overall Match</h3>
                        </div>
                        
                        <div class="score-details">
                            <div class="score-item">
                                <span class="score-label">Major Match:</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${results.major_score}%"></div>
                                </div>
                                <span class="score-value">${Math.round(results.major_score)}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Degree Match:</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${results.degree_score}%"></div>
                                </div>
                                <span class="score-value">${Math.round(results.degree_score)}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Skills Match:</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${results.skills_score}%"></div>
                                </div>
                                <span class="score-value">${Math.round(results.skills_score)}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Project Match:</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${results.project_score}%"></div>
                                </div>
                                <span class="score-value">${Math.round(results.project_score)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="evaluation-details-section">
                        <h3>Detailed Feedback</h3>
                        <div class="feedback-items">
                            <div class="feedback-item">
                                <h4>Degree</h4>
                                <p>${componentReports.degree}</p>
                            </div>
                            <div class="feedback-item">
                                <h4>Major</h4>
                                <p>${componentReports.major}</p>
                            </div>
                            <div class="feedback-item">
                                <h4>Skills</h4>
                                <p>${componentReports.skills}</p>
                            </div>
                            <div class="feedback-item">
                                <h4>Projects</h4>
                                <p>${componentReports.projects}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="evaluation-actions">
                        ${isPassing ? 
                            `<p class="success-message">You are selected for Round 2! Please take the assessment test to continue.</p>
                             <button id="take-test-button" class="primary-button">
                                <i class="fas fa-laptop-code"></i> Take Test
                             </button>` : 
                            `<p class="warning-message">Unfortunately, your profile doesn't meet the minimum requirements for this position.</p>`
                        }
                        <button class="secondary-button close-evaluation">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(resultsModal);
        
        // Setup event listeners
        resultsModal.querySelector('.close-modal').addEventListener('click', () => {
            resultsModal.remove();
        });
        
        resultsModal.querySelector('.close-evaluation').addEventListener('click', () => {
            resultsModal.remove();
        });
        
        // Setup take test button if passing
        if (isPassing) {
            resultsModal.querySelector('#take-test-button').addEventListener('click', () => {
                // Navigate to quiz page with job info
                const jobRole = job.title.toLowerCase();
                window.location.href = `/Quiz/index.html?job_role=${encodeURIComponent(jobRole)}&job_id=${encodeURIComponent(job.id)}`;
            });
        }
    }

    // Function to load and display user's applied jobs
    async function loadAppliedJobs() {
        const appliedJobsList = document.getElementById("applied-jobs-list");
        
        if (!appliedJobs.length) {
            appliedJobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <p>You haven't applied to any jobs yet.</p>
                </div>
            `;
            return;
        }
        
        appliedJobsList.innerHTML = "";
        
        // Sort by application date, newest first
        const sortedAppliedJobs = [...appliedJobs].sort((a, b) => {
            return new Date(b.appliedAt) - new Date(a.appliedAt);
        });
        
        // Get company names for applied jobs
        const jobsToDisplay = sortedAppliedJobs.map(app => {
            const job = jobsData.find(job => job.id === app.jobId);
            return job ? { application: app, job } : null;
        }).filter(Boolean);
        
        const recruiterEmails = jobsToDisplay.map(item => item.job.recruiterEmail).filter(Boolean);
        let companyNameMap = {};
        
        if (recruiterEmails.length > 0) {
            try {
                const recruitersRef = firebase.firestore().collection("recruiters");
                const recruiterSnapshots = await Promise.all(
                    recruiterEmails.map(email => 
                        recruitersRef.where("email", "==", email).get()
                    )
                );
                
                recruiterSnapshots.forEach((snapshot, index) => {
                    if (!snapshot.empty) {
                        const recruiterData = snapshot.docs[0].data();
                        companyNameMap[recruiterEmails[index]] = recruiterData.company || 'Company Name';
                    }
                });
            } catch (error) {
                console.error("Error fetching company names for applied jobs:", error);
            }
        }
        
        jobsToDisplay.forEach(item => {
            const { application, job } = item;
            
            const appliedDate = application.appliedAt instanceof Date ? 
                application.appliedAt : 
                application.appliedAt?.toDate ? application.appliedAt.toDate() : new Date();
            
            const companyName = job.recruiterEmail && companyNameMap[job.recruiterEmail] 
                ? companyNameMap[job.recruiterEmail] 
                : (job.company || 'Company Name');
            
            const applicationCard = document.createElement("div");
            applicationCard.className = "applied-job-card";
            
            applicationCard.innerHTML = `
                <div class="applied-job-header">
                    <div class="applied-job-info">
                        <h3 class="applied-job-title">${job.title}</h3>
                        <p class="applied-job-company">${companyName}</p>
                        <p class="applied-job-date">Applied on ${appliedDate.toLocaleDateString()}</p>
                    </div>
                    <span class="applied-job-status status-${application.status}">${application.status}</span>
                </div>
                <div class="applied-job-description">
                    <p>${job.description?.substring(0, 150)}${job.description?.length > 150 ? '...' : ''}</p>
                </div>
            `;
            
            appliedJobsList.appendChild(applicationCard);
        });
    }

    // Function to load and display user's resume
    function loadUserResume() {
        if (!userResume) {
            const resumeContainer = document.getElementById("resume-container");
            resumeContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No resume found. <a href="../ResumeForm/index.html">Create your resume</a>.</p>
                </div>
            `;
            return;
        }
        
        renderResume(userResume);
    }

    // Function to render the resume
    function renderResume(resume) {
        const resumeContainer = document.getElementById("resume-container");
        
        resumeContainer.innerHTML = `
            <div class="resume-section">
                <div class="resume-section-header">
                    <h3 class="resume-section-title">Personal Information</h3>
                </div>
                <div class="resume-content">
                    <p><strong>Name:</strong> <span class="resume-editable" data-field="personal.name">${resume.personal?.name || '-'}</span></p>
                    <p><strong>Phone:</strong> <span class="resume-editable" data-field="personal.phone">${resume.personal?.phone || '-'}</span></p>
                    <p><strong>Email:</strong> ${currentUser?.email || '-'}</p>
                </div>
            </div>
            
            <div class="resume-section">
                <div class="resume-section-header">
                    <h3 class="resume-section-title">Education</h3>
                </div>
                <div class="resume-content" id="education-content">
                    ${resume.education && resume.education.length ? 
                        resume.education.map((edu, index) => `
                            <div class="education-item">
                                <p><strong>Institution:</strong> <span class="resume-editable" data-field="education[${index}].institution">${edu.institution || '-'}</span></p>
                                <p><strong>Degree:</strong> <span class="resume-editable" data-field="education[${index}].degree">${edu.degree || '-'}</span></p>
                                <p><strong>Field of Study:</strong> <span class="resume-editable" data-field="education[${index}].fieldOfStudy">${edu.fieldOfStudy || '-'}</span></p>
                                <p><strong>Graduation Year:</strong> <span class="resume-editable" data-field="education[${index}].graduationYear">${edu.graduationYear || '-'}</span></p>
                            </div>
                        `).join('') : 
                        '<p>No education information provided.</p>'
                    }
                </div>
            </div>
            
            <div class="resume-section">
                <div class="resume-section-header">
                    <h3 class="resume-section-title">Skills</h3>
                </div>
                <div class="resume-content">
                    <p><span class="resume-editable" data-field="skills">${resume.skills || '-'}</span></p>
                </div>
            </div>
            
            ${resume.hasExperience ? `
                <div class="resume-section">
                    <div class="resume-section-header">
                        <h3 class="resume-section-title">Experience</h3>
                    </div>
                    <div class="resume-content" id="experience-content">
                        ${resume.experience && resume.experience.length ? 
                            resume.experience.map((exp, index) => `
                                <div class="experience-item">
                                    <p><strong>Company:</strong> <span class="resume-editable" data-field="experience[${index}].company">${exp.company || '-'}</span></p>
                                    <p><strong>Position:</strong> <span class="resume-editable" data-field="experience[${index}].position">${exp.position || '-'}</span></p>
                                    <p><strong>Duration:</strong> <span class="resume-editable" data-field="experience[${index}].startDate">${exp.startDate || '-'}</span> to <span class="resume-editable" data-field="experience[${index}].endDate">${exp.endDate || 'Present'}</span></p>
                                    <p><strong>Description:</strong> <span class="resume-editable" data-field="experience[${index}].description">${exp.description || '-'}</span></p>
                                </div>
                            `).join('') : 
                            '<p>No experience information provided.</p>'
                        }
                    </div>
                </div>
            ` : ''}
            
            <div class="resume-section">
                <div class="resume-section-header">
                    <h3 class="resume-section-title">Projects</h3>
                </div>
                <div class="resume-content" id="projects-content">
                    ${resume.projects && resume.projects.length ? 
                        resume.projects.map((project, index) => `
                            <div class="project-item">
                                <p><strong>Title:</strong> <span class="resume-editable" data-field="projects[${index}].title">${project.title || '-'}</span></p>
                                <p><strong>Description:</strong> <span class="resume-editable" data-field="projects[${index}].description">${project.description || '-'}</span></p>
                                <p><strong>Technologies:</strong> <span class="resume-editable" data-field="projects[${index}].technologies">${project.technologies || '-'}</span></p>
                            </div>
                        `).join('') : 
                        '<p>No project information provided.</p>'
                    }
                </div>
            </div>
        `;
    }

    // Function to make resume editable
    function makeResumeEditable(editable) {
        const editButton = document.getElementById("edit-resume");
        const saveButton = document.getElementById("save-resume-changes");
        
        editButton.style.display = editable ? "none" : "inline-flex";
        saveButton.style.display = editable ? "inline-flex" : "none";
        
        const editableElements = document.querySelectorAll(".resume-editable");
        
        editableElements.forEach(element => {
            element.contentEditable = editable;
            element.classList.toggle("editing", editable);
        });
    }

    // Function to save resume changes
    async function saveResumeChanges() {
        if (!userResume || !currentUser) return;
        
        try {
            const updatedResume = { ...userResume };
            
            // Get all editable fields and their updated values
            const editableElements = document.querySelectorAll(".resume-editable");
            
            editableElements.forEach(element => {
                const field = element.dataset.field;
                const value = element.textContent.trim();
                
                if (field.includes('[')) {
                    // Handle array fields like education[0].institution
                    const matches = field.match(/([\w]+)\[(\d+)\]\.([\w]+)/);
                    if (matches && matches.length === 4) {
                        const [, arrayName, index, property] = matches;
                        if (!updatedResume[arrayName]) {
                            updatedResume[arrayName] = [];
                        }
                        if (!updatedResume[arrayName][index]) {
                            updatedResume[arrayName][index] = {};
                        }
                        updatedResume[arrayName][index][property] = value;
                    }
                } else if (field.includes('.')) {
                    // Handle nested fields like personal.name
                    const [parent, child] = field.split('.');
                    if (!updatedResume[parent]) {
                        updatedResume[parent] = {};
                    }
                    updatedResume[parent][child] = value;
                } else {
                    // Handle flat fields like skills
                    updatedResume[field] = value;
                }
            });
            
            // Update in Firestore
            await firebase.firestore().collection("resumes").doc(userResume.id).update({
                ...updatedResume,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local data
            userResume = updatedResume;
            
            // Exit edit mode
            makeResumeEditable(false);
            
            createNotification("Resume updated successfully!", "success");
            
        } catch (error) {
            console.error("Error updating resume:", error);
            createNotification("Error updating resume: " + error.message, "error");
        }
    }

    // Function to load and display user profile
    function loadUserProfile() {
        if (!currentUser) return;
        
        document.getElementById("profile-name").textContent = currentUser.displayName || currentUser.email;
        document.getElementById("profile-email").textContent = currentUser.email;
        
        // Fetch user data from Firestore to get fullName, email, and skills
        firebase.firestore().collection('users').doc(currentUser.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // Update profile details section with user data
                    document.getElementById("profile-uid").innerHTML = `
                        <div class="profile-detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${userData.fullName || currentUser.displayName || '-'}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${userData.email || currentUser.email}</span>
                        </div>
                        <div class="profile-detail-item">
                            <span class="detail-label">Skills</span>
                            <span class="detail-value">${userData.skills || '-'}</span>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error("Error fetching user data:", error);
                createNotification("Failed to load user profile data", "error");
            });
    }

    // Function to change user password
    async function changeUserPassword() {
        if (!currentUser) return;
        
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        
        if (newPassword !== confirmPassword) {
            createNotification("New passwords do not match", "error");
            return;
        }
        
        try {
            // Reauthenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );
            
            await currentUser.reauthenticateWithCredential(credential);
            
            // Change password
            await currentUser.updatePassword(newPassword);
            
            // Close modal and show success message
            document.getElementById("password-change-modal").classList.remove("active");
            document.getElementById("password-change-form").reset();
            
            createNotification("Password changed successfully!", "success");
            
        } catch (error) {
            console.error("Error changing password:", error);
            
            if (error.code === "auth/wrong-password") {
                createNotification("Current password is incorrect", "error");
            } else {
                createNotification("Error changing password: " + error.message, "error");
            }
        }
    }

    // Function to logout user
    function logoutUser() {
        firebase.auth().signOut()
            .then(() => {
                window.location.href = "../Login/index.html";
            })
            .catch((error) => {
                console.error("Error signing out:", error);
                createNotification("Error signing out: " + error.message, "error");
            });
    }

    // Instead of using firebase.auth().onAuthStateChanged, listen for the custom event
    document.addEventListener('userAuthenticated', function(e) {
        const user = e.detail;
        console.log("User authenticated event received:", user.email);
        currentUser = user;
        
        // Check if user has a resume and redirect if needed
        checkResumeAndRedirect();
    });

    // Check if currentUser is already set (in case the event was fired before we added the listener)
    if (window.currentUser) {
        console.log("Using already authenticated user:", window.currentUser.email);
        currentUser = window.currentUser;
        checkResumeAndRedirect();
    }
});