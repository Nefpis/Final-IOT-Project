/* auth.js - Firebase Authentication */

const Auth = {
  // Current user (Firebase manages this)
  currentUser: null,

  // Check if user is logged in
  isAuthenticated: () => {
    return Firebase.auth.currentUser !== null;
  },

  // Get current user
  getCurrentUser: () => {
    const user = Firebase.auth.currentUser;
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  },

  // Login with Firebase
  login: async (email, password) => {
    try {
      // Validate input
      if (!Validator.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Sign in with Firebase
      const userCredential = await Firebase.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('✅ Login successful:', user.email);

      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0]
        }
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle Firebase auth errors
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Register with Firebase
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

      console.log('🔄 Starting registration for:', email);

      // Create user with Firebase
      const userCredential = await Firebase.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('✅ Firebase user created:', user.uid);

      // Update display name
      try {
        await user.updateProfile({
          displayName: name
        });
        console.log('✅ Display name updated');
      } catch (profileError) {
        console.warn('⚠️ Could not update display name:', profileError);
      }

      // Create user profile in Firestore
      try {
        const profileData = {
          email: email,
          name: name,
          firstname: name.split(' ')[0] || 'User',
          lastname: name.split(' ').slice(1).join(' ') || '',
          photo: '../img/user.jpg',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('🔄 Creating Firestore profile:', profileData);

        await Firebase.db.collection('users').doc(user.uid).set(profileData);

        console.log('✅ User profile created in Firestore!');
        console.log('📊 Check Firebase Console → Firestore Database → users collection');

      } catch (firestoreError) {
        console.error('❌ Firestore profile creation failed:', firestoreError);
        console.error('Error details:', firestoreError.code, firestoreError.message);
        // Don't fail registration if profile creation fails
      }

      return { 
        success: true, 
        user: {
          uid: user.uid,
          email: user.email,
          displayName: name
        }
      };

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle Firebase auth errors
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Logout with Firebase
  logout: async () => {
    try {
      await Firebase.auth.signOut();
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Password reset with Firebase
  resetPassword: async (email) => {
    try {
      if (!Validator.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      await Firebase.auth.sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent to:', email);
      
      return { success: true, message: 'Password reset email sent! Check your inbox.' };

    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Check auth state and redirect if needed
  requireAuth: () => {
    if (!Auth.isAuthenticated()) {
      // Save current page to redirect after login
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      window.location.href = 'login-registration.html';
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

  // Initialize auth state listener
  initAuthListener: (callback) => {
    Firebase.auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('🔐 User authenticated:', user.email);
        Auth.currentUser = user;
        if (callback) callback(user);
      } else {
        console.log('🔓 User not authenticated');
        Auth.currentUser = null;
        if (callback) callback(null);
      }
    });
  }
};

// Initialize auth listener when script loads
Auth.initAuthListener();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}