// This script tag will be replaced with actual scripts.head content
if (window.scripts && window.scripts.head) {
  document.getElementById("header-scripts").outerHTML = window.scripts.head;
}

// render the settings object
//console.log('settings', [object Object]);
document.addEventListener("DOMContentLoaded", function () {
  tailwind.config = {
      theme: {
          extend: {
              colors: {
                  primary: {
                      DEFAULT: "#1E88E5",
                      50: "#f8f8f8",
                      100: "#e8e8e8",
                      200: "#d3d3d3",
                      300: "#a3a3a3",
                      400: "#737373",
                      500: "#525252",
                      600: "#404040",
                      700: "#262626",
                      800: "#171717",
                      900: "#0a0a0a",
                      950: "#030303",
                  },
                  secondary: {
                      DEFAULT: "#0D47A1",
                      50: "#f8f8f8",
                      100: "#e8e8e8",
                      200: "#d3d3d3",
                      300: "#a3a3a3",
                      400: "#737373",
                      500: "#525252",
                      600: "#404040",
                      700: "#262626",
                      800: "#171717",
                      900: "#0a0a0a",
                      950: "#030303",
                  },
                  accent: {
                      DEFAULT: "",
                      50: "#f8f8f8",
                      100: "#e8e8e8",
                      200: "#d3d3d3",
                      300: "#a3a3a3",
                      400: "#737373",
                      500: "#525252",
                      600: "#404040",
                      700: "#262626",
                      800: "#171717",
                      900: "#0a0a0a",
                      950: "#030303",
                  },
              },
              fontFamily: {
                  sans: ["Poppins, sans-serif", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
                  heading: ["Inter, sans-serif", "Inter", "system-ui", "sans-serif"],
                  body: ["Inter, sans-serif", "Inter", "system-ui", "sans-serif"],
              },
              spacing: {
                  "18": "4.5rem",
                  "22": "5.5rem",
                  "30": "7.5rem",
              },
              maxWidth: {
                  "8xl": "88rem",
                  "9xl": "96rem",
              },
              animation: {
                  "fade-in": "fadeIn 0.5s ease-in",
                  "fade-out": "fadeOut 0.5s ease-out",
                  "slide-up": "slideUp 0.5s ease-out",
                  "slide-down": "slideDown 0.5s ease-out",
                  "slide-left": "slideLeft 0.5s ease-out",
                  "slide-right": "slideRight 0.5s ease-out",
                  "scale-in": "scaleIn 0.5s ease-out",
                  "scale-out": "scaleOut 0.5s ease-out",
                  "spin-slow": "spin 3s linear infinite",
                  "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  "bounce-slow": "bounce 3s infinite",
                  float: "float 3s ease-in-out infinite",
              },
              keyframes: {
                  fadeIn: {
                      "0%": { opacity: "0" },
                      "100%": { opacity: "1" },
                  },
                  fadeOut: {
                      "0%": { opacity: "1" },
                      "100%": { opacity: "0" },
                  },
                  slideUp: {
                      "0%": { transform: "translateY(20px)", opacity: "0" },
                      "100%": { transform: "translateY(0)", opacity: "1" },
                  },
                  slideDown: {
                      "0%": { transform: "translateY(-20px)", opacity: "0" },
                      "100%": { transform: "translateY(0)", opacity: "1" },
                  },
                  slideLeft: {
                      "0%": { transform: "translateX(20px)", opacity: "0" },
                      "100%": { transform: "translateX(0)", opacity: "1" },
                  },
                  slideRight: {
                      "0%": { transform: "translateX(-20px)", opacity: "0" },
                      "100%": { transform: "translateX(0)", opacity: "1" },
                  },
                  scaleIn: {
                      "0%": { transform: "scale(0.9)", opacity: "0" },
                      "100%": { transform: "scale(1)", opacity: "1" },
                  },
                  scaleOut: {
                      "0%": { transform: "scale(1.1)", opacity: "0" },
                      "100%": { transform: "scale(1)", opacity: "1" },
                  },
                  float: {
                      "0%, 100%": { transform: "translateY(0)" },
                      "50%": { transform: "translateY(-10px)" },
                  },
              },
              aspectRatio: {
                  portrait: "3/4",
                  landscape: "4/3",
                  ultrawide: "21/9",
              },
          },
      },
      variants: {
          extend: {
              opacity: ["disabled"],
              cursor: ["disabled"],
              backgroundColor: ["active", "disabled"],
              textColor: ["active", "disabled"],
          },
      },
  };
});

document.addEventListener("DOMContentLoaded", function () {
  // Mobile Menu Functionality
  const initMobileMenu = () => {
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const closeMenuButton = document.getElementById("close-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileMenuLinks = mobileMenu?.querySelectorAll("a");

    if (!mobileMenuButton || !closeMenuButton || !mobileMenu) return;

    const toggleMobileMenu = () => {
        mobileMenu.classList.toggle("translate-x-full");
        mobileMenu.classList.toggle("translate-x-0");
    };

    mobileMenuButton.addEventListener("click", toggleMobileMenu);
    closeMenuButton.addEventListener("click", toggleMobileMenu);
    mobileMenuLinks?.forEach(link => link.addEventListener("click", toggleMobileMenu));
  };

  // Header Scroll Effect
  const initHeaderScroll = () => {
    const header = document.getElementById("header");
    if (!header) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 10) {
        header.classList.add("header-scrolled");
      } else {
        header.classList.remove("header-scrolled");
      }
    });
  };

  // Back to Top Button
  const initBackToTop = () => {
    const backToTopButton = document.getElementById("back-to-top");
    if (!backToTopButton) return;

    // Initially hide the button
    backToTopButton.classList.add('opacity-0', 'invisible');

    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.remove("opacity-0", "invisible");
        backToTopButton.classList.add("opacity-100", "visible");
      } else {
        backToTopButton.classList.remove("opacity-100", "visible");
        backToTopButton.classList.add("opacity-0", "invisible");
      }
    });

    backToTopButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  };

  // FAQ Accordion
  const initFAQ = () => {
    const faqToggles = document.querySelectorAll(".faq-toggle");
    if (!faqToggles.length) return;

    faqToggles.forEach(toggle => {
      toggle.addEventListener("click", function() {
        const content = this.nextElementSibling;
        const icon = this.querySelector(".faq-icon");
        const isExpanded = this.getAttribute("aria-expanded") === "true";

        // Close other FAQs
        faqToggles.forEach(otherToggle => {
          if (otherToggle !== toggle) {
            otherToggle.setAttribute("aria-expanded", "false");
            otherToggle.nextElementSibling?.classList.add("hidden");
            otherToggle.querySelector(".faq-icon")?.classList.remove("rotate-180");
          }
        });

        // Toggle current FAQ
        this.setAttribute("aria-expanded", !isExpanded);
        content?.classList.toggle("hidden");
        icon?.classList.toggle("rotate-180");
      });
    });
  };

  // Initialize all components
  initMobileMenu();
  initHeaderScroll();
  initFAQ();
  initBackToTop();
});
