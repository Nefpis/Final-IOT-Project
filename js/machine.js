/* machine.js - Machine Details Page (FIRESTORE) */

(() => {
  let currentMachineId = null;
  let unsubscribeMachine = null;
  let unsubscribeLogs = null;

  // Load and display machine details
  async function loadMachineDetails() {
    currentMachineId = Storage.load(CONFIG.STORAGE_KEYS.SELECTED_MACHINE, null);
    
    if (!currentMachineId) {
      UI.showAlert('No machine selected. Redirecting to dashboard...', 'warning');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }

    // Get machine from Firestore
    const machine = await FirestoreDB.getMachine(currentMachineId);
    
    if (!machine) {
      UI.showAlert('Machine not found. Redirecting to dashboard...', 'error');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }

    // Store in cache
    const machineIndex = Storage._cache.machines.findIndex(m => m.id === currentMachineId);
    if (machineIndex === -1) {
      Storage._cache.machines.push(machine);
    } else {
      Storage._cache.machines[machineIndex] = machine;
    }

    displayMachine(machine);
    setupEditForm(machine);
    setupRealtimeUpdates();
  }

  // Setup real-time updates for lights
  function setupRealtimeUpdates() {
    // Listen to logs for this machine (for light status)
    unsubscribeLogs = FirestoreDB.listenToLogs((logs) => {
      Storage._cache.logs = logs;
      updateStatusLights();
    });

    // Update lights every 3 seconds as backup
    setInterval(() => {
      updateStatusLights();
    }, 3000);
  }

  // Display machine information
  function displayMachine(machine) {
    // Display image
    const imgEl = document.getElementById('m-photo');
    if (imgEl) {
      imgEl.src = machine.img || '../img/machine-placeholder.png';
      imgEl.onerror = function() { 
        this.onerror = null;
        this.src = '../img/machine-placeholder.png'; 
      };
    }

    // Display name and notes
    const nameDisplay = document.getElementById('m-name-display');
    const notesDisplay = document.getElementById('m-notes-display');
    
    if (nameDisplay) nameDisplay.textContent = machine.name;
    if (notesDisplay) notesDisplay.textContent = machine.notes || 'No notes';

    // Display specifications
    const specsDisplay = document.getElementById('m-specs');
    if (specsDisplay) {
      specsDisplay.innerHTML = `
        <div>Temperature: ${machine.minTemp}°C - ${machine.maxTemp}°C</div>
        <div>Vibration: ${machine.minVib}g - ${machine.maxVib}g</div>
        <div>Report Interval: ${machine.interval}s</div>
      `;
    }

    // Update status lights
    updateStatusLights();

    // Populate edit form
    populateEditForm(machine);
  }

  // Update status light indicators using new system
  function updateStatusLights() {
    if (!currentMachineId) return;

    const lightStatus = CONFIG.calculateLightStatus(currentMachineId);
    
    const greenLight = document.getElementById('l-green');
    const yellowLight = document.getElementById('l-yellow');
    const redLight = document.getElementById('l-red');

    if (greenLight) {
      greenLight.className = 'light green';
      if (lightStatus.green) {
        greenLight.classList.add('active');
      } else if (lightStatus.greenDim) {
        greenLight.classList.add('dim');
      }
    }
    
    if (yellowLight) {
      yellowLight.className = 'light yellow';
      if (lightStatus.yellow) {
        yellowLight.classList.add('active');
      } else if (lightStatus.yellowDim) {
        yellowLight.classList.add('dim');
      }
    }
    
    if (redLight) {
      redLight.className = 'light red';
      if (lightStatus.red) {
        redLight.classList.add('active');
        if (lightStatus.redBlink) {
          redLight.classList.add('blinking');
        }
      }
    }
  }

  // Populate edit form with current values
  function populateEditForm(machine) {
    const fields = {
      'm-img': machine.img,
      'm-name': machine.name,
      'm-min-temp': machine.minTemp,
      'm-max-temp': machine.maxTemp,
      'm-min-vib': machine.minVib,
      'm-max-vib': machine.maxVib,
      'm-notes': machine.notes || '',
      'm-interval': machine.interval || 15
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value || '';
    });
  }

  // Setup edit form submission
  function setupEditForm(machine) {
    const editForm = document.getElementById('editForm');
    if (!editForm) return;

    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const formData = {
        name: document.getElementById('m-name').value.trim(),
        img: document.getElementById('m-img').value.trim(),
        minTemp: Number(document.getElementById('m-min-temp').value),
        maxTemp: Number(document.getElementById('m-max-temp').value),
        minVib: Number(document.getElementById('m-min-vib').value),
        maxVib: Number(document.getElementById('m-max-vib').value),
        interval: Number(document.getElementById('m-interval').value) || 15,
        notes: document.getElementById('m-notes').value.trim()
      };

      // Validate input
      const validation = Validator.validateMachineData(formData);
      if (!validation.isValid) {
        Validator.showErrors(validation.errors);
        return;
      }

      // Process image URL
      formData.img = Utils.formatImageUrl(formData.img);
      if (formData.img.includes('google.com/imgres')) {
        const extracted = Utils.extractImageUrl(formData.img);
        if (extracted) {
          formData.img = extracted;
          UI.showAlert('Extracted direct image URL from Google Images link', 'info');
        }
      }

      // Update in Firestore
      const result = await FirestoreDB.updateMachine(currentMachineId, formData);

      if (result.success) {
        // Reload machine data
        const updatedMachine = await FirestoreDB.getMachine(currentMachineId);
        if (updatedMachine) {
          displayMachine(updatedMachine);
        }
        
        UI.showAlert('Machine updated successfully!', 'success');
      } else {
        UI.showAlert('Failed to update machine: ' + result.error, 'error');
      }
    });
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    loadMachineDetails();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribeMachine) unsubscribeMachine();
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

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})();