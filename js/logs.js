/* logs.js - Logs & Predictions Page (FIRESTORE REAL-TIME) */

(() => {
  let unsubscribeLogs = null;
  let unsubscribeMachines = null;

  // Render logs by status
  function renderLogs() {
    const notFixedContainer = document.getElementById('notFixed');
    const inProgressContainer = document.getElementById('inProgress');
    const fixedContainer = document.getElementById('fixed');

    if (!notFixedContainer) return;

    const logs = Storage._cache.logs;
    
    // Clear containers
    notFixedContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    fixedContainer.innerHTML = '';

    // Separate logs by status
    const notFixedLogs = logs.filter(l => l.status === CONFIG.LOG_STATUS.NOT_FIXED);
    const inProgressLogs = logs.filter(l => l.status === CONFIG.LOG_STATUS.IN_PROGRESS);
    const fixedLogs = logs.filter(l => l.status === CONFIG.LOG_STATUS.FIXED);

    // Update counts
    const notFixedCount = document.getElementById('notFixedCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const fixedCount = document.getElementById('fixedCount');
    
    if (notFixedCount) notFixedCount.textContent = notFixedLogs.length;
    if (inProgressCount) inProgressCount.textContent = inProgressLogs.length;
    if (fixedCount) fixedCount.textContent = fixedLogs.length;

    // Render empty states or logs
    if (notFixedLogs.length === 0) {
      notFixedContainer.innerHTML = '<div class="empty-state"><div>✓</div><div>No critical issues</div></div>';
    } else {
      notFixedLogs.forEach(log => {
        notFixedContainer.appendChild(createLogElement(log));
      });
    }

    if (inProgressLogs.length === 0) {
      inProgressContainer.innerHTML = '<div class="empty-state"><div>✓</div><div>No ongoing fixes</div></div>';
    } else {
      inProgressLogs.forEach(log => {
        inProgressContainer.appendChild(createLogElement(log));
      });
    }

    if (fixedLogs.length === 0) {
      fixedContainer.innerHTML = '<div class="empty-state"><div>✓</div><div>No completed fixes yet</div></div>';
    } else {
      fixedLogs.forEach(log => {
        fixedContainer.appendChild(createLogElement(log));
      });
    }

    // Attach event listeners after rendering
    attachLogListeners();
  }

  // Create log element
  function createLogElement(log) {
    const el = document.createElement('div');
    el.className = 'log-item';
    el.dataset.id = log.id;

    // Get machine name
    const machine = MachineStatus.getById(log.machineId);
    const machineName = machine ? machine.name : log.machineId;

    // Determine probability badge class
    let probClass = 'prob-normal';
    if (log.faultProbability >= CONFIG.FAULT_THRESHOLDS.CRITICAL) {
      probClass = 'prob-critical';
    } else if (log.faultProbability >= CONFIG.FAULT_THRESHOLDS.WARNING) {
      probClass = 'prob-warning';
    }

    // Build sensor data display
    let sensorDataHtml = '';
    // Determine color for sound label
    let soundColor = '';
    if (log.sound === 'Problem') soundColor = 'text-danger fw-bold';
    else if (log.sound === 'Noise') soundColor = 'text-warning';

    if (log.temperature || log.vibration || log.sound !== undefined) {
      sensorDataHtml = `
        <div class="sensor-data">
          ${log.temperature ? `
            <div class="sensor-value">
              <span class="sensor-icon">🌡️</span>
              <span>${log.temperature}°C</span>
            </div>
          ` : ''}
          ${log.vibration ? `
            <div class="sensor-value">
              <span class="sensor-icon">📊</span>
              <span>${log.vibration}g</span>
            </div>
          ` : ''}
          ${log.sound !== undefined ? `
            <div class="sensor-value">
              <span class="sensor-icon">🔊</span>
              <span class="${soundColor}">${log.sound}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Build action buttons based on status
    let actionButtons = '';
    if (log.status === CONFIG.LOG_STATUS.NOT_FIXED) {
      actionButtons = `
        <button class="btn btn-sm btn-primary btn-start-fix">
          ▶️ Start Fix
        </button>
      `;
    } else if (log.status === CONFIG.LOG_STATUS.IN_PROGRESS) {
      actionButtons = `
        <button class="btn btn-sm btn-success btn-mark-done">
          ✅ Mark as Done
        </button>
      `;
    } else if (log.status === CONFIG.LOG_STATUS.FIXED) {
      actionButtons = `
        <button class="btn btn-sm btn-outline-secondary btn-view-details">
          👁️ View Details
        </button>
      `;
    }

    el.innerHTML = `
      <div class="log-header">
        <div class="log-title">${log.message}</div>
        ${log.faultProbability ? `
          <span class="probability-badge ${probClass}">
            ${log.faultProbability}%
          </span>
        ` : ''}
      </div>
      <div class="log-meta">
        <strong>Machine:</strong> ${machineName} • 
        <strong>Time:</strong> ${log.timestamp ? Utils.formatDate(log.timestamp) : 'N/A'}
      </div>
      ${sensorDataHtml}
      ${log.desc ? '<div class="small text-success mt-2"><strong>✅ Fix:</strong> ' + log.desc + '</div>' : ''}
      <div class="log-actions">
        ${actionButtons}
      </div>
    `;

    return el;
  }

  // Attach event listeners to log buttons
  function attachLogListeners() {
    // "Start Fix" buttons
    document.querySelectorAll('.btn-start-fix').forEach(button => {
      button.addEventListener('click', async (e) => {
        const logItem = e.target.closest('.log-item');
        const logId = logItem.dataset.id;
        await changeLogStatus(logId, CONFIG.LOG_STATUS.IN_PROGRESS);
      });
    });

    // "Mark as Done" buttons
    document.querySelectorAll('.btn-mark-done').forEach(button => {
      button.addEventListener('click', (e) => {
        const logItem = e.target.closest('.log-item');
        const logId = logItem.dataset.id;
        showFinishModal(logId);
      });
    });

    // "View Details" buttons
    document.querySelectorAll('.btn-view-details').forEach(button => {
      button.addEventListener('click', (e) => {
        const logItem = e.target.closest('.log-item');
        const logId = logItem.dataset.id;
        viewLogDetails(logId);
      });
    });
  }

  // Change log status - NOW USES FIRESTORE
  async function changeLogStatus(logId, newStatus, description = '') {
    const updates = {
      status: newStatus
    };

    if (description) {
      updates.desc = description;
    }

    const result = await FirestoreDB.updateLog(logId, updates);

    if (result.success) {
      // Find log to get machine ID
      const log = Storage._cache.logs.find(l => l.id === logId);
      if (log) {
        MachineStatus.syncFromLogs(log.machineId);
      }

      const statusName = newStatus === CONFIG.LOG_STATUS.IN_PROGRESS ? 'In Progress' : 
                         newStatus === CONFIG.LOG_STATUS.FIXED ? 'Fixed' : 'Not Fixed';
      UI.showAlert(`Log moved to ${statusName}`, 'success');
    } else {
      UI.showAlert('Failed to update log: ' + result.error, 'error');
    }
  }

  // Show finish modal
  function showFinishModal(logId) {
    const finishIdInput = document.getElementById('finishId');
    const finishDescInput = document.getElementById('finishDesc');
    
    if (finishIdInput) finishIdInput.value = logId;
    if (finishDescInput) finishDescInput.value = '';

    const modal = new bootstrap.Modal(document.getElementById('finishModal'));
    modal.show();
  }

  // View log details
  function viewLogDetails(logId) {
    const log = Storage._cache.logs.find(l => l.id === logId);

    if (!log) {
      UI.showAlert('Log not found', 'error');
      return;
    }

    const machine = MachineStatus.getById(log.machineId);
    const machineName = machine ? machine.name : log.machineId;

    const details = `
Log Details:
───────────
Machine: ${machineName}
Message: ${log.message}
Status: ${log.status}
Timestamp: ${log.timestamp ? Utils.formatDate(log.timestamp) : 'N/A'}
${log.faultProbability ? 'Fault Probability: ' + log.faultProbability + '%' : ''}
${log.temperature ? '\nTemperature: ' + log.temperature + '°C' : ''}
${log.vibration ? 'Vibration: ' + log.vibration + 'g' : ''}
${log.sound !== undefined ? 'Sound: ' + log.sound + '%' : ''}
${log.desc ? '\n\nFix Description:\n' + log.desc : '\n(No fix description yet)'}
    `.trim();

    alert(details);
  }

  // Setup finish form
  function setupFinishForm() {
    const finishForm = document.getElementById('finishForm');
    if (!finishForm) return;

    finishForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const logId = document.getElementById('finishId').value;
      const description = document.getElementById('finishDesc').value.trim();

      if (!description) {
        UI.showAlert('Please describe the fix', 'warning');
        return;
      }

      // Update log to fixed status
      await changeLogStatus(logId, CONFIG.LOG_STATUS.FIXED, description);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('finishModal'));
      if (modal) modal.hide();
    });
  }

  // Setup real-time listeners
  function setupRealtimeListeners() {
    // Listen to logs
    unsubscribeLogs = FirestoreDB.listenToLogs((logs) => {
      Storage._cache.logs = logs;
      renderLogs();
    });

    // Listen to machines (for machine names)
    unsubscribeMachines = FirestoreDB.listenToMachines((machines) => {
      Storage._cache.machines = machines;
      renderLogs(); // Re-render to update machine names
    });
  }

  // Initialize page
  function init() {

    setupRealtimeListeners();
    setupFinishForm();
    UI.updateSidebar();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribeLogs) unsubscribeLogs();
    if (unsubscribeMachines) unsubscribeMachines();
  });

  function startApp() {
    Auth.initAuthListener((user) => {
      if (user) {
        console.log("User found");
        // User is logged in, NOW we can initialize the page.
        init(); 
      } else {
        // No user, redirect to login.
        console.log("No user found, redirecting to login...");
        window.location.href = 'login-registration.html';
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();