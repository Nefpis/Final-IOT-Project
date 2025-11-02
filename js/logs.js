/* logs.js - Logs & Predictions Page */

(() => {
  // Render logs by status
  function renderLogs() {
    const notFixedContainer = document.getElementById('notFixed');
    const inProgressContainer = document.getElementById('inProgress');
    const fixedContainer = document.getElementById('fixed');

    if (!notFixedContainer) return;

    const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
    
    // Clear containers
    notFixedContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    fixedContainer.innerHTML = '';

    if (logs.length === 0) {
      notFixedContainer.innerHTML = '<div class="text-muted text-center p-3">No logs yet</div>';
      return;
    }

    // Separate logs by status
    logs.forEach(log => {
      const logElement = createLogElement(log);
      
      if (log.status === CONFIG.LOG_STATUS.NOT_FIXED) {
        notFixedContainer.appendChild(logElement);
      } else if (log.status === CONFIG.LOG_STATUS.IN_PROGRESS) {
        inProgressContainer.appendChild(logElement);
      } else {
        fixedContainer.appendChild(logElement);
      }
    });

    // Attach event listeners
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
              <span>${log.sound}%</span>
            </div>
          ` : ''}
        </div>
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
      <div class="log-actions"></div>
    `;

    return el;
  }

  // Attach event listeners to log buttons
  function attachLogListeners() {
    // "Start Fix" buttons
    document.querySelectorAll('.btn-go').forEach(button => {
      button.addEventListener('click', (e) => {
        const logId = e.target.closest('.log-item').dataset.id;
        changeLogStatus(logId, CONFIG.LOG_STATUS.IN_PROGRESS);
      });
    });

    // "Done" buttons
    document.querySelectorAll('.btn-done').forEach(button => {
      button.addEventListener('click', (e) => {
        const logId = e.target.closest('.log-item').dataset.id;
        showFinishModal(logId);
      });
    });

    // "View" buttons
    document.querySelectorAll('.btn-view').forEach(button => {
      button.addEventListener('click', (e) => {
        const logId = e.target.closest('.log-item').dataset.id;
        viewLogDetails(logId);
      });
    });
  }

  // Change log status
  function changeLogStatus(logId, newStatus, description = '') {
    const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
    const logIndex = logs.findIndex(l => l.id === logId);

    if (logIndex === -1) {
      UI.showAlert('Log not found', 'error');
      return;
    }

    // Update log
    logs[logIndex].status = newStatus;
    if (description) {
      logs[logIndex].desc = description;
    }
    logs[logIndex].updatedAt = Utils.nowISO();

    Storage.save(CONFIG.STORAGE_KEYS.LOGS, logs);

    // Update machine status based on logs
    MachineStatus.syncFromLogs(logs[logIndex].machineId);

    // Re-render logs
    renderLogs();
    UI.showAlert('Log status updated', 'success');
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
    const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
    const log = logs.find(l => l.id === logId);

    if (!log) {
      UI.showAlert('Log not found', 'error');
      return;
    }

    const machine = MachineStatus.getById(log.machineId);
    const machineName = machine ? machine.name : log.machineId;

    const details = `
Log Details:
-----------
Machine: ${machineName}
Message: ${log.message}
Status: ${log.status}
Timestamp: ${log.timestamp ? Utils.formatDate(log.timestamp) : 'N/A'}
${log.faultProbability ? 'Fault Probability: ' + log.faultProbability + '%' : ''}
${log.desc ? '\nFix Description:\n' + log.desc : '\n(No fix description yet)'}
    `.trim();

    alert(details);
  }

  // Setup finish form
  function setupFinishForm() {
    const finishForm = document.getElementById('finishForm');
    if (!finishForm) return;

    finishForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const logId = document.getElementById('finishId').value;
      const description = document.getElementById('finishDesc').value.trim();

      if (!description) {
        UI.showAlert('Please describe the fix', 'warning');
        return;
      }

      // Update log to fixed status
      changeLogStatus(logId, CONFIG.LOG_STATUS.FIXED, description);

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('finishModal'));
      if (modal) modal.hide();
    });
  }

  // Add action buttons to log elements
  function updateLogActionButtons() {
    document.querySelectorAll('.log-item').forEach(logEl => {
      const logId = logEl.dataset.id;
      const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
      const log = logs.find(l => l.id === logId);

      if (!log) return;

      const actionsDiv = logEl.querySelector('.actions');
      if (!actionsDiv) return;

      // Add appropriate button based on status
      if (log.status === CONFIG.LOG_STATUS.NOT_FIXED) {
        actionsDiv.innerHTML = '<button class="btn btn-sm btn-primary btn-go">Start Fix</button>';
      } else if (log.status === CONFIG.LOG_STATUS.IN_PROGRESS) {
        actionsDiv.innerHTML = '<button class="btn btn-sm btn-success btn-done">Done</button>';
      } else {
        actionsDiv.innerHTML = '<button class="btn btn-sm btn-outline-secondary btn-view">View</button>';
      }
    });

    attachLogListeners();
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    renderLogs();
    setupFinishForm();
    updateLogActionButtons();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Refresh logs every 5 seconds to show new predictions
  setInterval(() => {
    renderLogs();
    updateLogActionButtons();
  }, 5000);
})();