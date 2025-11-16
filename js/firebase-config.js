import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBd5Ir67GeDAF90gJampdvqxdviSLRNx7E",
  authDomain: "techpredict-6fc58.firebaseapp.com",
  projectId: "techpredict-6fc58",
  storageBucket: "techpredict-6fc58.firebasestorage.app",
  messagingSenderId: "673955585835",
  appId: "1:673955585835:web:703ae68eea6f11b5c5af6e",
  measurementId: "G-PG09M126ZQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence (optional but recommended)
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

// Export for use in other files
window.Firebase = {
  auth: auth,
  db: db,
  
  // Helper to get current user ID
  getCurrentUserId: () => {
    const user = auth.currentUser;
    return user ? user.uid : null;
  },
  
  // Helper to check if user is authenticated
  isAuthenticated: () => {
    return auth.currentUser !== null;
  },
  
  // Timestamp helper
  timestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
  
  // Server timestamp for queries
  serverTimestamp: firebase.firestore.FieldValue.serverTimestamp
};

console.log('🔥 Firebase initialized successfully!');
console.log('📊 Firestore ready');
console.log('🔐 Authentication ready');