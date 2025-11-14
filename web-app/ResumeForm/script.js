// Initialize particles.js
particlesJS('particles-js', {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: '#ffffff'
        },
        shape: {
            type: 'circle'
        },
        opacity: {
            value: 0.1,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.05,
                sync: false
            }
        },
        size: {
            value: 3,
            random: true,
            anim: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.1,
            width: 1
        },
        move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: {
                enable: true,
                rotateX: 600,
                rotateY: 1200
            }
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: {
                enable: true,
                mode: 'grab'
            },
            onclick: {
                enable: true,
                mode: 'push'
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 140,
                line_linked: {
                    opacity: 0.3
                }
            },
            push: {
                particles_nb: 4
            }
        }
    },
    retina_detect: true
});

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const form = document.getElementById('resumeForm');
    const projectsContainer = document.getElementById('projectsContainer');
    const addProjectButton = document.getElementById('addProject');
    const hasExperienceCheckbox = document.getElementById('hasExperience');
    const experienceFields = document.getElementById('experienceFields');
    const addExperienceButton = document.getElementById('addExperience');
    const educationContainer = document.getElementById('educationContainer');
    const addEducationButton = document.getElementById('addEducation');

    // Add initial education entry immediately when page loads
    addInitialEducation();

    // Modal elements
    const modal = document.getElementById('resumeReviewModal');
    const closeButton = document.getElementById('closeReviewModal');
    const editResumeButton = document.getElementById('editResume');
    const submitResumeButton = document.getElementById('submitResume');
    const editSectionButtons = document.querySelectorAll('.edit-section');

    // Initialize global resumeData object and expose it to window
    window.resumeData = {};
    let resumeData = window.resumeData;

    // Function to show modal
    function showModal() {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        startReviewAnimation();
    }

    // Function to hide modal
    function hideModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    // Function to reset form
    function resetForm() {
        form.reset();
        // Clear all dynamic entries
        projectsContainer.innerHTML = '';
        experienceFields.innerHTML = '';
        educationContainer.innerHTML = '';
        
        // Add back initial required education entry
        addEducationEntry(true);
        
        // Hide experience section
        experienceFields.classList.add('hidden');
        hasExperienceCheckbox.checked = false;
    }

    // Function to scroll to section
    function scrollToSection(sectionId) {
        const section = document.querySelector(`[data-section="${sectionId}"]`).closest('.space-y-4');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Function to add an education entry
    function addEducationEntry(isInitial = false) {
        const educationContainer = document.getElementById('educationContainer');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'education-entry bg-neutral-800 p-4 rounded-lg space-y-3 relative';
        
        // Only show delete button if it's not the initial entry
        const deleteButton = !isInitial ? `
            <button type="button" class="delete-education absolute top-2 right-2 text-red-400 hover:text-red-300 transition-colors duration-300">
                <i class="fas fa-times"></i>
            </button>
        ` : '';

        // Generate graduation year dropdown options
        const currentYear = new Date().getFullYear();
        let yearOptions = '';
        for (let year = currentYear; year >= 1975; year--) {
            yearOptions += `<option value="${year}">${year}</option>`;
        }

        entryDiv.innerHTML = `
            ${deleteButton}
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <input type="text" placeholder="Degree" ${isInitial ? 'required' : ''} 
                        class="w-full p-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <input type="text" placeholder="Major" ${isInitial ? 'required' : ''} 
                        class="w-full p-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <input type="text" placeholder="School" ${isInitial ? 'required' : ''} 
                        class="w-full p-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <select ${isInitial ? 'required' : ''} 
                        class="w-full p-2 bg-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="" disabled selected>Graduation Year</option>
                        ${yearOptions}
                    </select>
                </div>
            </div>
        `;

        educationContainer.appendChild(entryDiv);

        // Add delete functionality only for non-initial entries
        if (!isInitial) {
            const deleteButton = entryDiv.querySelector('.delete-education');
            deleteButton.addEventListener('click', function() {
                entryDiv.remove();
            });
        }
    }

    // Function to ensure at least one education entry exists
    function addInitialEducation() {
        const educationContainer = document.getElementById('educationContainer');
        if (!educationContainer.querySelector('.education-entry')) {
            addEducationEntry(true); // Pass true to indicate this is the initial entry
        }
    }

    // Add event listener for the add education button
    document.getElementById('addEducation').addEventListener('click', () => addEducationEntry(false));

    // Function to add experience entry
    function addExperienceEntry() {
        const experienceContainer = document.getElementById('experienceFields');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'experience-entry p-4 border border-neutral-600 rounded-lg space-y-4';
        
        entryDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div>
                    <label class="text-sm font-medium text-neutral-300">Company Name</label>
                    <input type="text" name="companyName[]"
                        class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                        placeholder="Company Name" />
                </div>
                <button type="button" class="delete-experience text-red-400 hover:text-red-300 transition-colors duration-300">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <div>
                <label class="text-sm font-medium text-neutral-300">Position</label>
                <input type="text" name="position[]"
                    class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                    placeholder="Position Title" />
            </div>
            <div>
                <label class="text-sm font-medium text-neutral-300">Duration</label>
                <input type="text" name="duration[]"
                    class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                    placeholder="e.g., Jan 2020 - Present" />
            </div>
            <div>
                <label class="text-sm font-medium text-neutral-300">Description</label>
                <textarea name="experienceDescription[]" rows="3"
                    class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                    placeholder="Describe your responsibilities and achievements"></textarea>
            </div>
        `;

        // Insert the new entry before the "Add Another Experience" button
        const addButton = document.getElementById('addExperience');
        experienceContainer.insertBefore(entryDiv, addButton);

        // Add delete functionality
        const deleteButton = entryDiv.querySelector('.delete-experience');
        deleteButton.addEventListener('click', function() {
            const entries = document.querySelectorAll('.experience-entry');
            if (entries.length > 1) {
                entryDiv.remove();
            } else {
                alert('Keep at least one experience entry while the section is active');
            }
        });
    }

    // Toggle experience section visibility
    hasExperienceCheckbox.addEventListener('change', function() {
        if (this.checked) {
            experienceFields.classList.remove('hidden');
            // Add initial experience entry if none exists
            if (!document.querySelector('.experience-entry')) {
                addExperienceEntry();
            }
        } else {
            experienceFields.classList.add('hidden');
            // Clear existing experience entries
            const entries = document.querySelectorAll('.experience-entry');
            entries.forEach(entry => entry.remove());
        }
    });

    // Add experience entry button handler
    addExperienceButton.addEventListener('click', addExperienceEntry);

    // Function to add project entry
    function addProjectEntry() {
        const projectsContainer = document.getElementById('projectsContainer');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'project-entry bg-neutral-800 p-4 rounded-lg space-y-3 relative mb-4';
        
        // Get the current skills for dropdown
        const currentSkills = document.getElementById('skills').value
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill); // Filter out empty strings
        
        // Create the skills dropdown options
        let skillsDropdownHtml = '';
        if (currentSkills.length > 0) {
            skillsDropdownHtml = `
                <div>
                    <label class="text-sm font-medium text-neutral-300">Skills Used</label>
                    <div class="skills-selection mt-1 relative">
                        <div class="custom-select-wrapper">
                            <div class="custom-select-trigger p-2 bg-neutral-700 text-white rounded-lg flex justify-between items-center cursor-pointer">
                                <span class="select-value">Select skills used in this project</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="custom-options hidden absolute w-full mt-1 bg-neutral-800 border border-neutral-600 rounded-lg z-10 max-h-48 overflow-y-auto">
                                ${currentSkills.map(skill => `
                                    <div class="custom-option p-2 cursor-pointer hover:bg-neutral-700 flex items-center" data-value="${skill}">
                                        <input type="checkbox" class="mr-2 skill-checkbox" id="skill-${skill.replace(/\s+/g, '-')}" value="${skill}">
                                        <label for="skill-${skill.replace(/\s+/g, '-')}" class="flex-grow cursor-pointer">${skill}</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="selected-skills-container mt-2 flex flex-wrap gap-2"></div>
                        <input type="hidden" name="projectSkills[]" value="">
                    </div>
                </div>
            `;
        } else {
            skillsDropdownHtml = `
                <div>
                    <label class="text-sm font-medium text-neutral-300">Skills Used</label>
                    <div class="p-2 bg-neutral-700/50 border border-neutral-600 rounded-lg text-neutral-400 mt-1">
                        Please enter skills in the main skills section first
                    </div>
                </div>
            `;
        }
        
        entryDiv.innerHTML = `
            <button type="button" class="delete-project absolute top-2 right-2 text-red-400 hover:text-red-300 transition-colors duration-300">
                <i class="fas fa-times"></i>
            </button>
            <div>
                <label class="text-sm font-medium text-neutral-300">Project Name</label>
                <input type="text" name="projectName[]"
                    class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                    placeholder="Project Name" />
            </div>
            <div>
                <label class="text-sm font-medium text-neutral-300">Description</label>
                <textarea name="projectDescription[]" rows="3"
                    class="mt-1 w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white transition-all duration-300"
                    placeholder="Describe your project"></textarea>
            </div>
            ${skillsDropdownHtml}
        `;

        projectsContainer.appendChild(entryDiv);

        // Add delete functionality
        const deleteButton = entryDiv.querySelector('.delete-project');
        deleteButton.addEventListener('click', function() {
            entryDiv.remove();
        });

        // Custom dropdown functionality
        if (currentSkills.length > 0) {
            const selectTrigger = entryDiv.querySelector('.custom-select-trigger');
            const customOptions = entryDiv.querySelector('.custom-options');
            const selectedSkillsContainer = entryDiv.querySelector('.selected-skills-container');
            const hiddenInput = entryDiv.querySelector('input[name="projectSkills[]"]');
            
            // Toggle dropdown on click
            selectTrigger.addEventListener('click', function() {
                customOptions.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!selectTrigger.contains(e.target) && !customOptions.contains(e.target)) {
                    customOptions.classList.add('hidden');
                }
            });
            
            // Handle checkbox selections
            const checkboxes = entryDiv.querySelectorAll('.skill-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const selectedSkills = [];
                    
                    // Collect all selected skills
                    checkboxes.forEach(cb => {
                        if (cb.checked) {
                            selectedSkills.push(cb.value);
                        }
                    });
                    
                    // Update the selected skills display
                    updateSelectedSkills(selectedSkills, selectedSkillsContainer, hiddenInput);
                    
                    // Update the dropdown label
                    const selectValue = selectTrigger.querySelector('.select-value');
                    if (selectedSkills.length > 0) {
                        selectValue.textContent = `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`;
                    } else {
                        selectValue.textContent = 'Select skills used in this project';
                    }
                });
            });
        }
    }

    // Helper function to update the selected skills
    function updateSelectedSkills(skills, container, hiddenInput) {
        container.innerHTML = '';
        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag bg-blue-600 text-white px-2 py-1 rounded-md text-sm flex items-center';
            tag.innerHTML = `
                <span>${skill}</span>
                <button type="button" class="remove-skill ml-1 text-white hover:text-red-200">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
            
            // Add remove skill functionality
            tag.querySelector('.remove-skill').addEventListener('click', function() {
                // Find and uncheck the corresponding checkbox
                const checkbox = document.querySelector(`input[value="${skill}"]`);
                if (checkbox) checkbox.checked = false;
                
                // Remove the tag
                tag.remove();
                
                // Update hidden input
                const currentSkills = Array.from(container.querySelectorAll('.skill-tag')).map(t => 
                    t.querySelector('span').textContent
                );
                
                hiddenInput.value = currentSkills.join(',');
                
                // If this is the last tag, update the dropdown label
                const selectTrigger = container.closest('.skills-selection').querySelector('.custom-select-trigger');
                const selectValue = selectTrigger.querySelector('.select-value');
                
                if (currentSkills.length === 0) {
                    selectValue.textContent = 'Select skills used in this project';
                } else {
                    selectValue.textContent = `${currentSkills.length} skill${currentSkills.length > 1 ? 's' : ''} selected`;
                }
            });
            
            container.appendChild(tag);
        });
        
        // Update hidden input
        hiddenInput.value = skills.join(',');
    }

    // Add project button click handler
    addProjectButton.addEventListener('click', addProjectEntry);

    // Function to update review content
    function updateReviewContent(data) {
        // Personal Information
        const personalReviewHtml = `
            <div class="review-item-header">
                <h4 class="text-lg font-medium text-white mb-2">
                    <i class="fas fa-user"></i> ${data.personalInfo.name || 'Not provided'}
                </h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong><i class="fas fa-phone"></i> Phone:</strong> ${data.personalInfo.phone || 'Not provided'}</p>
            </div>
        `;
        document.getElementById('personalReview').innerHTML = personalReviewHtml;

        // Education
        const educationReviewHtml = data.education.map(edu => `
            <div class="review-item mb-4 p-4 bg-neutral-800 rounded-lg">
                <div class="review-item-header">
                    <h4 class="text-lg font-medium text-white mb-2">
                        <i class="fas fa-graduation-cap"></i> ${edu.degree || 'Not provided'}
                    </h4>
                </div>
                <div class="space-y-2">
                    <p><strong><i class="fas fa-book"></i> Major:</strong> ${edu.major || 'Not provided'}</p>
                    <p><strong><i class="fas fa-university"></i> School:</strong> ${edu.school || 'Not provided'}</p>
                    <p><strong><i class="fas fa-calendar"></i> Graduation Year:</strong> ${edu.graduationYear || 'Not provided'}</p>
                </div>
            </div>
        `).join('');
        document.getElementById('educationReview').innerHTML = educationReviewHtml || '<p class="text-neutral-400">No education entries provided.</p>';

        // Experience Section
        const experienceSection = document.getElementById('experienceReviewSection');
        if (data.experience && data.experience.length > 0) {
            experienceSection.classList.remove('hidden');
            const experienceReviewHtml = data.experience.map(exp => `
                <div class="review-item mb-4 last:mb-0">
                    <div class="review-item-header">
                        <h4 class="text-lg font-medium text-white mb-2">
                            <i class="fas fa-briefcase"></i> ${exp.position} at ${exp.companyName}
                        </h4>
                    </div>
                    <div class="space-y-2">
                        <p><strong><i class="fas fa-clock"></i> Duration:</strong> ${exp.duration}</p>
                        <p><strong><i class="fas fa-tasks"></i> Description:</strong> ${exp.description}</p>
                    </div>
                </div>
            `).join('');
            document.getElementById('experienceReview').innerHTML = experienceReviewHtml;
        } else {
            experienceSection.classList.add('hidden');
        }

        // Skills
        const skillsHtml = data.skills.map(skill => `
            <span class="skill-tag"><i class="fas fa-check-circle"></i> ${skill}</span>
        `).join('');
        
        const skillsReviewHtml = `
            <div class="flex flex-wrap gap-2">
                ${skillsHtml}
            </div>
        `;
        document.getElementById('skillsReview').innerHTML = skillsReviewHtml;

        // Projects
        const projectsReviewHtml = data.projects.map(project => `
            <div class="review-item mb-4 last:mb-0">
                <div class="review-item-header">
                    <h4 class="text-lg font-medium text-white mb-2">
                        <i class="fas fa-project-diagram"></i> ${project.name}
                    </h4>
                </div>
                <div class="space-y-2">
                    <p><strong><i class="fas fa-info-circle"></i> Description:</strong> ${project.description}</p>
                    <div class="mt-2">
                        <strong><i class="fas fa-tools"></i> Skills Used:</strong>
                        <div class="flex flex-wrap gap-2 mt-2">
                            ${project.skills.map(skill => `
                                <span class="skill-tag"><i class="fas fa-check-circle"></i> ${skill}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        document.getElementById('projectsReview').innerHTML = projectsReviewHtml;
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get all form data
        const formData = new FormData(form);
        window.resumeData = {
            personalInfo: {
                name: formData.get('name'),
                phone: formData.get('phone')
            },
            education: [],
            skills: formData.get('skills').split(',').map(skill => skill.trim()),
            projects: [],
            hasExperience: hasExperienceCheckbox.checked,
            experience: []
        };
        
        // Update local reference
        resumeData = window.resumeData;

        // Get education data
        const educationEntries = document.querySelectorAll('.education-entry');
        educationEntries.forEach(entry => {
            const inputs = entry.querySelectorAll('input, select');
            if (inputs[0].value.trim()) {
                resumeData.education.push({
                    degree: inputs[0].value,
                    major: inputs[1].value,
                    school: inputs[2].value,
                    graduationYear: inputs[3].value
                });
            }
        });

        // Get projects data
        const projectNames = formData.getAll('projectName[]');
        const projectDescriptions = formData.getAll('projectDescription[]');
        const projectSkills = formData.getAll('projectSkills[]');

        for (let i = 0; i < projectNames.length; i++) {
            if (projectNames[i].trim()) {
                resumeData.projects.push({
                    name: projectNames[i],
                    description: projectDescriptions[i],
                    skills: projectSkills[i].split(',').map(skill => skill.trim())
                });
            }
        }

        // Get experience data if available
        if (hasExperienceCheckbox.checked) {
            const companyNames = formData.getAll('companyName[]');
            const positions = formData.getAll('position[]');
            const durations = formData.getAll('duration[]');
            const experienceDescriptions = formData.getAll('experienceDescription[]');

            for (let i = 0; i < companyNames.length; i++) {
                if (companyNames[i].trim()) {
                    resumeData.experience.push({
                        companyName: companyNames[i],
                        position: positions[i],
                        duration: durations[i],
                        description: experienceDescriptions[i]
                    });
                }
            }
        }

        // Validate that project skills are subset of main skills
        const allSkills = new Set(resumeData.skills);
        const hasInvalidSkills = resumeData.projects.some(project => {
            return project.skills.some(skill => !allSkills.has(skill));
        });

        if (hasInvalidSkills) {
            // Check if we have the notification function available (from firebase-client.js)
            if (typeof createNotification === 'function') {
                createNotification('Project skills must be selected from the main skills list', 'error');
            } else {
                // Fallback to alert if notification system is not available
                alert('Project skills must be selected from the main skills list');
            }
            return;
        }

        // Update review modal content and show it
        updateReviewContent(resumeData);
        showModal();
        
        // Log the data for debugging
        console.log('Resume data prepared:', resumeData);
    });

    // Final submit handler
    submitResumeButton.addEventListener('click', function() {
        // This function is now handled by firebase-client.js
        // The code is kept minimal as it might be called if firebase-client.js fails to initialize
        console.log('Submit button clicked, delegating to firebase-client.js...');

        // If firebase-client.js didn't take over, show an error message
        if (typeof window.handleResumeSubmit !== 'function') {
            console.error('Firebase client not initialized properly');
            alert('Error: Unable to submit resume. Please try again later.');
            return;
        }
    });

    // Event Listeners for modal controls
    closeButton.addEventListener('click', hideModal);
    editResumeButton.addEventListener('click', hideModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Edit section buttons
    editSectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.getAttribute('data-section');
            hideModal();
            setTimeout(() => {
                scrollToSection(section);
            }, 300);
        });
    });
}); 