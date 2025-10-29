/* common.js - Shared Utilities and Functions */

// Utility functions
const Utils = {
    // Generate unique ID
    uid: (prefix = 'id') => {
      return prefix + Math.random().toString(36).slice(2, 9);
    },
  
    // Get current ISO timestamp
    nowISO: () => {
      return new Date().toISOString();
    },
  
    // Format date for display
    formatDate: (isoString) => {
      return new Date(isoString).toLocaleString();
    },
  
    // Extract image URL from Google Images link
    extractImageUrl: (url) => {
      if (!url) return null;
      
      // Check if it's a Google Images URL
      if (url.includes('google.com/imgres')) {
        const match = url.match(/imgurl=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      return url;
    },
  
    // Validate and format image URL
    formatImageUrl: (imgValue) => {
      if (!imgValue) {
        return '../img/machine-placeholder.png';
      }
      
      // Extract from Google Images if needed
      imgValue = Utils.extractImageUrl(imgValue);
      
      // If it's a full URL, use it
      if (imgValue.startsWith('http')) {
        return imgValue;
      }
      
      // If it doesn't have the img folder prefix, add it
      if (!imgValue.startsWith('../img/')) {
        return '../img/' + imgValue;
      }
      
      return imgValue;
    }
  };
  
  // Validator object for input validation
  const Validator = {
    // Email validation
    isValidEmail: (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
  
    // URL validation
    isValidUrl: (url) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },
  
    // Number range validation
    isInRange: (value, min, max) => {
      const num = Number(value);
      return !isNaN(num) && num >= min && num <= max;
    },
  
    // Required field validation
    isNotEmpty: (value) => {
      return value !== null && value !== undefined && String(value).trim() !== '';
    },
  
    // Machine data validation
    validateMachineData: (data) => {
      const errors = [];
  
      // Name is required
      if (!Validator.isNotEmpty(data.name)) {
        errors.push('Machine name is required');
      }
  
      // Temperature range validation
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
  
      // Vibration range validation
      if (data.minVib !== undefined && data.maxVib !== undefined) {
        if (Number(data.minVib) >= Number(data.maxVib)) {
          errors.push('Min vibration must be less than max vibration');
        }
        if (Number(data.minVib) < 0 || Number(data.maxVib) < 0) {
          errors.push('Vibration values cannot be negative');
        }
      }
  
      // Interval validation
      if (data.interval !== undefined) {
        if (!Validator.isInRange(data.interval, 1, 3600)) {
          errors.push('Report interval must be between 1 and 3600 seconds');
        }
      }
  
      // Image URL validation (if provided)
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
  
    // Sensor data validation (for ESP32 readings)
    validateSensorData: (data) => {
      const errors = [];
  
      // Temperature validation
      if (data.temperature !== undefined) {
        if (!Validator.isInRange(data.temperature, -50, 200)) {
          errors.push('Temperature reading out of valid range (-50 to 200°C)');
        }
      }
  
      // Vibration validation
      if (data.vibration !== undefined) {
        if (Number(data.vibration) < 0 || Number(data.vibration) > 100) {
          errors.push('Vibration reading out of valid range (0 to 100g)');
        }
      }
  
      // Sound validation (0-100 scale from Teachable Machine)
      if (data.sound !== undefined) {
        if (!Validator.isInRange(data.sound, 0, 100)) {
          errors.push('Sound reading out of valid range (0 to 100)');
        }
      }
  
      // Timestamp validation
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
  
    // Profile data validation
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
  
    // Display validation errors
    showErrors: (errors) => {
      if (errors.length > 0) {
        alert('Validation Errors:\n\n' + errors.join('\n'));
      }
    }
  };
  
  // Storage Manager (will be replaced with Firebase)
  const Storage = {
    // Save data
    save: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Storage save error:', error);
        return false;
      }
    },
  
    // Load data
    load: (key, defaultValue = []) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      } catch (error) {
        console.error('Storage load error:', error);
        return defaultValue;
      }
    },
  
    // Remove data
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Storage remove error:', error);
        return false;
      }
    },
  
    // Clear all data
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Storage clear error:', error);
        return false;
      }
    }
  };
  
  // UI Helper functions
  const UI = {
    // Show loading indicator
    showLoading: (elementId) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div></div>';
      }
    },
  
    // Hide loading indicator
    hideLoading: (elementId) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = '';
      }
    },
  
    // Show alert message
    showAlert: (message, type = 'info') => {
      alert(message); // Will be replaced with better UI later
    },
  
    // Confirm dialog
    confirm: (message) => {
      return window.confirm(message);
    },
  
    // Update sidebar counts and user info
    updateSidebar: () => {
      const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {
        name: 'Demo User',
        email: 'demo@example.com',
        photo: '../img/user.jpg'
      });
  
      // Update name
      const nameElements = document.querySelectorAll('#sbName, #sbN, #sbN2');
      nameElements.forEach(el => {
        if (el) el.textContent = profile.name;
      });
  
      // Update email
      const emailElements = document.querySelectorAll('#sbEmail, #sbE, #sbE2');
      emailElements.forEach(el => {
        if (el) el.textContent = profile.email;
      });
  
      // Update machine count
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      const countElements = document.querySelectorAll('#sbCount, #profileMachines, #countMd');
      countElements.forEach(el => {
        if (el) {
          el.textContent = el.id === 'profileMachines' ? machines.length : `Machines: ${machines.length}`;
        }
      });
  
      // Update profile photo if exists
      const photoElements = document.querySelectorAll('.user-photo');
      photoElements.forEach(el => {
        if (el && profile.photo) {
          el.src = profile.photo;
        }
      });
    }
  };
  
  // Machine Status Manager
  const MachineStatus = {
    // Sync machine status based on logs
    syncFromLogs: (machineId) => {
      const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, [])
        .filter(l => l.machineId === machineId);
      
      const hasNotFixed = logs.some(l => l.status === CONFIG.LOG_STATUS.NOT_FIXED);
      const hasInProgress = logs.some(l => l.status === CONFIG.LOG_STATUS.IN_PROGRESS);
      
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      const machineIndex = machines.findIndex(m => m.id === machineId);
      
      if (machineIndex === -1) return;
      
      // Update status based on logs
      if (hasNotFixed) {
        machines[machineIndex].status = CONFIG.STATUS.RED;
      } else if (hasInProgress) {
        machines[machineIndex].status = CONFIG.STATUS.YELLOW;
      } else {
        machines[machineIndex].status = CONFIG.STATUS.GREEN;
      }
      
      Storage.save(CONFIG.STORAGE_KEYS.MACHINES, machines);
    },
  
    // Update machine status directly
    updateStatus: (machineId, newStatus) => {
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      const machineIndex = machines.findIndex(m => m.id === machineId);
      
      if (machineIndex !== -1) {
        machines[machineIndex].status = newStatus;
        Storage.save(CONFIG.STORAGE_KEYS.MACHINES, machines);
        return true;
      }
      return false;
    },
  
    // Get machine by ID
    getById: (machineId) => {
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      return machines.find(m => m.id === machineId) || null;
    }
  };