/* login.js - Login & Registration Page Logic */

// Check if already logged in
if (Auth.isAuthenticated()) {
    window.location.href = 'index.html';
}

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
            window.location.href = 'index.html';
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
            alert('Password reset link sent! Check your email.');
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