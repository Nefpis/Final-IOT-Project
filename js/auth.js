/* auth.js - Authentication (Ready for Firebase Integration) */

const Auth = {
    // Current user (will be replaced with Firebase Auth)
    currentUser: null,
  
    // Check if user is logged in
    isAuthenticated: () => {
      // For now, check localStorage
      // Will be replaced with Firebase auth.currentUser
      const user = localStorage.getItem('demo_current_user');
      return user !== null;
    },
  
    // Get current user
    getCurrentUser: () => {
      // For now, get from localStorage
      // Will be replaced with Firebase auth.currentUser
      const userJson = localStorage.getItem('demo_current_user');
      return userJson ? JSON.parse(userJson) : null;
    },
  
    // Login (will be replaced with Firebase signInWithEmailAndPassword)
    login: async (email, password) => {
      try {
        // Validate input
        if (!Validator.isValidEmail(email)) {
          return { success: false, error: 'Invalid email format' };
        }
  
        if (!password || password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters' };
        }
  
        // TODO: Replace with Firebase authentication
        // For now, simulate login
        const user = {
          uid: Utils.uid('user'),
          email: email,
          displayName: email.split('@')[0],
          createdAt: Utils.nowISO()
        };
  
        // Save user
        localStorage.setItem('demo_current_user', JSON.stringify(user));
        Auth.currentUser = user;
  
        return { success: true, user: user };
  
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Register (will be replaced with Firebase createUserWithEmailAndPassword)
    register: async (email, password, name) => {
      try {
        // Validate input
        if (!Validator.isValidEmail(email)) {
          return { success: false, error: 'Invalid email format' };
        }
  
        if (!password || password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters' };
        }
  
        if (!name || name.trim().length < 2) {
          return { success: false, error: 'Name must be at least 2 characters' };
        }
  
        // TODO: Replace with Firebase authentication
        // For now, simulate registration
        const user = {
          uid: Utils.uid('user'),
          email: email,
          displayName: name,
          createdAt: Utils.nowISO()
        };
  
        // Save user
        localStorage.setItem('demo_current_user', JSON.stringify(user));
        Auth.currentUser = user;
  
        // Create default profile
        const profile = {
          name: name,
          email: email,
          photo: '../img/user.jpg'
        };
        Storage.save(CONFIG.STORAGE_KEYS.PROFILE, profile);
  
        return { success: true, user: user };
  
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Logout (will be replaced with Firebase signOut)
    logout: async () => {
      try {
        // TODO: Replace with Firebase signOut
        localStorage.removeItem('demo_current_user');
        Auth.currentUser = null;
  
        return { success: true };
  
      } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Password reset (will be replaced with Firebase sendPasswordResetEmail)
    resetPassword: async (email) => {
      try {
        if (!Validator.isValidEmail(email)) {
          return { success: false, error: 'Invalid email format' };
        }
  
        // TODO: Replace with Firebase sendPasswordResetEmail
        console.log('Password reset email sent to:', email);
        
        return { success: true, message: 'Password reset email sent' };
  
      } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Check auth state and redirect if needed
    requireAuth: () => {
      if (!Auth.isAuthenticated()) {
        // Save current page to redirect after login
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = 'login.html';
        return false;
      }
      return true;
    },
  
    // Redirect to dashboard if already logged in
    redirectIfAuthenticated: () => {
      if (Auth.isAuthenticated()) {
        const redirect = sessionStorage.getItem('redirect_after_login');
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirect || 'index.html';
        return true;
      }
      return false;
    },
  
    // Initialize auth state listener (will use Firebase onAuthStateChanged)
    initAuthListener: (callback) => {
      // TODO: Replace with Firebase onAuthStateChanged
      // For now, just call callback with current user
      const user = Auth.getCurrentUser();
      if (callback) callback(user);
    }
  };
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
  }