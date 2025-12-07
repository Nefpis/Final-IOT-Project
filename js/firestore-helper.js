/* firestore-helper.js - Firestore Database Operations Helper */

const FirestoreDB = {
  
    // ==================== MACHINES ====================
    
    // Get all machines for current user
    getMachines: async () => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const snapshot = await Firebase.db
          .collection('machines')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get();
  
        const machines = [];
        snapshot.forEach(doc => {
          machines.push({ id: doc.id, ...doc.data() });
        });
  
        console.log('✅ Fetched machines:', machines.length);
        return machines;
      } catch (error) {
        console.error('❌ Error fetching machines:', error);
        return [];
      }
    },
  
    // Add new machine
    addMachine: async (machineData) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const docRef = await Firebase.db.collection('machines').add({
          ...machineData,
          userId: userId,
          createdAt: Firebase.timestamp()
        });
  
        console.log('✅ Machine added:', docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding machine:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Update machine
    updateMachine: async (machineId, updates) => {
      try {
        await Firebase.db.collection('machines').doc(machineId).update({
          ...updates,
          updatedAt: Firebase.timestamp()
        });
  
        console.log('✅ Machine updated:', machineId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating machine:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Delete machine
    deleteMachine: async (machineId) => {
      try {
        await Firebase.db.collection('machines').doc(machineId).delete();
        console.log('✅ Machine deleted:', machineId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting machine:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Get single machine
    getMachine: async (machineId) => {
      try {
        const doc = await Firebase.db.collection('machines').doc(machineId).get();
        
        if (!doc.exists) {
          return null;
        }
  
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error('❌ Error fetching machine:', error);
        return null;
      }
    },
  
    // ==================== LOGS ====================
    
    // Get all logs for current user
    getLogs: async () => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const snapshot = await Firebase.db
          .collection('logs')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .get();
  
        const logs = [];
        snapshot.forEach(doc => {
          logs.push({ id: doc.id, ...doc.data() });
        });
  
        console.log('✅ Fetched logs:', logs.length);
        return logs;
      } catch (error) {
        console.error('❌ Error fetching logs:', error);
        return [];
      }
    },
  
    // Add new log
    addLog: async (logData) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const docRef = await Firebase.db.collection('logs').add({
          ...logData,
          userId: userId,
          timestamp: Firebase.timestamp()
        });
  
        console.log('✅ Log added:', docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding log:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Update log
    updateLog: async (logId, updates) => {
      try {
        await Firebase.db.collection('logs').doc(logId).update({
          ...updates,
          updatedAt: Firebase.timestamp()
        });
  
        console.log('✅ Log updated:', logId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating log:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Delete log
    deleteLog: async (logId) => {
      try {
        await Firebase.db.collection('logs').doc(logId).delete();
        console.log('✅ Log deleted:', logId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting log:', error);
        return { success: false, error: error.message };
      }
    },
  
    // ==================== PROBLEMS (SHARED) ====================
    
    // Get all problems (shared across all users)
    getProblems: async () => {
      try {
        const snapshot = await Firebase.db
          .collection('problems')
          .orderBy('createdAt', 'desc')
          .get();
  
        const problems = [];
        snapshot.forEach(doc => {
          problems.push({ id: doc.id, ...doc.data() });
        });
  
        console.log('✅ Fetched problems:', problems.length);
        return problems;
      } catch (error) {
        console.error('❌ Error fetching problems:', error);
        return [];
      }
    },
  
    // Add new problem
    addProblem: async (problemData) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const user = Auth.getCurrentUser();
  
        const docRef = await Firebase.db.collection('problems').add({
          ...problemData,
          createdByUserId: userId,
          createdBy: user.displayName || user.email,
          createdAt: Firebase.timestamp()
        });
  
        console.log('✅ Problem added:', docRef.id);
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding problem:', error);
        return { success: false, error: error.message };
      }
    },
  
    // Delete problem (only if user created it)
    deleteProblem: async (problemId, createdByUserId) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        // Check if user owns this problem
        if (userId !== createdByUserId) {
          return { success: false, error: 'You can only delete your own problems' };
        }
  
        await Firebase.db.collection('problems').doc(problemId).delete();
        console.log('✅ Problem deleted:', problemId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error deleting problem:', error);
        return { success: false, error: error.message };
      }
    },
  
    // ==================== REPORTS ====================
    
    // Get reports for current user
    getReports: async (limit = 100) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const snapshot = await Firebase.db
          .collection('reports')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
  
        const reports = [];
        snapshot.forEach(doc => {
          reports.push({ id: doc.id, ...doc.data() });
        });
  
        console.log('✅ Fetched reports:', reports.length);
        return reports;
      } catch (error) {
        console.error('❌ Error fetching reports:', error);
        return [];
      }
    },
  
    // Add report
    addReport: async (reportData) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        const docRef = await Firebase.db.collection('reports').add({
          ...reportData,
          userId: userId,
          timestamp: Firebase.timestamp()
        });
  
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error('❌ Error adding report:', error);
        return { success: false, error: error.message };
      }
    },
  
    // ==================== USER PROFILE ====================
    
    // Get user profile
    getUserProfile: async (userId = null) => {
      try {
        const uid = userId || Firebase.getCurrentUserId();
        if (!uid) throw new Error('User not authenticated');
  
        const doc = await Firebase.db.collection('users').doc(uid).get();
        
        if (!doc.exists) {
          return null;
        }
  
        return { id: doc.id, ...doc.data() };
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }
    },
  
    // Update user profile
    updateUserProfile: async (updates) => {
      try {
        const userId = Firebase.getCurrentUserId();
        if (!userId) throw new Error('User not authenticated');
  
        await Firebase.db.collection('users').doc(userId).update({
          ...updates,
          updatedAt: Firebase.timestamp()
        });
  
        console.log('✅ Profile updated');
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating profile:', error);
        return { success: false, error: error.message };
      }
    },

   // [UPDATED] Set the global machine ID for the Factory WiFi
  // [UPDATED] Set the global machine ID and NAME
  setEspTarget: async (machineId) => {
    try {
      const userId = Firebase.getCurrentUserId();
      const user = Auth.getCurrentUser();
      
      if (!userId) throw new Error('User not authenticated');

      // --- NEW STEP: Get the Machine Name ---
      let machineName = 'Unknown Machine';
      
      if (machineId) {
        // We look up the machine in the 'machines' collection to get its real name
        const machineDoc = await Firebase.db.collection('machines').doc(machineId).get();
        if (machineDoc.exists) {
          machineName = machineDoc.data().name; 
        }
      }
      // --------------------------------------

      // 1. Update User Profile
      await Firebase.db.collection('users').doc(userId).update({
        activeEspMachineId: machineId,
        updatedAt: Firebase.timestamp()
      });

      // 2. Update GLOBAL Settings with the NAME
      await Firebase.db.collection('esp32_settings').doc('wifi_factory').set({
        machineId: machineId,
        machineName: machineName, // <--- This creates the missing field!
        currentUserId: userId,
        reportInterval: reportInterval,
        timestamp: Firebase.timestamp(),
        lastUpdatedBy: user.email,
        lastUpdatedByName: user.displayName || 'Manager'
      }, { merge: true });

      console.log('✅ ESP Target Set:', machineName);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating ESP target:', error);
      return { success: false, error: error.message };
    }
  },
  
    // ==================== REAL-TIME LISTENERS ====================
  
    // Listen to machines changes
    listenToMachines: (callback) => {
      const userId = Firebase.getCurrentUserId();
      if (!userId) return null;
  
      return Firebase.db
        .collection('machines')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const machines = [];
          snapshot.forEach(doc => {
            machines.push({ id: doc.id, ...doc.data() });
          });
          callback(machines);
        });
    },
  
    // Listen to logs changes
    listenToLogs: (callback) => {
      const userId = Firebase.getCurrentUserId();
      if (!userId) return null;
  
      return Firebase.db
        .collection('logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
          const logs = [];
          snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
          });
          callback(logs);
        });
    },
  
    // Listen to problems changes (all users)
    listenToProblems: (callback) => {
      return Firebase.db
        .collection('problems')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const problems = [];
          snapshot.forEach(doc => {
            problems.push({ id: doc.id, ...doc.data() });
          });
          callback(problems);
        });
    }
  };
  
  // Export for use in other files
  window.FirestoreDB = FirestoreDB;