/* machine.js - Machine Details Page */

(() => {
    let currentMachineId = null;
  
    // Load and display machine details
    function loadMachineDetails() {
      currentMachineId = Storage.load(CONFIG.STORAGE_KEYS.SELECTED_MACHINE, null);
      
      if (!currentMachineId) {
        UI.showAlert('No machine selected. Redirecting to dashboard...', 'warning');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
      }
  
      const machine = MachineStatus.getById(currentMachineId);
      
      if (!machine) {
        UI.showAlert('Machine not found. Redirecting to dashboard...', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
      }
  
      displayMachine(machine);
      setupStatusButtons(machine);
      setupEditForm(machine);
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
      updateStatusLights(machine.status);
  
      // Populate edit form
      populateEditForm(machine);
    }
  
    // Update status light indicators
    function updateStatusLights(status) {
      const greenLight = document.getElementById('l-green');
      const yellowLight = document.getElementById('l-yellow');
      const redLight = document.getElementById('l-red');
  
      if (greenLight) greenLight.classList.toggle('active', status === CONFIG.STATUS.GREEN);
      if (yellowLight) yellowLight.classList.toggle('active', status === CONFIG.STATUS.YELLOW);
      if (redLight) redLight.classList.toggle('active', status === CONFIG.STATUS.RED);
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
        'm-notes': machine.notes || ''
      };
  
      Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
      });
    }
  
    // Setup status simulation buttons
    function setupStatusButtons(machine) {
      const btnGreen = document.getElementById('btn-sim-green');
      const btnYellow = document.getElementById('btn-sim-yellow');
      const btnRed = document.getElementById('btn-sim-red');
  
      if (btnGreen) {
        btnGreen.addEventListener('click', () => {
          updateMachineStatus(CONFIG.STATUS.GREEN);
        });
      }
  
      if (btnYellow) {
        btnYellow.addEventListener('click', () => {
          updateMachineStatus(CONFIG.STATUS.YELLOW);
        });
      }
  
      if (btnRed) {
        btnRed.addEventListener('click', () => {
          updateMachineStatus(CONFIG.STATUS.RED);
        });
      }
    }
  
    // Update machine status
    function updateMachineStatus(newStatus) {
      if (!currentMachineId) return;
  
      const success = MachineStatus.updateStatus(currentMachineId, newStatus);
      
      if (success) {
        updateStatusLights(newStatus);
        UI.showAlert(`Status updated to ${newStatus}`, 'success');
      } else {
        UI.showAlert('Failed to update status', 'error');
      }
    }
  
    // Setup edit form submission
    function setupEditForm(machine) {
      const editForm = document.getElementById('editForm');
      if (!editForm) return;
  
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
  
        // Get form values
        const formData = {
          name: document.getElementById('m-name').value.trim(),
          img: document.getElementById('m-img').value.trim(),
          minTemp: Number(document.getElementById('m-min-temp').value),
          maxTemp: Number(document.getElementById('m-max-temp').value),
          minVib: Number(document.getElementById('m-min-vib').value),
          maxVib: Number(document.getElementById('m-max-vib').value),
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
  
        // Update machine
        const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
        const machineIndex = machines.findIndex(m => m.id === currentMachineId);
  
        if (machineIndex !== -1) {
          // Keep existing values and update changed ones
          machines[machineIndex] = {
            ...machines[machineIndex],
            name: formData.name,
            img: formData.img,
            minTemp: formData.minTemp,
            maxTemp: formData.maxTemp,
            minVib: formData.minVib,
            maxVib: formData.maxVib,
            notes: formData.notes,
            updatedAt: Utils.nowISO()
          };
  
          Storage.save(CONFIG.STORAGE_KEYS.MACHINES, machines);
          
          // Reload display
          displayMachine(machines[machineIndex]);
          UI.showAlert('Machine updated successfully!', 'success');
        } else {
          UI.showAlert('Machine not found', 'error');
        }
      });
    }
  
    // Initialize page
    function init() {
      UI.updateSidebar();
      loadMachineDetails();
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();