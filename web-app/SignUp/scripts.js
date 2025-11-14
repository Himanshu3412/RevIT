document.addEventListener('DOMContentLoaded', function() {
  // Debug log to check if script is loading
  console.log('Script loaded');

  // Get all the necessary elements
  const candidateBtn = document.getElementById('candidateSignupBtn');
  const recruiterBtn = document.getElementById('recruiterSignupBtn');
  const candidateModal = document.getElementById('candidateSignupModal');
  const recruiterModal = document.getElementById('recruiterSignupModal');
  const closeButtons = document.querySelectorAll('.close-button');
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMenuButton = document.getElementById('close-menu-button');

  // Function to open modal
  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  // Function to close modal
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Event Listeners for signup buttons
  if (candidateBtn) {
    candidateBtn.addEventListener('click', () => {
      openModal(candidateModal);
    });
  }

  if (recruiterBtn) {
    recruiterBtn.addEventListener('click', () => {
      openModal(recruiterModal);
    });
  }

  // Event Listeners for close buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  // Event Listeners for modal backdrops
  modalBackdrops.forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        const modal = backdrop.closest('.modal');
        closeModal(modal);
      }
    });
  });

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal:not(.hidden)');
      if (openModal) {
        closeModal(openModal);
      }
    }
  });

  // Mobile menu functionality
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.remove('hidden');
      mobileMenuButton.setAttribute('aria-expanded', 'true');
    });
  }

  if (closeMenuButton && mobileMenu) {
    closeMenuButton.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenuButton.setAttribute('aria-expanded', 'false');
    });
  }

  // Form submissions
  const candidateForm = document.getElementById('candidateForm');
  const recruiterForm = document.getElementById('recruiterForm');

  if (candidateForm) {
    candidateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Add your form submission logic here
      closeModal(candidateModal);
    });
  }

  if (recruiterForm) {
    recruiterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Add your form submission logic here
      closeModal(recruiterModal);
    });
  }
}); 