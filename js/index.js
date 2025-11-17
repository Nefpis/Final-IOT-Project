/* index.js - Machines Dashboard (NOW USING FIRESTORE) */

(() => {
  let unsubscribeMachines = null;
  let unsubscribeLogs = null;

  // Render machines grid
  function renderMachines() {
    const container = document.getElementById('machinesRow');
    if (!container) return;

    const machines = Storage._cache.machines;
    container.innerHTML = '';

    if (machines.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-muted p-5">No machines yet. Click + to add your first machine.</div>';
      return;
    }

    machines.forEach(machine => {
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-md-4';
      
      const imgSrc = machine.img || '../img/machine-placeholder.png';
      
      const lightStatus = CONFIG.calculateLightStatus(machine.id);
      
      const greenClass = lightStatus.green ? 'active' : (lightStatus.greenDim ? 'dim' : '');
      const yellowClass = lightStatus.yellow ? 'active' : (lightStatus.yellowDim ? 'dim' : '');
      const redClass = lightStatus.red ? (lightStatus.redBlink ? 'active blinking' : 'active') : '';
      
      const wipClass = lightStatus.workInProgress ? 'work-in-progress' : '';
      
      col.innerHTML = `
        <div class="card card-machine h-100" data-id="${machine.id}">
          <div class="img-wrap">
            <img src="${imgSrc}" 
                 onerror="this.onerror=null; this.src='../img/machine-placeholder.png'"
                 alt="${machine.name}">
          </div>
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="mb-0">${machine.name}</h5>
              <div class="status-lights ${wipClass}" title="${lightStatus.workInProgress ? 'Fix in progress' : ''}">
                <span class="light green ${greenClass}"></span>
                <span class="light yellow ${yellowClass}"></span>
                <span class="light red ${redClass}"></span>
              </div>
            </div>
            <p class="small text-muted mt-2 mb-3">
              Interval: ${machine.interval}s • Temp ${machine.minTemp}-${machine.maxTemp}°C
            </p>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm btn-open">Open</button>
              <button class="btn btn-outline-danger btn-sm btn-delete">Delete</button>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(col);
    });

    attachMachineCardListeners();
  }

  function attachMachineCardListeners() {
    document.querySelectorAll('.btn-open').forEach(button => {
      button.addEventListener('click', (e) => {
        const machineId = e.target.closest('.card').dataset.id;
        Storage.save(CONFIG.STORAGE_KEYS.SELECTED_MACHINE, machineId);
        window.location.href = 'machine.html';
      });
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', async (e) => {
        if (!UI.confirm('Are you sure you want to delete this machine?')) return;
        
        const machineId = e.target.closest('.card').dataset.id;
        await deleteMachine(machineId);
      });
    });
  }

  async function deleteMachine(machineId) {
    // Delete from Firestore
    const result = await FirestoreDB.deleteMachine(machineId);
    
    if (result.success) {
      // Delete related logs
      const logs = Storage._cache.logs.filter(l => l.machineId === machineId);
      for (const log of logs) {
        await FirestoreDB.deleteLog(log.id);
      }
      
      UI.showAlert('Machine deleted successfully', 'success');
    } else {
      UI.showAlert('Failed to delete machine: ' + result.error, 'error');
    }
  }

  function setupAddMachineForm() {
    const addForm = document.getElementById('addForm');
    if (!addForm) return;

    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById('new-name').value.trim(),
        img: document.getElementById('new-img').value.trim(),
        minTemp: Number(document.getElementById('new-minT').value),
        maxTemp: Number(document.getElementById('new-maxT').value),
        minVib: Number(document.getElementById('new-minV').value),
        maxVib: Number(document.getElementById('new-maxV').value),
        interval: Number(document.getElementById('new-interval').value) || CONFIG.DEFAULT_REPORT_INTERVAL
      };

      const validation = Validator.validateMachineData(formData);
      if (!validation.isValid) {
        Validator.showErrors(validation.errors);
        return;
      }

      formData.img = Utils.formatImageUrl(formData.img);
      if (formData.img.includes('google.com/imgres')) {
        const extracted = Utils.extractImageUrl(formData.img);
        if (extracted) {
          formData.img = extracted;
          UI.showAlert('Extracted direct image URL from Google Images link', 'info');
        }
      }

      const newMachine = {
        name: formData.name || 'Unnamed Machine',
        img: formData.img,
        minTemp: formData.minTemp,
        maxTemp: formData.maxTemp,
        minVib: formData.minVib,
        maxVib: formData.maxVib,
        interval: formData.interval,
        status: CONFIG.STATUS.GREEN,
        notes: ''
      };

      // Add to Firestore
      const result = await FirestoreDB.addMachine(newMachine);

      if (result.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
        if (modal) modal.hide();
        addForm.reset();
        
        UI.showAlert('Machine added successfully!', 'success');
      } else {
        UI.showAlert('Failed to add machine: ' + result.error, 'error');
      }
    });
  }

  // Setup real-time listeners
  function setupRealtimeListeners() {
    // Listen to machines
    unsubscribeMachines = FirestoreDB.listenToMachines((machines) => {
      Storage._cache.machines = machines;
      renderMachines();
      UI.updateSidebar();
    });

    // Listen to logs (needed for light status)
    unsubscribeLogs = FirestoreDB.listenToLogs((logs) => {
      Storage._cache.logs = logs;
      renderMachines(); // Re-render to update lights
    });
  }

  async function init() {
    // Check authentication
   /* if (!Auth.isAuthenticated()) {
      window.location.href = 'login-registration.html';
      return;
    }*/

    setupRealtimeListeners();
    setupAddMachineForm();
    UI.updateSidebar();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribeMachines) unsubscribeMachines();
    if (unsubscribeLogs) unsubscribeLogs();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();