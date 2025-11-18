/* auth.js - Firebase Authentication (SUPER FIXED VERSION) */

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

  // Login with Firebase - IMPROVED
  login: async (email, password) => {
    try {
      console.log('🔄 Attempting login for:', email);

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
      console.log('User ID:', user.uid);

      // Check if user profile exists in Firestore
      try {
        const profileDoc = await Firebase.db.collection('users').doc(user.uid).get();
        
        if (!profileDoc.exists) {
          console.warn('⚠️ User profile not found in Firestore, creating one...');
          
          // Create missing profile
          await Firebase.db.collection('users').doc(user.uid).set({
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            firstname: user.displayName?.split(' ')[0] || 'User',
            lastname: user.displayName?.split(' ').slice(1).join(' ') || '',
            photo: '../img/user.jpg',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('✅ Created missing profile');
        } else {
          console.log('✅ User profile found in Firestore');
        }
      } catch (profileError) {
        console.error('⚠️ Could not check/create profile:', profileError);
        // Continue anyway - not critical for login
      }

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
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle Firebase auth errors
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please register first.';
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
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Register with Firebase - SUPER FIXED VERSION
  register: async (email, password, name) => {
    try {
      console.log('🔄 Starting registration for:', email);
      console.log('Name:', name);

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

      // Step 1: Check if user already exists
      try {
        const methods = await Firebase.auth.fetchSignInMethodsForEmail(email);
        if (methods.length > 0) {
          console.warn('⚠️ User already exists with this email');
          return { success: false, error: 'An account with this email already exists. Please login instead.' };
        }
      } catch (checkError) {
        console.log('Could not check existing user, continuing...');
      }

      // Step 2: Create user with Firebase Auth
      console.log('🔄 Creating Firebase Auth user...');
      const userCredential = await Firebase.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      console.log('✅ User created in Firebase Auth');
      console.log('User ID:', user.uid);
      console.log('User email:', user.email);

      // Step 3: Update display name
      try {
        console.log('YAHOO');
         user.updateProfile({
          displayName: name
        });
        console.log('✅ Display name updated to:', name);
      } catch (profileError) {
        console.warn('⚠️ Could not update display name:', profileError.message);
        // Continue anyway
      }

      // Step 4: Create user profile in Firestore
      console.log('🔄 Creating Firestore profile document...');
      
      const nameParts = name.trim().split(' ');
      const firstname = nameParts[0] || 'User';
      const lastname = nameParts.slice(1).join(' ') || '';

      const profileData = {
        email: email,
        name: name,
        firstname: firstname,
        lastname: lastname,
        photo: '../img/user.jpg',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      console.log('Profile data:', profileData);
      console.log('Writing to path: users/' + user.uid);

      try {
        // Try to write to Firestore
        await Firebase.db.collection('users').doc(user.uid).set(profileData);
        console.log('✅ Firestore write successful!');

        // Verify it was created
        const verifyDoc = await Firebase.db.collection('users').doc(user.uid).get();
        if (verifyDoc.exists) {
          console.log('✅ Profile document verified!');
          console.log('Document data:', verifyDoc.data());
        } else {
          console.error('❌ Profile document not found after creation!');
        }

      } catch (firestoreError) {
        console.error('❌ Firestore error:', firestoreError);
        console.error('Error code:', firestoreError.code);
        console.error('Error message:', firestoreError.message);
        
        if (firestoreError.code === 'permission-denied') {
          alert(`
⚠️ FIRESTORE PERMISSION DENIED!

Your Firestore security rules are blocking profile creation.

FIX:
1. Go to Firebase Console
2. Click "Firestore Database"
3. Click "Rules" tab
4. Make sure rules allow authenticated users to write

Your account was created in Firebase Auth but profile creation failed.
You can still login, and the profile will be created automatically.
          `);
        }
        
        // Don't fail registration - profile will be created on login
        console.log('⚠️ Continuing despite Firestore error...');
      }

      console.log('✅ Registration process completed!');

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
          errorMessage = 'An account with this email already exists. Please login instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password authentication is not enabled. Check Firebase Console.';
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