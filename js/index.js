/* index.js - Machines Dashboard Page */

(() => {
  // Render machines grid
  function renderMachines() {
    const container = document.getElementById('machinesRow');
    if (!container) return;

    const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
    container.innerHTML = '';

    if (machines.length === 0) {
      container.innerHTML = '<div class="col-12 text-center text-muted p-5">No machines yet. Click + to add your first machine.</div>';
      return;
    }

    machines.forEach(machine => {
      const col = document.createElement('div');
      col.className = 'col-sm-6 col-md-4';
      
      const imgSrc = machine.img || '../img/machine-placeholder.png';
      
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
              <div class="status-lights">
                <span class="light green ${machine.status === 'green' ? 'active' : ''}"></span>
                <span class="light yellow ${machine.status === 'yellow' ? 'active' : ''}"></span>
                <span class="light red ${machine.status === 'red' ? 'active' : ''}"></span>
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

    // Attach event listeners
    attachMachineCardListeners();
  }

  // Attach event listeners to machine cards
  function attachMachineCardListeners() {
    // Open button
    document.querySelectorAll('.btn-open').forEach(button => {
      button.addEventListener('click', (e) => {
        const machineId = e.target.closest('.card').dataset.id;
        Storage.save(CONFIG.STORAGE_KEYS.SELECTED_MACHINE, machineId);
        window.location.href = 'machine.html';
      });
    });

    // Delete button
    document.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', (e) => {
        if (!UI.confirm('Are you sure you want to delete this machine?')) return;
        
        const machineId = e.target.closest('.card').dataset.id;
        deleteMachine(machineId);
      });
    });
  }

  // Delete machine
  function deleteMachine(machineId) {
    // Remove machine
    let machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
    machines = machines.filter(m => m.id !== machineId);
    Storage.save(CONFIG.STORAGE_KEYS.MACHINES, machines);

    // Remove related logs
    let logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
    logs = logs.filter(l => l.machineId !== machineId);
    Storage.save(CONFIG.STORAGE_KEYS.LOGS, logs);

    // Remove related reports
    let reports = Storage.load(CONFIG.STORAGE_KEYS.REPORTS, []);
    reports = reports.filter(r => r.machineId !== machineId);
    Storage.save(CONFIG.STORAGE_KEYS.REPORTS, reports);

    // Re-render and update UI
    renderMachines();
    UI.updateSidebar();
    UI.showAlert('Machine deleted successfully', 'success');
  }

  // Handle add machine form
  function setupAddMachineForm() {
    const addForm = document.getElementById('addForm');
    if (!addForm) return;

    addForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form values
      const formData = {
        name: document.getElementById('new-name').value.trim(),
        img: document.getElementById('new-img').value.trim(),
        minTemp: Number(document.getElementById('new-minT').value),
        maxTemp: Number(document.getElementById('new-maxT').value),
        minVib: Number(document.getElementById('new-minV').value),
        maxVib: Number(document.getElementById('new-maxV').value),
        interval: Number(document.getElementById('new-interval').value) || CONFIG.DEFAULT_REPORT_INTERVAL
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

      // Create new machine
      const newMachine = {
        id: Utils.uid('m'),
        name: formData.name || 'Unnamed Machine',
        img: formData.img,
        minTemp: formData.minTemp,
        maxTemp: formData.maxTemp,
        minVib: formData.minVib,
        maxVib: formData.maxVib,
        interval: formData.interval,
        status: CONFIG.STATUS.GREEN,
        notes: '',
        createdAt: Utils.nowISO()
      };

      // Save to storage
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      machines.push(newMachine);
      Storage.save(CONFIG.STORAGE_KEYS.MACHINES, machines);

      // Dispatch event for simulator
      window.dispatchEvent(new CustomEvent('machineAdded', { 
        detail: { machine: newMachine } 
      }));

      // Close modal and reset form
      const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
      if (modal) modal.hide();
      addForm.reset();

      // Update UI
      renderMachines();
      UI.updateSidebar();
      UI.showAlert('Machine added successfully!', 'success');
    });
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    renderMachines();
    setupAddMachineForm();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();