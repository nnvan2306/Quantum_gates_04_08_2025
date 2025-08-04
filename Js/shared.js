// Shared JavaScript for all pages

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu functionality
  setupMobileMenu();
  
  // Update authentication UI
  updateAuthUI();
  
  // Add smooth scrolling to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Mobile menu functionality
function setupMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
      
      // Toggle between menu and close icon
      const menuIcon = mobileMenuButton.querySelector('svg');
      if (menuIcon) {
        if (isExpanded) {
          menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
        } else {
          menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
        }
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        const menuIcon = mobileMenuButton.querySelector('svg');
        if (menuIcon) {
          menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
        }
      }
    });
  }
}

// Update authentication UI
function updateAuthUI() {
  const isLoggedIn = localStorage.getItem('token') !== null;
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  
  // Update desktop auth buttons
  const desktopLoginBtn = document.getElementById('desktop-login-btn');
  const desktopLogoutBtn = document.getElementById('desktop-logout-btn');
  const desktopRegisterBtn = document.getElementById('desktop-register-btn');
  
  // Update mobile auth buttons
  const mobileLoginBtn = document.getElementById('mobile-login-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const mobileRegisterBtn = document.getElementById('mobile-register-btn');
  
  if (isLoggedIn) {
    // Update desktop UI
    if (desktopLoginBtn) desktopLoginBtn.classList.add('hidden');
    if (desktopRegisterBtn) desktopRegisterBtn.classList.add('hidden');
    if (desktopLogoutBtn) desktopLogoutBtn.classList.remove('hidden');
    
    // Update mobile UI
    if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
    if (mobileRegisterBtn) mobileRegisterBtn.classList.add('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
    
    // Update user info if available
    const userElements = document.querySelectorAll('.user-info');
    userElements.forEach(el => {
      if (user && user.username) {
        el.textContent = user.username;
      }
    });
  } else {
    // Update desktop UI
    if (desktopLoginBtn) desktopLoginBtn.classList.remove('hidden');
    if (desktopRegisterBtn) desktopRegisterBtn.classList.remove('hidden');
    if (desktopLogoutBtn) desktopLogoutBtn.classList.add('hidden');
    
    // Update mobile UI
    if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
    if (mobileRegisterBtn) mobileRegisterBtn.classList.remove('hidden');
    if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
  }
  
  // Add logout functionality
  const logoutButtons = document.querySelectorAll('[id$="-logout-btn"]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', handleLogout);
  });
}

// Handle user logout
function handleLogout(e) {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI();
  window.location.href = 'index.html';
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Debounce function for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if user is authenticated
function isUserAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Format date to localized string
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('vi-VN', options);
}
