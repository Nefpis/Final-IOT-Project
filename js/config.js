/* config.js - Configuration and Constants */

// Storage Keys (will be replaced with Firebase later)
const CONFIG = {
    STORAGE_KEYS: {
      MACHINES: 'demo_machines_v2',
      LOGS: 'demo_logs_v2',
      REPORTS: 'demo_reports_v2',
      PROBLEMS: 'demo_problems_v2',
      PROFILE: 'demo_profile_v2',
      SELECTED_MACHINE: 'selectedMachine'
    },
    
    // Sensor thresholds for fault detection (will be customizable per machine)
    FAULT_THRESHOLDS: {
      WARNING: 30,      // 30% - Yellow light
      CRITICAL: 60      // 60% - Red light
    },
    
    // Sensor weights for probability calculation
    SENSOR_WEIGHTS: {
      TEMPERATURE: 0.3,  // 30%
      VIBRATION: 0.4,    // 40%
      SOUND: 0.3         // 30%
    },
    
    // Default intervals
    DEFAULT_REPORT_INTERVAL: 15, // seconds
    
    // Status types
    STATUS: {
      GREEN: 'green',
      YELLOW: 'yellow',
      RED: 'red'
    },
    
    // Log status types
    LOG_STATUS: {
      NOT_FIXED: 'not',
      IN_PROGRESS: 'in',
      FIXED: 'fixed'
    }
  };
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
  }