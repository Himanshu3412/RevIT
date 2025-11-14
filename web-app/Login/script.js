// This script tag will be replaced with actual scripts.head content
if (window.scripts && window.scripts.head) {
  document.getElementById("header-scripts").outerHTML = window.scripts.head;
}

// DOM Elements
document.addEventListener("DOMContentLoaded", function () {
  // Initialize background effects
  initializeBackgroundEffects();
  
  // Initialize particles.js
  initializeParticles();

  // Add form animation
  animateFormElements();

  // Add signup redirect functionality
  const signupButton = document.getElementById('toggle-signup');
  if (signupButton) {
    signupButton.addEventListener('click', function() {
      window.location.href = '../Signup/index.html';
    });
  }

  // Mobile menu functionality
  const openMenuBtn = document.getElementById('mobile-menu-button');
  const closeMenuBtn = document.getElementById('close-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const body = document.body;

  function toggleMobileMenu(show) {
    if (show) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.classList.add('fade-in');
      body.style.overflow = 'hidden';
    } else {
      mobileMenu.classList.add('fade-out');
      body.style.overflow = '';
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('fade-out');
      }, 300);
    }
  }

  openMenuBtn?.addEventListener('click', () => toggleMobileMenu(true));
  closeMenuBtn?.addEventListener('click', () => toggleMobileMenu(false));

  // Handle clicks outside mobile menu
  document.addEventListener('click', (e) => {
    if (mobileMenu && !mobileMenu.classList.contains('hidden') &&
        !e.target.closest('#mobile-menu') && 
        !e.target.closest('#mobile-menu-button')) {
      toggleMobileMenu(false);
    }
  });

  // Password visibility toggle
  const togglePasswordButtons = document.querySelectorAll('button[aria-label="Toggle password visibility"]');

  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.closest('.input-wrapper').querySelector('input');
      const type = input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);

      // Toggle eye icon
      const svg = this.querySelector("svg");
      if (type === "text") {
        svg.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        `;
      } else {
        svg.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
      }
    });
  });

  // Add interactive hover effects to buttons
  addButtonEffects();

  // Form validation with animations
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach((input) => {
      // Add focus animation
      input.addEventListener('focus', function() {
        this.classList.add('input-focused');
        // Add ripple effect around input field
        createRippleEffect(this);
      });

      input.addEventListener('blur', function() {
        this.classList.remove('input-focused');
        validateInput(this);
      });

      // Add shake animation for invalid inputs
      input.addEventListener('invalid', function(e) {
        e.preventDefault();
        this.classList.add('shake');
        setTimeout(() => this.classList.remove('shake'), 650);
      });
    });

    // Form submission handling
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      let isValid = true;
      
      inputs.forEach(input => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });

      if (isValid) {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Add success animation
        setTimeout(() => {
          submitBtn.classList.remove('loading');
          submitBtn.classList.add('success');
          submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Success!
          `;
          
          // Redirect after success animation
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('success');
            submitBtn.innerHTML = 'Sign In';
            window.location.href = '../Recruiter_Dashboard/index.html';
          }, 1500);
        }, 1500);
      }
    });
  });

  function validateInput(input) {
    let isValid = true;
    input.classList.remove('error');

    // Email validation
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(input.value);
      if (!isValid) {
        input.classList.add('error');
      }
    }

    // Password validation
    if (input.type === 'password') {
      isValid = input.value.length >= 8;
      if (!isValid) {
        input.classList.add('error');
      }
    }

    // Required field validation
    if (input.required && !input.value) {
      isValid = false;
      input.classList.add('error');
    }

    return isValid;
  }
});

// Background animation initialization
function initializeBackgroundEffects() {
  const container = document.querySelector('.background-effects');
  if (!container) return;

  // Create and position the glowing circles
  const colors = [
    'rgba(59, 130, 246, 0.3)',  // Blue
    'rgba(139, 92, 246, 0.3)',  // Purple
    'rgba(34, 211, 238, 0.3)',  // Cyan
    'rgba(99, 102, 241, 0.3)',  // Indigo
    'rgba(167, 139, 250, 0.3)'  // Violet
  ];

  const circles = [];
  for (let i = 0; i < 5; i++) {
    const circle = document.createElement('div');
    circle.className = 'glow-circle';
    
    // Randomize size between 200px and 400px
    const size = Math.random() * 200 + 200;
    
    // Set random position ensuring some overlap
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    
    // Set random animation duration and delay
    const duration = Math.random() * 4 + 5; // 5-9 seconds
    const delay = Math.random() * 3; // 0-3 seconds delay
    
    circle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${top}%;
      left: ${left}%;
      background-color: ${colors[i]};
      --duration: ${duration}s;
      --delay: ${delay}s;
      opacity: 0.8;
    `;
    
    container.appendChild(circle);
    circles.push(circle);
  }

  // Add subtle movement on mouse move
  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const moveX = (clientX - window.innerWidth / 2) * 0.02;
    const moveY = (clientY - window.innerHeight / 2) * 0.02;

    circles.forEach((circle, index) => {
      const depth = (index + 1) * 0.8;
      circle.style.transform = `translate(${moveX * depth}px, ${moveY * depth}px) scale(${1 + Math.sin(Date.now() * 0.001 + index) * 0.1})`;
    });
  });
}

// Initialize particles.js
function initializeParticles() {
  const particlesContainer = document.getElementById('particles-js');
  if (!particlesContainer) {
    // Create particles container if it doesn't exist
    const container = document.createElement('div');
    container.id = 'particles-js';
    document.querySelector('.background-effects').appendChild(container);
  }
  
  // Load particles.js script
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
  script.onload = () => {
    // Configure particles
    if (window.particlesJS) {
      window.particlesJS('particles-js', {
        "particles": {
          "number": {
            "value": 50,
            "density": {
              "enable": true,
              "value_area": 800
            }
          },
          "color": {
            "value": "#ffffff"
          },
          "shape": {
            "type": "circle",
            "stroke": {
              "width": 0,
              "color": "#000000"
            },
            "polygon": {
              "nb_sides": 5
            }
          },
          "opacity": {
            "value": 0.2,
            "random": true,
            "anim": {
              "enable": true,
              "speed": 0.5,
              "opacity_min": 0.1,
              "sync": false
            }
          },
          "size": {
            "value": 3,
            "random": true,
            "anim": {
              "enable": true,
              "speed": 2,
              "size_min": 0.1,
              "sync": false
            }
          },
          "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.1,
            "width": 1
          },
          "move": {
            "enable": true,
            "speed": 1,
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
              "enable": true,
              "rotateX": 600,
              "rotateY": 1200
            }
          }
        },
        "interactivity": {
          "detect_on": "canvas",
          "events": {
            "onhover": {
              "enable": true,
              "mode": "grab"
            },
            "onclick": {
              "enable": true,
              "mode": "push"
            },
            "resize": true
          },
          "modes": {
            "grab": {
              "distance": 140,
              "line_linked": {
                "opacity": 0.3
              }
            },
            "push": {
              "particles_nb": 3
            }
          }
        },
        "retina_detect": true
      });
    }
  };
  document.head.appendChild(script);
}

// Add animations to form elements when page loads
function animateFormElements() {
  const formHeader = document.querySelector('.form-header');
  const formInputs = document.querySelectorAll('.input-group');
  const formButtons = document.querySelectorAll('.btn, .social-btn');
  const formTexts = document.querySelectorAll('.social-divider, .signup-prompt');
  
  const elements = [formHeader, ...formInputs, ...formButtons, ...formTexts];
  
  // Staggered animation
  elements.forEach((element, index) => {
    if (element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = `opacity 0.5s ease, transform 0.5s ease`;
      element.style.transitionDelay = `${0.1 + index * 0.1}s`;
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100);
    }
  });
}

// Add interactive hover effects to buttons
function addButtonEffects() {
  const buttons = document.querySelectorAll('.btn, .social-btn');
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      createButtonHoverEffect(button);
    });
  });
}

// Create ripple effect when focusing on input fields
function createRippleEffect(input) {
  const parent = input.closest('.input-group');
  
  // Remove any existing ripple
  const existingRipple = parent.querySelector('.input-ripple');
  if (existingRipple) {
    existingRipple.remove();
  }
  
  // Create ripple element
  const ripple = document.createElement('div');
  ripple.className = 'input-ripple';
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%);
    animation: ripple-expand 1s ease-out forwards;
    pointer-events: none;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0;
  `;
  
  parent.style.position = 'relative';
  parent.appendChild(ripple);
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#ripple-keyframes')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'ripple-keyframes';
    styleSheet.textContent = `
      @keyframes ripple-expand {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 0.5; }
        100% { opacity: 0; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Animate
  setTimeout(() => ripple.style.opacity = '1', 0);
  setTimeout(() => ripple.remove(), 1000);
}

// Create button hover effect
function createButtonHoverEffect(button) {
  // Remove any existing effect
  const existingEffect = button.querySelector('.button-hover-effect');
  if (existingEffect) {
    existingEffect.remove();
  }
  
  // Create effect element
  const effect = document.createElement('div');
  effect.className = 'button-hover-effect';
  effect.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  button.style.position = 'relative';
  button.appendChild(effect);
  
  // Animate
  setTimeout(() => effect.style.opacity = '0.8', 0);
  button.addEventListener('mouseleave', () => {
    effect.style.opacity = '0';
    setTimeout(() => effect.remove(), 300);
  });
}

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(10px); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.4; }
  }

  .shake {
    animation: shake 0.65s cubic-bezier(.36,.07,.19,.97) both;
  }

  .loading {
    position: relative;
    pointer-events: none;
    opacity: 0.7;
  }

  .loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1.5em;
    height: 1.5em;
    margin: -0.75em 0 0 -0.75em;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .success {
    background: linear-gradient(to right, #34d399, #059669) !important;
    transform: scale(1.02);
    transition: all 0.3s ease;
  }
`;

document.head.appendChild(styleSheet);
