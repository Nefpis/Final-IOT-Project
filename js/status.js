/* status.js - Status Reports Page (FIRESTORE) */

(() => {
  let unsubscribeMachines = null;

  // Render status reports table
  function renderStatusReports() {
    const tbody = document.getElementById('statusTable');
    if (!tbody) return;

    const reports = Storage._cache.reports || [];
    tbody.innerHTML = '';

    if (reports.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No status reports yet</td></tr>';
      return;
    }

    // Show latest 100 reports
    reports.slice(0, 100).forEach(report => {
      const tr = document.createElement('tr');
      
      // Get machine for this report
      const machine = Storage._cache.machines.find(m => m.id === report.machineId);
      
      let rowClass = '';
      
      if (machine) {
        // Check if values are out of range
        const tempOutOfRange = report.temp < machine.minTemp || report.temp > machine.maxTemp;
        const vibOutOfRange = report.vib < machine.minVib || report.vib > machine.maxVib;
        
        if (tempOutOfRange || vibOutOfRange) {
          rowClass = 'table-danger';
        }
      }

      // Determine Sound Display
      const soundVal = report.sound || 'Normal';
      let soundClass = 'text-success'; // Default Green
      
      if (soundVal === 'Bad') {
          soundClass = 'text-danger fw-bold'; // Red for Bad
      } else if (soundVal === 'Noise') {
          soundClass = 'text-warning fw-bold'; // Orange/Yellow for Noise
      }

      tr.className = rowClass;
      tr.innerHTML = `
        <td>${Utils.formatDate(report.timestamp)}</td>
        <td>${report.machineName || 'Unknown'}</td>
        <td>${report.temp}°C</td>
        <td>${report.vib}g</td>
        <td class="${soundClass}">${soundVal}</td>
      `;
      
      tbody.appendChild(tr);
    });
  }

  // Filter reports by machine
  function filterReportsByMachine(machineId) {
    const tbody = document.getElementById('statusTable');
    if (!tbody) return;

    const reports = Storage._cache.reports || [];
    const filtered = machineId === 'all' 
      ? reports 
      : reports.filter(r => r.machineId === machineId);

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No reports found</td></tr>';
      return;
    }

    filtered.slice(0, 100).forEach(report => {
      const tr = document.createElement('tr');
      
      const soundVal = report.sound || 'Normal';
      let soundClass = 'text-success';
      if (soundVal === 'Bad') soundClass = 'text-danger fw-bold';
      else if (soundVal === 'Noise') soundClass = 'text-warning fw-bold';

      tr.innerHTML = `
        <td>${Utils.formatDate(report.timestamp)}</td>
        <td>${report.machineName || 'Unknown'}</td>
        <td>${report.temp}°C</td>
        <td>${report.vib}g</td>
        <td class="${soundClass}">${soundVal}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Setup machine filter dropdown
  function setupMachineFilter() {
    const filterSelect = document.getElementById('machineFilter');
    if (!filterSelect) return;

    const machines = Storage._cache.machines;
    
    // Clear existing options except "All"
    filterSelect.innerHTML = '<option value="all">All Machines</option>';
    
    // Add machine options
    machines.forEach(machine => {
      const option = document.createElement('option');
      option.value = machine.id;
      option.textContent = machine.name;
      filterSelect.appendChild(option);
    });

    // Add change event listener
    filterSelect.addEventListener('change', (e) => {
      filterReportsByMachine(e.target.value);
    });
  }

  // Export reports to CSV
  function exportToCSV() {
    const reports = Storage._cache.reports || [];
    
    if (reports.length === 0) {
      UI.showAlert('No reports to export', 'warning');
      return;
    }

    // Create CSV header - UPDATED with Sound
    let csv = 'Timestamp,Machine,Temperature (°C),Vibration (g),Sound\n';
    
    // Add data rows
    reports.forEach(report => {
      const soundVal = report.sound || 'Normal';
      csv += `"${Utils.formatDate(report.timestamp)}","${report.machineName}",${report.temp},${report.vib},"${soundVal}"\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-reports-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    UI.showAlert('Reports exported successfully', 'success');
  }

  // Setup export button
  function setupExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportToCSV);
    }
  }

  // Load reports from Firestore
  async function loadReports() {
    const reports = await FirestoreDB.getReports(100);
    Storage._cache.reports = reports;
    renderStatusReports();
  }

  // Setup real-time listeners
  function setupRealtimeListeners() {
    // Listen to machines (for filter dropdown)
    unsubscribeMachines = FirestoreDB.listenToMachines((machines) => {
      Storage._cache.machines = machines;
      setupMachineFilter();
    });

    // Refresh reports every 10 seconds (reports don't have built-in listener)
    setInterval(async () => {
      await loadReports();
    }, 10000);
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    loadReports();
    setupRealtimeListeners();
    setupMachineFilter();
    setupExportButton();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
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