/* config.js - Configuration and Constants */

// Storage Keys (will be replaced with Firebase later)
const CONFIG = {
  STORAGE_KEYS: {
    MACHINES: 'demo_machines_v2',
    LOGS: 'demo_logs_v2',
    REPORTS: 'demo_reports_v2',
    PROBLEMS: 'shared_problems_v2',  // Shared across all users
    PROFILE: 'demo_profile_v2',
    SELECTED_MACHINE: 'selectedMachine'
  },
  
  // Improved fault thresholds for professional industrial system
  FAULT_THRESHOLDS: {
    CRITICAL: 70,        // 70%+ = Critical (Red solid)
    HIGH: 50,            // 50-69% = High priority (Red blink + Yellow)
    MEDIUM: 30,          // 30-49% = Medium (Yellow + Green)
    LOW: 1               // 1-29% = Low (Green + Yellow dim)
    // 0% = All clear (Green only)
  },
  
  // Sensor weights for probability calculation
  SENSOR_WEIGHTS: {
    TEMPERATURE: 0.3,  // 30%
    VIBRATION: 0.4,    // 40%
    SOUND: 0.3         // 30%
  },
  
  // Default intervals
  DEFAULT_REPORT_INTERVAL: 15, // seconds
  
  // Status types (deprecated, now using dynamic light calculation)
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

/**
 * Calculate light status based on machine logs
 * Returns: {
 *   green: boolean,
 *   greenDim: boolean,
 *   yellow: boolean,
 *   yellowDim: boolean,
 *   red: boolean,
 *   redBlink: boolean,
 *   workInProgress: boolean
 * }
 */
CONFIG.calculateLightStatus = function(machineId) {
  const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
  const unfixedLogs = logs.filter(log => 
    log.machineId === machineId && 
    log.status !== CONFIG.LOG_STATUS.FIXED
  );

  // Check if any work in progress
  const hasInProgress = unfixedLogs.some(log => 
    log.status === CONFIG.LOG_STATUS.IN_PROGRESS
  );

  // If no unfixed logs, all clear
  if (unfixedLogs.length === 0) {
    return {
      green: true,
      greenDim: false,
      yellow: false,
      yellowDim: false,
      red: false,
      redBlink: false,
      workInProgress: false
    };
  }

  // Find highest fault probability
  const maxProbability = Math.max(...unfixedLogs.map(log => log.faultProbability || 0));

  // Determine light configuration based on severity
  if (maxProbability >= CONFIG.FAULT_THRESHOLDS.CRITICAL) {
    // CRITICAL (70%+): Red solid only
    return {
      green: false,
      greenDim: false,
      yellow: false,
      yellowDim: false,
      red: true,
      redBlink: false,
      workInProgress: hasInProgress
    };
  } 
  else if (maxProbability >= CONFIG.FAULT_THRESHOLDS.HIGH) {
    // HIGH PRIORITY (50-69%): Red blinking + Yellow solid
    return {
      green: false,
      greenDim: false,
      yellow: true,
      yellowDim: false,
      red: true,
      redBlink: true,
      workInProgress: hasInProgress
    };
  }
  else if (maxProbability >= CONFIG.FAULT_THRESHOLDS.MEDIUM) {
    // MEDIUM (30-49%): Yellow solid + Green solid
    return {
      green: true,
      greenDim: false,
      yellow: true,
      yellowDim: false,
      red: false,
      redBlink: false,
      workInProgress: hasInProgress
    };
  }
  else if (maxProbability >= CONFIG.FAULT_THRESHOLDS.LOW) {
    // LOW (1-29%): Green solid + Yellow dim
    return {
      green: true,
      greenDim: false,
      yellow: false,
      yellowDim: true,
      red: false,
      redBlink: false,
      workInProgress: hasInProgress
    };
  }
  else {
    // ALL CLEAR (0%): Green only
    return {
      green: true,
      greenDim: false,
      yellow: false,
      yellowDim: false,
      red: false,
      redBlink: false,
      workInProgress: hasInProgress
    };
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}