/* simulator.js - TEMPORARY DATA SIMULATOR FOR TESTING ONLY
 * This file simulates ESP32 sensor data until real hardware is connected
 * DELETE THIS FILE when ESP32 is integrated in Phase 4
 */

(() => {
    // Active simulators tracker
    window._simulators = window._simulators || {};
  
    // Generate random sensor reading within machine ranges
    function generateReading(machine) {
      const tempRange = machine.maxTemp - machine.minTemp;
      const vibRange = machine.maxVib - machine.minVib;
  
      // Random readings with 10% chance of being out of range (to create alerts)
      const outOfRange = Math.random() < 0.1; // 10% chance
  
      let temp, vib;
  
      if (outOfRange) {
        // Sometimes generate out-of-range values
        temp = machine.minTemp + (Math.random() * tempRange * 1.3) - (tempRange * 0.15);
        vib = machine.minVib + (Math.random() * vibRange * 1.3) - (vibRange * 0.15);
      } else {
        // Normal readings within range
        temp = machine.minTemp + (Math.random() * tempRange);
        vib = machine.minVib + (Math.random() * vibRange);
      }
  
      return {
        temperature: Number(temp.toFixed(2)),
        vibration: Number(vib.toFixed(3)),
        sound: Math.floor(Math.random() * 30), // 0-30 for normal sound (placeholder)
        timestamp: Utils.nowISO()
      };
    }
  
    // Calculate fault probability based on sensor readings
    function calculateFaultProbability(reading, machine) {
      let tempScore = 0;
      let vibScore = 0;
      let soundScore = reading.sound || 0;
  
      // Temperature score (0-100)
      if (reading.temperature < machine.minTemp) {
        tempScore = Math.min(100, Math.abs((reading.temperature - machine.minTemp) / machine.minTemp) * 100);
      } else if (reading.temperature > machine.maxTemp) {
        tempScore = Math.min(100, Math.abs((reading.temperature - machine.maxTemp) / machine.maxTemp) * 100);
      }
  
      // Vibration score (0-100)
      if (reading.vibration < machine.minVib) {
        vibScore = Math.min(100, Math.abs((reading.vibration - machine.minVib) / machine.minVib) * 100);
      } else if (reading.vibration > machine.maxVib) {
        vibScore = Math.min(100, Math.abs((reading.vibration - machine.maxVib) / machine.maxVib) * 100);
      }
  
      // Calculate weighted probability
      const probability = 
        (tempScore * CONFIG.SENSOR_WEIGHTS.TEMPERATURE) +
        (vibScore * CONFIG.SENSOR_WEIGHTS.VIBRATION) +
        (soundScore * CONFIG.SENSOR_WEIGHTS.SOUND);
  
      return Math.min(100, Math.floor(probability));
    }
  
    // Create log entry if threshold exceeded
    function checkAndCreateLog(reading, machine, probability) {
      // Only create log if probability exceeds warning threshold
      if (probability < CONFIG.FAULT_THRESHOLDS.WARNING) {
        return null;
      }
  
      const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
  
      // Check if similar log already exists (don't spam)
      const recentLog = logs.find(log => 
        log.machineId === machine.id && 
        log.status !== CONFIG.LOG_STATUS.FIXED &&
        Date.now() - new Date(log.timestamp).getTime() < 300000 // 5 minutes
      );
  
      if (recentLog) {
        return null; // Don't create duplicate
      }
  
      // Determine issue type
      let message = '';
      if (reading.temperature > machine.maxTemp) {
        message = `High temperature detected (${reading.temperature}°C)`;
      } else if (reading.temperature < machine.minTemp) {
        message = `Low temperature detected (${reading.temperature}°C)`;
      } else if (reading.vibration > machine.maxVib) {
        message = `High vibration detected (${reading.vibration}g)`;
      } else if (reading.vibration < machine.minVib) {
        message = `Low vibration detected (${reading.vibration}g)`;
      } else {
        message = `Abnormal readings detected`;
      }
  
      // Create new log
      const newLog = {
        id: Utils.uid('l'),
        machineId: machine.id,
        message: message,
        status: probability >= CONFIG.FAULT_THRESHOLDS.CRITICAL 
          ? CONFIG.LOG_STATUS.NOT_FIXED 
          : CONFIG.LOG_STATUS.NOT_FIXED,
        faultProbability: probability,
        temperature: reading.temperature,
        vibration: reading.vibration,
        sound: reading.sound,
        timestamp: reading.timestamp,
        desc: ''
      };
  
      logs.unshift(newLog);
      Storage.save(CONFIG.STORAGE_KEYS.LOGS, logs);
  
      return newLog;
    }
  
    // Start simulator for a machine
    function startSimulator(machine) {
      // Don't start if already running
      if (window._simulators[machine.id]) {
        return;
      }
  
      console.log(`[SIMULATOR] Starting for ${machine.name}`);
  
      const intervalId = setInterval(() => {
        // Generate reading
        const reading = generateReading(machine);
  
        // Save to reports
        const reports = Storage.load(CONFIG.STORAGE_KEYS.REPORTS, []);
        const report = {
          id: Utils.uid('r'),
          machineId: machine.id,
          machineName: machine.name,
          temp: reading.temperature,
          vib: reading.vibration,
          sound: reading.sound,
          timestamp: reading.timestamp,
          source: 'Simulator (Testing)'
        };
        
        reports.unshift(report);
        if (reports.length > 200) reports.pop(); // Keep last 200
        Storage.save(CONFIG.STORAGE_KEYS.REPORTS, reports);
  
        // Calculate fault probability
        const probability = calculateFaultProbability(reading, machine);
  
        // Check if log should be created
        const newLog = checkAndCreateLog(reading, machine, probability);
  
        // Update machine status if log created
        if (newLog) {
          MachineStatus.syncFromLogs(machine.id);
          console.log(`[SIMULATOR] Alert created for ${machine.name}: ${probability}%`);
        }
  
      }, (machine.interval || CONFIG.DEFAULT_REPORT_INTERVAL) * 1000);
  
      window._simulators[machine.id] = intervalId;
    }
  
    // Stop simulator for a machine
    function stopSimulator(machineId) {
      if (window._simulators[machineId]) {
        clearInterval(window._simulators[machineId]);
        delete window._simulators[machineId];
        console.log(`[SIMULATOR] Stopped for machine ${machineId}`);
      }
    }
  
    // Start all simulators
    function startAllSimulators() {
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      machines.forEach(machine => {
        startSimulator(machine);
      });
      console.log(`[SIMULATOR] Started ${machines.length} simulators`);
    }
  
    // Stop all simulators
    function stopAllSimulators() {
      Object.keys(window._simulators).forEach(machineId => {
        stopSimulator(machineId);
      });
      console.log('[SIMULATOR] All simulators stopped');
    }
  
    // Initialize simulators when page loads
    function init() {
      // Only start if machines exist
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      if (machines.length > 0) {
        startAllSimulators();
      }
  
      // Listen for new machines being added
      window.addEventListener('machineAdded', (e) => {
        if (e.detail && e.detail.machine) {
          startSimulator(e.detail.machine);
        }
      });
  
      // Listen for machines being deleted
      window.addEventListener('machineDeleted', (e) => {
        if (e.detail && e.detail.machineId) {
          stopSimulator(e.detail.machineId);
        }
      });
    }
  
    // Auto-start on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    // Expose control functions for debugging
    window.Simulator = {
      start: startSimulator,
      stop: stopSimulator,
      startAll: startAllSimulators,
      stopAll: stopAllSimulators,
      status: () => {
        console.log('Active simulators:', Object.keys(window._simulators).length);
        return window._simulators;
      }
    };
  
    console.log('[SIMULATOR] Data simulator loaded (TESTING MODE)');
    console.log('[SIMULATOR] Use window.Simulator.stopAll() to stop all simulators');
  })();