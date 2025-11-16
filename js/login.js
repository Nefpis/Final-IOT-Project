/* login.js - Login & Registration Page Logic */

// Check if already logged in (using Firebase auth listener)
Auth.initAuthListener((user) => {
    if (user) {
      // User is logged in, redirect to dashboard
      const redirect = sessionStorage.getItem('redirect_after_login');
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirect || 'index.html';
    }
  });
  
  // Login form handler
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Show loading
    document.getElementById('loadingOverlay').classList.add('active');
    
    try {
      const result = await Auth.login(email, password);
      
      if (result.success) {
        alert('Login successful! Welcome back.');
        
        // Redirect handled by auth listener
        const redirect = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirect || 'index.html';
      } else {
        alert('Login failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      document.getElementById('loadingOverlay').classList.remove('active');
    }
  });
  
  // Register form handler
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstname = document.getElementById('register-firstname').value;
    const lastname = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const terms = document.getElementById('register-check').checked;
    
    if (!terms) {
      alert('Please accept the terms and conditions');
      return;
    }
    
    const fullName = `${firstname} ${lastname}`;
    
    // Show loading
    document.getElementById('loadingOverlay').classList.add('active');
    
    try {
      const result = await Auth.register(email, password, fullName);
      
      if (result.success) {
        alert('Registration successful! Welcome to TechPredict.');
        
        // Redirect handled by auth listener
        window.location.href = 'index.html';
      } else {
        alert('Registration failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } 
    finally {
      document.getElementById('loadingOverlay').classList.remove('active');
    }
  });
  
  // Forgot password form handler
  document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    // Show loading
    document.getElementById('loadingOverlay').classList.add('active');
    
    try {
      const result = await Auth.resetPassword(email);
      
      if (result.success) {
        alert(result.message);
        showLogin();
      } else {
        alert('Failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } 
    finally {
      document.getElementById('loadingOverlay').classList.remove('active');
    }
  });