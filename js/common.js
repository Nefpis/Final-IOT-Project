/* common.js - Shared Utilities (WITH SMART PROFILE CACHE) */

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

    if (data.sound !== undefined) {
      if (!Validator.isInRange(data.sound, 0, 100)) {
        errors.push('Sound reading out of valid range (0 to 100)');
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

// Profile Cache Manager - NEW!
const ProfileCache = {
  KEY: 'cached_user_profile',
  
  // Save profile to localStorage for instant access
  save: (profile) => {
    try {
      localStorage.setItem(ProfileCache.KEY, JSON.stringify(profile));
      console.log('✅ Profile cached to localStorage');
    } catch (error) {
      console.error('❌ Failed to cache profile:', error);
    }
  },
  
  // Load profile from localStorage (instant!)
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
  
  // Clear cache (on logout)
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
    if (key === CONFIG.STORAGE_KEYS.MACHINES) {
      return Storage._cache.machines;
    }
    if (key === CONFIG.STORAGE_KEYS.LOGS) {
      return Storage._cache.logs;
    }
    if (key === CONFIG.STORAGE_KEYS.REPORTS) {
      return Storage._cache.reports;
    }
    if (key === CONFIG.STORAGE_KEYS.PROBLEMS) {
      return Storage._cache.problems;
    }
    if (key === CONFIG.STORAGE_KEYS.PROFILE) {
      return Storage._cache.profile || defaultValue;
    }
    
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
      // Clear everything including profile cache
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
    if (el) {
      el.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div></div>';
    }
  },

  hideLoading: (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.innerHTML = '';
    }
  },

  showAlert: (message, type = 'info') => {
    alert(message);
  },

  confirm: (message) => {
    return window.confirm(message);
  },

  // Update sidebar - WITH INSTANT CACHE LOADING
  updateSidebar: async () => {
    const userId = Firebase.getCurrentUserId();
    if (!userId) return;

    // STEP 1: Load from cache FIRST (instant display!)
    let profile = ProfileCache.load();
    
    if (profile) {
      // Display cached profile immediately (no "Loading...")
      UI._displayProfile(profile);
    } else {
      // Show loading only if no cache exists
      const nameElements = document.querySelectorAll('#sbName, #sbN, #sbN2');
      nameElements.forEach(el => {
        if (el) el.textContent = 'Loading...';
      });
    }

    // STEP 2: Load from Firestore in background and update cache
    try {
      const freshProfile = await FirestoreDB.getUserProfile();
      
      if (freshProfile) {
        // Update cache with fresh data
        ProfileCache.save(freshProfile);
        Storage._cache.profile = freshProfile;
        
        // Update display with fresh data
        UI._displayProfile(freshProfile);
      }
    } catch (error) {
      console.error('Failed to load profile from Firestore:', error);
      // If cache exists, continue using it
      if (!profile) {
        console.error('No cached profile available');
      }
    }

    UI.setupLogoutButton();
  },

  // Internal helper to display profile
  _displayProfile: (profile) => {
    const fullName = profile.name || `${profile.firstname || 'Demo'} ${profile.lastname || 'User'}`;

    const nameElements = document.querySelectorAll('#sbName, #sbN, #sbN2');
    nameElements.forEach(el => {
      if (el) el.textContent = fullName;
    });

    const emailElements = document.querySelectorAll('#sbEmail, #sbE, #sbE2');
    emailElements.forEach(el => {
      if (el) el.textContent = profile.email;
    });

    const machines = Storage._cache.machines;
    const countElements = document.querySelectorAll('#sbCount, #profileMachines, #countMd');
    countElements.forEach(el => {
      if (el) {
        el.textContent = el.id === 'profileMachines' ? machines.length : `Machines: ${machines.length}`;
      }
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
        // Clear ALL caches
        Storage._cache.machines = [];
        Storage._cache.logs = [];
        Storage._cache.reports = [];
        Storage._cache.problems = [];
        Storage._cache.profile = null;
        ProfileCache.clear();
        
        // Force redirect
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
    
    const machines = Storage._cache.machines;
    const machine = machines.find(m => m.id === machineId);
    
    if (!machine) return;
    
    let newStatus = CONFIG.STATUS.GREEN;
    if (hasNotFixed) {
      newStatus = CONFIG.STATUS.RED;
    } else if (hasInProgress) {
      newStatus = CONFIG.STATUS.YELLOW;
    }
    
    FirestoreDB.updateMachine(machineId, { status: newStatus });
  },

  updateStatus: (machineId, newStatus) => {
    FirestoreDB.updateMachine(machineId, { status: newStatus });
  },

  getById: (machineId) => {
    return Storage._cache.machines.find(m => m.id === machineId) || null;
  }
};