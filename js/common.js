/* common.js - Shared Utilities (WITH SMART PROFILE CACHE & MERGED LOGS) */

// Utility functions
const Utils = {
  uid: (prefix = 'id') => {
    return prefix + Math.random().toString(36).slice(2, 9);
  },

  nowISO: () => {
    return new Date().toISOString();
  },

  formatDate: (isoString) => {
    if (!isoString) return 'N/A';
    if (isoString.toDate) {
      return isoString.toDate().toLocaleString();
    }
    return new Date(isoString).toLocaleString();
  },

  extractImageUrl: (url) => {
    if (!url) return null;
    if (url.includes('google.com/imgres')) {
      const match = url.match(/imgurl=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    return url;
  },

  formatImageUrl: (imgValue) => {
    if (!imgValue) {
      return '../img/machine-placeholder.png';
    }
    imgValue = Utils.extractImageUrl(imgValue);
    if (imgValue.startsWith('http')) {
      return imgValue;
    }
    if (!imgValue.startsWith('../img/')) {
      return '../img/' + imgValue;
    }
    return imgValue;
  }
};

// Validator object
const Validator = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  isInRange: (value, min, max) => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  isNotEmpty: (value) => {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  validateMachineData: (data) => {
    const errors = [];

    if (!Validator.isNotEmpty(data.name)) {
      errors.push('Machine name is required');
    }

    if (data.minTemp !== undefined && data.maxTemp !== undefined) {
      if (Number(data.minTemp) >= Number(data.maxTemp)) {
        errors.push('Min temperature must be less than max temperature');
      }
      if (!Validator.isInRange(data.minTemp, -50, 200)) {
        errors.push('Min temperature must be between -50°C and 200°C');
      }
      if (!Validator.isInRange(data.maxTemp, -50, 200)) {
        errors.push('Max temperature must be between -50°C and 200°C');
      }
    }

    if (data.minVib !== undefined && data.maxVib !== undefined) {
      if (Number(data.minVib) >= Number(data.maxVib)) {
        errors.push('Min vibration must be less than max vibration');
      }
      if (Number(data.minVib) < 0 || Number(data.maxVib) < 0) {
        errors.push('Vibration values cannot be negative');
      }
    }

    if (data.interval !== undefined) {
      if (!Validator.isInRange(data.interval, 1, 3600)) {
        errors.push('Report interval must be between 1 and 3600 seconds');
      }
    }

    if (data.img && data.img.startsWith('http')) {
      if (!Validator.isValidUrl(data.img)) {
        errors.push('Invalid image URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  validateSensorData: (data) => {
    const errors = [];

    if (data.temperature !== undefined) {
      if (!Validator.isInRange(data.temperature, -50, 200)) {
        errors.push('Temperature reading out of valid range (-50 to 200°C)');
      }
    }

    if (data.vibration !== undefined) {
      if (Number(data.vibration) < 0 || Number(data.vibration) > 100) {
        errors.push('Vibration reading out of valid range (0 to 100g)');
      }
    }

    if (data.timestamp) {
      const timestamp = new Date(data.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  validateProfileData: (data) => {
    const errors = [];

    if (!Validator.isNotEmpty(data.name)) {
      errors.push('Name is required');
    }

    if (!Validator.isNotEmpty(data.email)) {
      errors.push('Email is required');
    } else if (!Validator.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  showErrors: (errors) => {
    if (errors.length > 0) {
      alert('Validation Errors:\n\n' + errors.join('\n'));
    }
  }
};

// Profile Cache Manager
const ProfileCache = {
  KEY: 'cached_user_profile',
  
  save: (profile) => {
    try {
      localStorage.setItem(ProfileCache.KEY, JSON.stringify(profile));
      console.log('✅ Profile cached to localStorage');
    } catch (error) {
      console.error('❌ Failed to cache profile:', error);
    }
  },
  
  load: () => {
    try {
      const cached = localStorage.getItem(ProfileCache.KEY);
      if (cached) {
        console.log('✅ Profile loaded from cache (instant)');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('❌ Failed to load cached profile:', error);
    }
    return null;
  },
  
  clear: () => {
    try {
      localStorage.removeItem(ProfileCache.KEY);
      console.log('✅ Profile cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear profile cache:', error);
    }
  }
};

// Storage Manager
const Storage = {
  _cache: {
    machines: [],
    logs: [],
    reports: [],
    problems: [],
    profile: null
  },

  load: (key, defaultValue = []) => {
    if (key === CONFIG.STORAGE_KEYS.MACHINES) return Storage._cache.machines;
    if (key === CONFIG.STORAGE_KEYS.LOGS) return Storage._cache.logs;
    if (key === CONFIG.STORAGE_KEYS.REPORTS) return Storage._cache.reports;
    if (key === CONFIG.STORAGE_KEYS.PROBLEMS) return Storage._cache.problems;
    if (key === CONFIG.STORAGE_KEYS.PROFILE) return Storage._cache.profile || defaultValue;
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },

  save: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      ProfileCache.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// UI Helper functions
const UI = {
  showLoading: (elementId) => {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div></div>';
  },

  hideLoading: (elementId) => {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '';
  },

  showAlert: (message, type = 'info') => {
    alert(message);
  },

  confirm: (message) => {
    return window.confirm(message);
  },

  updateSidebar: async () => {
    const userId = Firebase.getCurrentUserId();
    if (!userId) return;

    let profile = ProfileCache.load();
    if (profile) {
      UI._displayProfile(profile);
    } else {
      const nameElements = document.querySelectorAll('#sbName, #sbN, #sbN2');
      nameElements.forEach(el => {
        if (el) el.textContent = 'Loading...';
      });
    }

    try {
      const freshProfile = await FirestoreDB.getUserProfile();
      if (freshProfile) {
        ProfileCache.save(freshProfile);
        Storage._cache.profile = freshProfile;
        UI._displayProfile(freshProfile);
      }
    } catch (error) {
      console.error('Failed to load profile from Firestore:', error);
    }
    UI.setupLogoutButton();
  },

  _displayProfile: (profile) => {
    const fullName = profile.name || `${profile.firstname || 'Demo'} ${profile.lastname || 'User'}`;
    const nameElements = document.querySelectorAll('#sbName, #sbN, #sbN2');
    nameElements.forEach(el => { if (el) el.textContent = fullName; });

    const emailElements = document.querySelectorAll('#sbEmail, #sbE, #sbE2');
    emailElements.forEach(el => { if (el) el.textContent = profile.email; });

    const machines = Storage._cache.machines;
    const countElements = document.querySelectorAll('#sbCount, #profileMachines, #countMd');
    countElements.forEach(el => {
      if (el) el.textContent = el.id === 'profileMachines' ? machines.length : `Machines: ${machines.length}`;
    });

    const photoUrl = profile.photo || '../img/user.jpg';
    const photoElements = document.querySelectorAll('.user-photo');
    photoElements.forEach(el => {
      if (el) {
        el.src = photoUrl;
        el.onerror = function() {
          this.onerror = null;
          this.src = '../img/user.jpg';
        };
      }
    });
  },

  setupLogoutButton: () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogout = document.getElementById('mobileLogout');

    const handleLogout = async () => {
      if (!UI.confirm('Are you sure you want to logout?')) return;
      const result = await Auth.logout();
      if (result.success) {
        Storage._cache.machines = [];
        Storage._cache.logs = [];
        Storage._cache.reports = [];
        Storage._cache.problems = [];
        Storage._cache.profile = null;
        ProfileCache.clear();
        window.location.replace('login-registration.html');
      } else {
        UI.showAlert('Logout failed', 'error');
      }
    };

    if (logoutBtn && !logoutBtn.hasAttribute('data-logout-initialized')) {
      logoutBtn.setAttribute('data-logout-initialized', 'true');
      logoutBtn.addEventListener('click', handleLogout);
    }
    if (mobileLogout && !mobileLogout.hasAttribute('data-logout-initialized')) {
      mobileLogout.setAttribute('data-logout-initialized', 'true');
      mobileLogout.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  }
};

// Machine Status Manager
const MachineStatus = {
  syncFromLogs: (machineId) => {
    const logs = Storage._cache.logs.filter(l => l.machineId === machineId);
    const hasNotFixed = logs.some(l => l.status === CONFIG.LOG_STATUS.NOT_FIXED);
    const hasInProgress = logs.some(l => l.status === CONFIG.LOG_STATUS.IN_PROGRESS);
    
    const machine = Storage._cache.machines.find(m => m.id === machineId);
    if (!machine) return;
    
    let newStatus = CONFIG.STATUS.GREEN;
    if (hasNotFixed) newStatus = CONFIG.STATUS.RED;
    else if (hasInProgress) newStatus = CONFIG.STATUS.YELLOW;
    
    FirestoreDB.updateMachine(machineId, { status: newStatus });
  },

  updateStatus: (machineId, newStatus) => {
    FirestoreDB.updateMachine(machineId, { status: newStatus });
  },

  getById: (machineId) => {
    return Storage._cache.machines.find(m => m.id === machineId) || null;
  }
};

/* common.js - Global Security System (UPGRADED) */

window.SecuritySystem = {
  isStarted: false,

  // Start listening to reports (called by auth.js)
  start: () => {
    if (window.SecuritySystem.isStarted) return; 
    window.SecuritySystem.isStarted = true;
    console.log("🛡️ Global Smart Security Guard Started");

    // 1. Run Cleanup on Start
    FirestoreDB.cleanupSystem();

    // 2. Listen for new reports
    Firebase.db.collection('reports')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot((snapshot) => {
        if (snapshot.empty) return;
        const report = snapshot.docs[0].data();
        const reportId = snapshot.docs[0].id;
        window.SecuritySystem.analyze(report, reportId);
      });
  },

  // Analyze report and Update/Create logs (Merged Logic)
  analyze: async (report, reportId) => {
    // 1. Find machine settings in cache
    const machine = Storage._cache.machines.find(m => m.id === report.machineId);
    if (!machine) return; 

    // 2. Detect Violations (Current Report)
    let faultProb = 0;
    let newIssues = [];

    // Force number comparison
    if (Number(report.temp) > Number(machine.maxTemp)) {
      faultProb += 40;
      newIssues.push(`High Temp (${Number(report.temp).toFixed(1)}°C)`);
    }
    
    if (Number(report.vib) > Number(machine.maxVib)) {
      faultProb += 40;
      newIssues.push(`High Vib (${Number(report.vib).toFixed(2)}g)`);
    }

    const soundStatus = report.sound || "Normal";
    if (soundStatus === "Bad") {
        faultProb += 50; 
        newIssues.push("AI Audio Anomaly");
    } else if (soundStatus === "Noise") {
        faultProb += 20; 
        newIssues.push("Abnormal Noise");
    }

    // 3. Handle Logic
    if (faultProb > 0) {
      // Find EXISTING open log for this machine
      const activeLogs = await Firebase.db.collection('logs')
        .where('machineId', '==', machine.id)
        .where('status', '==', 'not') 
        .get();

      if (!activeLogs.empty) {
        // === MERGE LOGIC ===
        const existingLogDoc = activeLogs.docs[0];
        const existingData = existingLogDoc.data();
        
        console.log(`⚠️ Global Guard: Merging new issues into existing log for ${machine.name}...`);
        
        // A. Sum Probabilities (Old + New, Max 100)
        // We take the existing probability and add the NEW probability calculated from the fresh report
        let oldProb = existingData.faultProbability || 0;
        let mergedProb = Math.min(oldProb + faultProb, 100);

        // B. Merge Messages
        // We take the old message and append new issues if they aren't already mentioned
        let currentMessage = existingData.message || "";
        let finalMessage = currentMessage;

        newIssues.forEach(issue => {
            // Check if this specific issue string is already in the message to avoid duplicates
            // Example: Don't add "High Temp" if "High Temp" is already there.
            // Simple check: splitting by keywords or just checking inclusion
            const keyword = issue.split('(')[0].trim(); // Get "High Temp" from "High Temp (50C)"
            if (!currentMessage.includes(keyword)) {
                if (finalMessage.length > 0) finalMessage += ", ";
                finalMessage += issue;
            }
        });

        // Update the log
        await Firebase.db.collection('logs').doc(existingLogDoc.id).update({
          message: finalMessage,
          faultProbability: mergedProb,
          // We update sensor data to the LATEST reading so the user sees current state
          temperature: report.temp,
          vibration: report.vib,
          sound: soundStatus,
          lastUpdated: Firebase.timestamp()
        });
        
      } else {
        // === CREATE NEW LOG ===
        // Check duplicate by reportId just in case to prevent double firing on same snapshot
        const duplicateCheck = await Firebase.db.collection('logs')
          .where('reportId', '==', reportId).get();

        if (duplicateCheck.empty) {
            console.log(`🚨 Global Guard: Creating NEW Log for ${machine.name}...`);
            
            await FirestoreDB.addLog({
                machineId: machine.id,
                message: newIssues.join(", "),
                faultProbability: Math.min(faultProb, 99),
                temperature: report.temp,
                vibration: report.vib,
                sound: soundStatus,
                status: CONFIG.LOG_STATUS.NOT_FIXED,
                reportId: reportId
            });
        }
      }
    }
  }
};