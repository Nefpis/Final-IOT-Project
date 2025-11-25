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
  // 3. Update the Main Listener Function
function setupRealtimeListeners() {
  // A. Listen to Machines (Populate Options)
  unsubscribeMachines = FirestoreDB.listenToMachines(async (machines) => {
    Storage._cache.machines = machines;
    renderMachines();
    UI.updateSidebar();
    
    // Update dropdown options
    renderEspDropdownOptions(machines); 
  });

  // B. Listen to Global Settings (Update Selection)
  // This makes the dropdown move automatically when another manager changes it!
  setupEspSettingsListener();

  // C. Listen to logs
  unsubscribeLogs = FirestoreDB.listenToLogs((logs) => {
    Storage._cache.logs = logs;
    renderMachines();
  });
}

  // Global variable to store the current target from Firestore
let globalEspTarget = null; 

// 1. Render the Dropdown Options (Called when machines load)
function renderEspDropdownOptions(machines) {
    const selectors = document.querySelectorAll('.esp-target-selector');
    if (selectors.length === 0) return;

    selectors.forEach(selector => {
        // Save current selection to restore it after rebuilding options
        // (Priority: Global Setting > Current Value > First Machine)
        const currentVal = globalEspTarget || selector.value;
        
        selector.innerHTML = ''; // Clear existing

        if (machines.length === 0) {
            selector.innerHTML = '<option value="">No Machines</option>';
            return;
        }

        machines.forEach(machine => {
            const option = document.createElement('option');
            option.value = machine.id;
            option.textContent = machine.name;
            selector.appendChild(option);
        });

        // Set the value to the global target if we have one
        if (globalEspTarget) {
            selector.value = globalEspTarget;
        } else if (machines.length > 0 && !selector.value) {
            // Default to first if nothing selected
            selector.value = machines[0].id; 
        }

        // Add Change Listener (Cloning to ensure clean events)
        const newSelector = selector.cloneNode(true);
        selector.parentNode.replaceChild(newSelector, selector);
        
        newSelector.addEventListener('change', async (e) => {
            const selectedId = e.target.value;
            // This now updates the GLOBAL setting
            await FirestoreDB.setEspTarget(selectedId);
        });
    });
}

// 2. New Listener for Global ESP Settings
function setupEspSettingsListener() {
    Firebase.db.collection('esp32_settings').doc('wifi_factory')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const settings = doc.data();
                globalEspTarget = settings.machineId;
                
                console.log(`📡 Global ESP Target Changed: ${globalEspTarget} (Updated by: ${settings.lastUpdatedBy})`);

                // Update ALL dropdowns on the page immediately
                document.querySelectorAll('.esp-target-selector').forEach(s => {
                    s.value = globalEspTarget;
                });
            } else {
                console.log("⚠️ No global ESP settings found. Creating default...");
                // If it doesn't exist yet, create it!
                if (Storage._cache.machines.length > 0) {
                     FirestoreDB.setEspTarget(Storage._cache.machines[0].id);
                }
            }
        });
}

// [NEW SYSTEM] "The Security Guard"
// This watches incoming reports and generates Logs/Alerts automatically
function startSecurityGuard() {
  console.log("🛡️ Security Guard Started: Monitoring sensors...");
  // Listen to the latest report added to the system
  Firebase.db.collection('reports')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .onSnapshot((snapshot) => {
      if (snapshot.empty) return;
      
      const report = snapshot.docs[0].data();
      const reportId = snapshot.docs[0].id; // Use ID to prevent duplicate logs
      
      // Only process reports that are new (less than 10 seconds old)
      // This prevents generating logs for old data when you refresh the page
      const reportTime = report.timestamp ? report.timestamp.toDate() : new Date();
      const now = new Date();
      const ageInSeconds = (now - reportTime) / 1000;
      
      if (ageInSeconds > 10) return;

      analyzeReport(report, reportId);
    });
}

async function analyzeReport(report, reportId) {
  // 1. Find the machine limits
  // We look in our cache to find the machine settings
  const machine = Storage._cache.machines.find(m => m.id === report.machineId);
  
  if (!machine) return; // Unknown machine

  // 2. Check for Violations
  let faultProb = 0;
  let message = "";
  let status = "fixed"; // Default to healthy

  // Check Temperature
  if (report.temp > machine.maxTemp) {
    faultProb += 40;
    message += `High Temp (${report.temp}°C). `;
  }
  
  // Check Vibration
  if (report.vib > machine.maxVib) {
    faultProb += 40;
    message += `High Vib (${report.vib}g). `;
  }

  // 3. If there is a problem, Create a Log!
  if (faultProb > 0) {
    // Determine severity
    status = "not"; // "Not Fixed" (Red/Danger)
    
    // Check if we already created a log for this specific report 
    // (To prevent loops)
    const logCheck = await Firebase.db.collection('logs')
                            .where('reportId', '==', reportId).get();
                            
    if (logCheck.empty) {
        console.warn("⚠️ VIOLATION DETECTED:", message);
        
        await FirestoreDB.addLog({
            machineId: machine.id,
            message: message.trim(),
            faultProbability: Math.min(faultProb, 99),
            temperature: report.temp,
            vibration: report.vib,
            sound: report.sound,
            status: CONFIG.LOG_STATUS.NOT_FIXED,
            reportId: reportId // Link to source report
        });
        
        // This will automatically trigger the "Lights" to turn RED
        // because your website is already listening to the 'logs' collection!
    }
  }
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
        startSecurityGuard(); 
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