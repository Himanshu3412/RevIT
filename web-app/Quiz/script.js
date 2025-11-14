// DOM Elements and initialization
document.addEventListener("DOMContentLoaded", function () {
    // Initialize the current user
    let currentUser = null;
    let jobId = null;
    let jobRole = null;
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let timerInterval = null;
    let startTime = null;
    let timeLimit = 30 * 60; // 30 minutes in seconds
    
    // DOM Elements
    const introView = document.getElementById("quiz-intro-view");
    const questionsView = document.getElementById("quiz-questions-view");
    const resultsView = document.getElementById("quiz-results-view");
    const jobTitleElement = document.getElementById("job-title");
    const startQuizButton = document.getElementById("start-quiz-btn");
    const nextQuestionButton = document.getElementById("next-question-btn");
    const timerElement = document.getElementById("timer");
    const progressFill = document.getElementById("progress-fill");
    const currentQuestionElement = document.getElementById("current-question");
    const totalQuestionsElement = document.getElementById("total-questions");
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const questionDifficultyElement = document.getElementById("question-difficulty");
    const questionNumberElement = document.getElementById("question-number");
    const returnDashboardButton = document.getElementById("return-dashboard-btn");
    
    // Firebase Authentication State Change
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            console.log("User is signed in:", user.uid);
            
            // Parse URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            jobId = urlParams.get("job_id");
            jobRole = urlParams.get("job_role");
            
            if (!jobId || !jobRole) {
                showError("Missing job information. Please go back to the dashboard and try again.");
                return;
            }
            
            // Load job details
            loadJobDetails();
        } else {
            // User is not signed in, redirect to login
            window.location.href = "../Login/index.html";
        }
    });
    
    // Event Listeners
    startQuizButton.addEventListener("click", startQuiz);
    nextQuestionButton.addEventListener("click", goToNextQuestion);
    returnDashboardButton.addEventListener("click", function() {
        window.location.href = "../Candidate_Dashboard/index.html";
    });
    
    // Function to load job details
    async function loadJobDetails() {
        try {
            if (!jobId) return;
            
            const jobRef = firebase.firestore().collection("jobs").doc(jobId);
            const jobDoc = await jobRef.get();
            
            if (!jobDoc.exists) {
                showError("Job not found. Please go back to the dashboard and try again.");
                return;
            }
            
            const jobData = jobDoc.data();
            
            // Set job title in the UI
            jobTitleElement.textContent = jobData.title || "Technical Assessment";
            
        } catch (error) {
            console.error("Error loading job details:", error);
            showError("Failed to load job details. Please try again later.");
        }
    }
    
    // Function to start the quiz
    async function startQuiz() {
        try {
            // Show loading state
            startQuizButton.disabled = true;
            startQuizButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Questions...';
            
            // Fetch questions
            await fetchQuestions();
            
            if (questions.length === 0) {
                throw new Error("No questions available for this assessment.");
            }
            
            // Update UI with question count
            document.getElementById("question-count").textContent = questions.length;
            totalQuestionsElement.textContent = questions.length;
            
            // Initialize user answers array
            userAnswers = new Array(questions.length).fill(null);
            
            // Start timer
            startTime = Date.now();
            startTimer();
            
            // Show questions view and hide intro view
            introView.style.display = "none";
            questionsView.style.display = "block";
            
            // Show the first question
            showQuestion(0);
            
        } catch (error) {
            console.error("Error starting quiz:", error);
            startQuizButton.disabled = false;
            startQuizButton.innerHTML = '<i class="fas fa-play"></i> Retry';
            showError("Failed to start the assessment: " + error.message);
        }
    }
    
    // Function to fetch questions from the server
    async function fetchQuestions() {
        try {
            const response = await fetch(`http://127.0.0.1:5000/generate_questionnaire/`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch questions");
            }
            
            const data = await response.json();
            
            if (data && data.questions && data.questions.length > 0) {
                questions = data.questions;
                console.log("Loaded questions:", questions.length);
            } else {
                throw new Error("No questions received from the server");
            }
            
        } catch (error) {
            console.error("Error fetching questions:", error);
            throw new Error("Failed to fetch questions: " + error.message);
        }
    }
    
    // Function to show a question
    function showQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        
        currentQuestionIndex = index;
        const question = questions[index];
        
        // Log the question and its correct answer in the console
        console.log(`Question ${index + 1}: ${question.Question}`);
        console.log(`Correct Answer: ${question["Correct Answer"]} - ${question["Option " + question["Correct Answer"]]}`);
        console.log("All options:", {
            "A": question["Option A"],
            "B": question["Option B"],
            "C": question["Option C"],
            "D": question["Option D"]
        });
        console.log("------------------------------------------------");
        
        // Update progress indicators
        const progressPercentage = ((index + 1) / questions.length) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        currentQuestionElement.textContent = index + 1;
        questionNumberElement.textContent = `Question ${index + 1}`;
        
        // Set difficulty class
        questionDifficultyElement.textContent = question["Difficulty Level"] || "Medium";
        questionDifficultyElement.className = "question-difficulty";
        
        if (question["Difficulty Level"]) {
            const difficulty = question["Difficulty Level"].toLowerCase();
            questionDifficultyElement.classList.add(difficulty);
        }
        
        // Set question text
        questionTextElement.textContent = question.Question || "Question not available";
        
        // Clear options container
        optionsContainer.innerHTML = "";
        
        // Add options
        const options = [
            { key: "A", value: question["Option A"] },
            { key: "B", value: question["Option B"] },
            { key: "C", value: question["Option C"] },
            { key: "D", value: question["Option D"] }
        ];
        
        options.forEach((option, optionIndex) => {
            const optionElement = document.createElement("div");
            optionElement.className = "option";
            optionElement.dataset.optionKey = option.key;
            
            // Check if this option was previously selected
            if (userAnswers[index] === option.key) {
                optionElement.classList.add("selected");
            }
            
            optionElement.innerHTML = `
                <label class="option-label">
                    <div class="option-marker">${option.key}</div>
                    <span>${option.value || "Option not available"}</span>
                </label>
            `;
            
            optionElement.addEventListener("click", function() {
                selectOption(this);
            });
            
            optionsContainer.appendChild(optionElement);
        });
        
        // Enable/disable next button based on whether an option is selected
        nextQuestionButton.disabled = userAnswers[index] === null;
        
        // Update button text if it's the last question
        if (index === questions.length - 1) {
            nextQuestionButton.innerHTML = 'Submit Quiz <i class="fas fa-check"></i>';
        } else {
            nextQuestionButton.innerHTML = 'Next Question <i class="fas fa-arrow-right"></i>';
        }
    }
    
    // Function to select an option
    function selectOption(optionElement) {
        // Remove selected class from all options
        const allOptions = optionsContainer.querySelectorAll(".option");
        allOptions.forEach(opt => opt.classList.remove("selected"));
        
        // Add selected class to clicked option
        optionElement.classList.add("selected");
        
        // Store user's answer
        userAnswers[currentQuestionIndex] = optionElement.dataset.optionKey;
        
        // Enable next button
        nextQuestionButton.disabled = false;
    }
    
    // Function to go to the next question
    function goToNextQuestion() {
        if (currentQuestionIndex === questions.length - 1) {
            // Last question, submit the quiz
            finishQuiz();
        } else {
            // Show next question
            showQuestion(currentQuestionIndex + 1);
        }
    }
    
    // Function to start the timer
    function startTimer() {
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Function to update the timer
    function updateTimer() {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const remainingSeconds = timeLimit - elapsedSeconds;
        
        if (remainingSeconds <= 0) {
            // Time's up, finish the quiz
            clearInterval(timerInterval);
            finishQuiz();
            return;
        }
        
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning class when time is running low (less than 5 minutes)
        if (remainingSeconds < 300) {
            timerElement.classList.add("timer-warning");
        }
    }
    
    // Function to finish the quiz
    function finishQuiz() {
        // Stop the timer
        clearInterval(timerInterval);
        
        // Calculate results
        const results = calculateResults();
        
        // Log all questions and correct answers at the end
        console.log("==================== QUIZ ANSWERS ====================");
        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = question["Correct Answer"];
            const isCorrect = userAnswer === correctAnswer;
            
            console.log(`Question ${index + 1}: ${question.Question}`);
            console.log(`Your Answer: ${userAnswer || "Not answered"} - ${userAnswer ? question["Option " + userAnswer] : "N/A"}`);
            console.log(`Correct Answer: ${correctAnswer} - ${question["Option " + correctAnswer]}`);
            console.log(`Result: ${isCorrect ? "✓ CORRECT" : "✗ INCORRECT"}`);
            console.log("------------------------------------------------");
        });
        console.log(`Final Score: ${Math.round(results.score)}% (${results.correctAnswers}/${results.totalQuestions})`);
        console.log("=====================================================");
        
        // Display results
        displayResults(results);
        
        // Save results to Firestore
        saveResults(results);
    }
    
    // Function to calculate quiz results
    function calculateResults() {
        let correctAnswers = 0;
        
        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = question["Correct Answer"];
            
            if (userAnswer === correctAnswer) {
                correctAnswers++;
            }
        });
        
        const totalQuestions = questions.length;
        const score = (correctAnswers / totalQuestions) * 100;
        const isPassing = score >= 80;
        
        // Calculate time taken
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        const timeTaken = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        return {
            score,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            totalQuestions,
            isPassing,
            timeTaken,
            elapsedSeconds,
            answers: userAnswers
        };
    }
    
    // Function to display results
    function displayResults(results) {
        // Hide questions view and show results view
        questionsView.style.display = "none";
        resultsView.style.display = "block";
        
        // Update UI with results
        const finalScoreElement = document.getElementById("final-score");
        const correctAnswersElement = document.getElementById("correct-answers");
        const incorrectAnswersElement = document.getElementById("incorrect-answers");
        const timeTakenElement = document.getElementById("time-taken");
        const resultMessageElement = document.getElementById("result-message");
        const resultHeaderElement = document.getElementById("result-header");
        const resultIconElement = document.getElementById("result-icon");
        const resultTitleElement = document.getElementById("result-title");
        
        // Set score and details
        finalScoreElement.textContent = `${Math.round(results.score)}%`;
        correctAnswersElement.textContent = results.correctAnswers;
        incorrectAnswersElement.textContent = results.incorrectAnswers;
        timeTakenElement.textContent = results.timeTaken;
        
        // Apply correct styling based on pass/fail
        const scoreCircle = document.querySelector(".score-circle");
        scoreCircle.classList.add(results.isPassing ? "passing" : "failing");
        
        if (results.isPassing) {
            resultHeaderElement.classList.add("success");
            resultIconElement.className = "fas fa-check-circle";
            resultTitleElement.textContent = "Congratulations!";
            resultMessageElement.innerHTML = `
                <p>You have successfully passed the technical assessment!</p>
                <p>Your application has been moved to the next stage of the selection process.
                   A recruiter will review your application and get in touch with you soon.</p>
                <p>Thank you for completing the assessment.</p>
            `;
        } else {
            resultHeaderElement.classList.add("failure");
            resultIconElement.className = "fas fa-times-circle";
            resultTitleElement.textContent = "Assessment Complete";
            resultMessageElement.innerHTML = `
                <p>Thank you for completing the technical assessment.</p>
                <p>Unfortunately, your score did not meet the minimum requirement for this position.
                   We encourage you to review the topics covered and try again in the future.</p>
                <p>Don't be discouraged! Keep improving your skills and look for other opportunities that match your current expertise.</p>
            `;
        }
    }
    
    // Function to save results to Firestore
    async function saveResults(results) {
        try {
            if (!currentUser || !jobId) return;
            
            // Save quiz results
            const quizResultsRef = firebase.firestore().collection("quizResults");
            
            await quizResultsRef.add({
                userId: currentUser.uid,
                jobId: jobId,
                score: results.score,
                correctAnswers: results.correctAnswers,
                totalQuestions: results.totalQuestions,
                timeTaken: results.elapsedSeconds,
                answers: results.answers,
                isPassing: results.isPassing,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // If the user passed, update the job's applicants field
            if (results.isPassing) {
                const jobRef = firebase.firestore().collection("jobs").doc(jobId);
                const jobDoc = await jobRef.get();
                
                if (jobDoc.exists) {
                    // Check if the applicants field exists and includes the user
                    const jobData = jobDoc.data();
                    const applicants = jobData.applicants || [];
                    
                    // Check if the user is already in the applicants list
                    const userIndex = applicants.findIndex(app => app === currentUser.uid);
                    
                    if (userIndex === -1) {
                        // Add the user to the applicants list
                        await jobRef.update({
                            applicants: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error("Error saving quiz results:", error);
            // Continue showing results even if save fails
        }
    }
    
    // Function to show an error message
    function showError(message) {
        // Create an error message element
        const errorElement = document.createElement("div");
        errorElement.className = "error-message";
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        `;
        
        // Add it to the intro view
        const introCard = document.querySelector(".quiz-intro-card");
        introCard.prepend(errorElement);
        
        // Reset start button
        startQuizButton.disabled = true;
        startQuizButton.innerHTML = '<i class="fas fa-home"></i> Return to Dashboard';
        startQuizButton.addEventListener("click", function() {
            window.location.href = "../Candidate_Dashboard/index.html";
        });
    }
}); 