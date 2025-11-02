/* login.js - Login & Registration Page Logic */

(() => {
    // DOM elements
    const loginContainer = document.getElementById('login');
    const registerContainer = document.getElementById('register');
    const forgotPasswordContainer = document.getElementById('forgotPassword');
    const loadingOverlay = document.getElementById('loadingOverlay');
  
    // Form switching functions
    const FormSwitcher = {
      showLogin: () => {
        if (!loginContainer || !registerContainer) return;
        
        loginContainer.style.left = '4px';
        registerContainer.style.right = '-520px';
        loginContainer.style.opacity = '1';
        registerContainer.style.opacity = '0';
        
        if (forgotPasswordContainer) {
          forgotPasswordContainer.style.display = 'none';
        }
      },
  
      showRegister: () => {
        if (!loginContainer || !registerContainer) return;
        
        loginContainer.style.left = '-510px';
        registerContainer.style.right = '5px';
        loginContainer.style.opacity = '0';
        registerContainer.style.opacity = '1';
        
        if (forgotPasswordContainer) {
          forgotPasswordContainer.style.display = 'none';
        }
      },
  
      showForgotPassword: () => {
        if (!loginContainer || !registerContainer || !forgotPasswordContainer) return;
        
        loginContainer.style.left = '-510px';
        registerContainer.style.right = '-520px';
        forgotPasswordContainer.style.display = 'block';
        forgotPasswordContainer.style.right = '5px';
        forgotPasswordContainer.style.opacity = '1';
        loginContainer.style.opacity = '0';
        registerContainer.style.opacity = '0';
      }
    };
  
    // Loading indicator control
    const Loading = {
      show: () => {
        if (loadingOverlay) {
          loadingOverlay.classList.add('active');
        }
      },
  
      hide: () => {
        if (loadingOverlay) {
          loadingOverlay.classList.remove('active');
        }
      }
    };
  
    // Login form handler
    function setupLoginForm() {
      const loginForm = document.getElementById('loginForm');
      if (!loginForm) return;
  
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
  
        // Validate inputs
        if (!Validator.isValidEmail(email)) {
          UI.showAlert('Please enter a valid email address', 'warning');
          return;
        }
  
        if (!password || password.length < 6) {
          UI.showAlert('Password must be at least 6 characters', 'warning');
          return;
        }
  
        // Show loading
        Loading.show();
  
        try {
          const result = await Auth.login(email, password);
  
          if (result.success) {
            UI.showAlert('Login successful! Welcome back.', 'success');
            
            // Small delay for user to see success message
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 500);
          } else {
            UI.showAlert('Login failed: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('Login error:', error);
          UI.showAlert('An error occurred. Please try again.', 'error');
        } finally {
          Loading.hide();
        }
      });
    }
  
    // Registration form handler
    function setupRegisterForm() {
      const registerForm = document.getElementById('registerForm');
      if (!registerForm) return;
  
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const firstname = document.getElementById('register-firstname').value.trim();
        const lastname = document.getElementById('register-lastname').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const termsAccepted = document.getElementById('register-check').checked;
  
        // Validate inputs
        if (!firstname || firstname.length < 2) {
          UI.showAlert('First name must be at least 2 characters', 'warning');
          return;
        }
  
        if (!lastname || lastname.length < 2) {
          UI.showAlert('Last name must be at least 2 characters', 'warning');
          return;
        }
  
        if (!Validator.isValidEmail(email)) {
          UI.showAlert('Please enter a valid email address', 'warning');
          return;
        }
  
        if (!password || password.length < 6) {
          UI.showAlert('Password must be at least 6 characters', 'warning');
          return;
        }
  
        if (!termsAccepted) {
          UI.showAlert('Please accept the terms and conditions', 'warning');
          return;
        }
  
        const fullName = `${firstname} ${lastname}`;
  
        // Show loading
        Loading.show();
  
        try {
          const result = await Auth.register(email, password, fullName);
  
          if (result.success) {
            UI.showAlert('Registration successful! Welcome to TechPredict.', 'success');
            
            // Small delay for user to see success message
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 500);
          } else {
            UI.showAlert('Registration failed: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('Registration error:', error);
          UI.showAlert('An error occurred. Please try again.', 'error');
        } finally {
          Loading.hide();
        }
      });
    }
  
    // Forgot password form handler
    function setupForgotPasswordForm() {
      const forgotForm = document.getElementById('forgotForm');
      if (!forgotForm) return;
  
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const email = document.getElementById('forgot-email').value.trim();
  
        // Validate email
        if (!Validator.isValidEmail(email)) {
          UI.showAlert('Please enter a valid email address', 'warning');
          return;
        }
  
        // Show loading
        Loading.show();
  
        try {
          const result = await Auth.resetPassword(email);
  
          if (result.success) {
            UI.showAlert('Password reset link sent! Check your email.', 'success');
            
            // Return to login form
            setTimeout(() => {
              FormSwitcher.showLogin();
              forgotForm.reset();
            }, 1500);
          } else {
            UI.showAlert('Failed: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('Password reset error:', error);
          UI.showAlert('An error occurred. Please try again.', 'error');
        } finally {
          Loading.hide();
        }
      });
    }
  
    // Setup navigation links
    function setupNavigationLinks() {
      // Find all links that switch between forms
      const loginLinks = document.querySelectorAll('a[onclick*="login"]');
      const registerLinks = document.querySelectorAll('a[onclick*="register"]');
      const forgotLinks = document.querySelectorAll('a[onclick*="showForgotPassword"]');
  
      // Remove inline onclick and add proper event listeners
      loginLinks.forEach(link => {
        link.removeAttribute('onclick');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          FormSwitcher.showLogin();
        });
      });
  
      registerLinks.forEach(link => {
        link.removeAttribute('onclick');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          FormSwitcher.showRegister();
        });
      });
  
      forgotLinks.forEach(link => {
        link.removeAttribute('onclick');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          FormSwitcher.showForgotPassword();
        });
      });
    }
  
    // Check if user is already logged in
    function checkAuthStatus() {
      if (Auth.isAuthenticated()) {
        // User already logged in, redirect to dashboard
        window.location.href = 'index.html';
      }
    }
  
    // Initialize page
    function init() {
      // Check if already logged in
      checkAuthStatus();
  
      // Setup all forms
      setupLoginForm();
      setupRegisterForm();
      setupForgotPasswordForm();
      setupNavigationLinks();
  
      // Show login form by default
      FormSwitcher.showLogin();
  
      console.log('[LOGIN] Login page initialized');
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    // Expose form switcher for potential external use
    window.LoginPage = {
      showLogin: FormSwitcher.showLogin,
      showRegister: FormSwitcher.showRegister,
      showForgotPassword: FormSwitcher.showForgotPassword
    };
  })();