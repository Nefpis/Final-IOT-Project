/* status.js - Status Reports Page */

(() => {
    // Render status reports table
    function renderStatusReports() {
      const tbody = document.getElementById('statusTable');
      if (!tbody) return;
  
      const reports = Storage.load(CONFIG.STORAGE_KEYS.REPORTS, []);
      tbody.innerHTML = '';
  
      if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No status reports yet</td></tr>';
        return;
      }
  
      // Show latest 100 reports
      reports.slice(0, 100).forEach(report => {
        const tr = document.createElement('tr');
        
        // Add class based on values (optional highlighting)
        const machine = MachineStatus.getById(report.machineId);
        let rowClass = '';
        
        if (machine) {
          // Check if values are out of range
          const tempOutOfRange = report.temp < machine.minTemp || report.temp > machine.maxTemp;
          const vibOutOfRange = report.vib < machine.minVib || report.vib > machine.maxVib;
          
          if (tempOutOfRange || vibOutOfRange) {
            rowClass = 'table-danger';
          }
        }
  
        tr.className = rowClass;
        tr.innerHTML = `
          <td>${Utils.formatDate(report.timestamp)}</td>
          <td>${report.machineName || 'Unknown'}</td>
          <td>${report.temp}°C</td>
          <td>${report.vib}g</td>
          <td class="small text-muted">${report.source || 'Auto report'}</td>
        `;
        
        tbody.appendChild(tr);
      });
    }
  
    // Filter reports by machine
    function filterReportsByMachine(machineId) {
      const tbody = document.getElementById('statusTable');
      if (!tbody) return;
  
      const reports = Storage.load(CONFIG.STORAGE_KEYS.REPORTS, []);
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
        tr.innerHTML = `
          <td>${Utils.formatDate(report.timestamp)}</td>
          <td>${report.machineName || 'Unknown'}</td>
          <td>${report.temp}°C</td>
          <td>${report.vib}g</td>
          <td class="small text-muted">${report.source || 'Auto report'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  
    // Setup machine filter dropdown
    function setupMachineFilter() {
      const filterSelect = document.getElementById('machineFilter');
      if (!filterSelect) return;
  
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      
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
      const reports = Storage.load(CONFIG.STORAGE_KEYS.REPORTS, []);
      
      if (reports.length === 0) {
        UI.showAlert('No reports to export', 'warning');
        return;
      }
  
      // Create CSV header
      let csv = 'Timestamp,Machine,Temperature (°C),Vibration (g),Source\n';
      
      // Add data rows
      reports.forEach(report => {
        csv += `"${Utils.formatDate(report.timestamp)}","${report.machineName}",${report.temp},${report.vib},"${report.source || 'Auto report'}"\n`;
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
  
    // Initialize page
    function init() {
      UI.updateSidebar();
      renderStatusReports();
      setupMachineFilter();
      setupExportButton();
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
    // Auto-refresh every 10 seconds
    setInterval(() => {
      renderStatusReports();
    }, 10000);
  })();