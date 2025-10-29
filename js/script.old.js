/* app.js - simulated backend/state for demo UI */
(() => {
  /* ---- Demo initial state (stored in localStorage so pages remain synced) ---- */
  const MACHINE_KEY = 'demo_machines_v2';
  const LOGS_KEY    = 'demo_logs_v2';
  const REPORTS_KEY = 'demo_reports_v2';
  const PROB_KEY    = 'demo_problems_v2';
  const PROFILE_KEY = 'demo_profile_v2';

  // defaults
  const defaultMachines = [
    { id:'m1', name:'Compressor A', img:'../img/Compressor C.jpg', minTemp:10, maxTemp:90, minVib:0.1, maxVib:5, interval:8, status:'green', notes:'' },
    { id:'m2', name:'Pump B', img:'../img/machine2.jpg', minTemp:5, maxTemp:80, minVib:0.2, maxVib:4, interval:12, status:'green', notes:'' },
    { id:'m3', name:'Lathe C', img:'../img/machine3.jpg', minTemp:0, maxTemp:70, minVib:0.05, maxVib:3, interval:10, status:'green', notes:'' }
  ];

  const defaultLogs = [
    // example: status is 'not' (not fixed)
    { id:'l1', machineId:'m3', message:'Vibration spike detected (bearing)', status:'not', desc:'' }
  ];

  const defaultProblems = [
    { id:'p1', title:'Worn bearing', desc:'Bearing wear causes vibration. Replace bearing and balance shaft.', video:'' },
    { id:'p2', title:'Overheating motor', desc:'Check cooling, ventilation, and motor load. Clean filters.', video:'' }
  ];

  const defaultProfile = { name:'Demo User', email:'demo@example.com', photo:'../img/user.jpg' };

  // helpers for storage
  function ensure(key, def){
    if(!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(def));
    return JSON.parse(localStorage.getItem(key));
  }

  const machines = ensure(MACHINE_KEY, defaultMachines);
  ensure(LOGS_KEY, defaultLogs);
  ensure(REPORTS_KEY, []);
  ensure(PROB_KEY, defaultProblems);
  ensure(PROFILE_KEY, defaultProfile);

  /* ---- Utilities ---- */
  function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
  function nowISO(){ return new Date().toISOString(); }
  function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }

  /* ---- Global UI updates used across pages ---- */
  function updateSidebarCounts(){
    const pro = JSON.parse(localStorage.getItem(PROFILE_KEY));
    const sbNameEls = document.querySelectorAll('#sbName, #sbN, #sbN2');
    const sbEmailEls = document.querySelectorAll('#sbEmail, #sbE, #sbE2');
    const countEls = document.querySelectorAll('#sbCount, #profileMachines, #countMd');
    sbNameEls.forEach(el=> { if(el) el.textContent = pro.name; });
    sbEmailEls.forEach(el=> { if(el) el.textContent = pro.email; });
    const cnt = load(MACHINE_KEY).length;
    countEls.forEach(el=> { if(el) el.textContent = `Machines: ${cnt}` || cnt; });
  }

  /* ---- Machines page render & handlers ---- */
  function renderMachinesPage(){
    const container = document.getElementById('machinesRow');
    if(!container) return;
    const list = load(MACHINE_KEY);
    container.innerHTML = '';
    list.forEach(m=>{
      const col = document.createElement('div'); col.className = 'col-sm-6 col-md-4';
      const imgSrc = m.img || '../img/machine-placeholder.png';
      col.innerHTML = `
        <div class="card card-machine h-100" data-id="${m.id}">
          <div class="img-wrap"><img src="${imgSrc}" onerror="this.onerror=null; this.src='../img/machine-placeholder.png'"></div>
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="mb-0">${m.name}</h5>
              <div class="status-lights">
                <span class="light green ${m.status==='green'?'active':''}"></span>
                <span class="light yellow ${m.status==='yellow'?'active':''}"></span>
                <span class="light red ${m.status==='red'?'active':''}"></span>
              </div>
            </div>
            <p class="small text-muted mt-2 mb-3">Interval: ${m.interval}s • Temp ${m.minTemp}-${m.maxTemp}°C</p>
            <div class="mt-auto d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm btn-open">Open</button>
              <button class="btn btn-outline-danger btn-sm btn-delete">Delete</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });

    // delete handler
    container.querySelectorAll('.btn-delete').forEach(b=>{
      b.addEventListener('click', (e)=>{
        if(!confirm('Are you sure you want to delete this machine?')) return;
        const id = e.target.closest('.card').dataset.id;
        const newList = load(MACHINE_KEY).filter(x=>x.id!==id);
        save(MACHINE_KEY,newList);
        // remove related logs
        const logs = load(LOGS_KEY).filter(l=>l.machineId!==id);
        save(LOGS_KEY, logs);
        renderMachinesPage();
        updateSidebarCounts();
      });
    });

    // open handler
    container.querySelectorAll('.btn-open').forEach(b=>{
      b.addEventListener('click',(e)=>{
        const id = e.target.closest('.card').dataset.id;
        localStorage.setItem('selectedMachine', id);
        window.location.href = 'machine.html';
      });
    });
  }

  /* ---- Add new machine ---- */
  const addForm = document.getElementById('addForm');
  if(addForm){
    addForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      let imgValue = document.getElementById('new-img').value.trim();
      
      // Extract direct image URL from Google Images links
      if(imgValue.includes('google.com/imgres')){
        const match = imgValue.match(/imgurl=([^&]+)/);
        if(match){
          imgValue = decodeURIComponent(match[1]);
          alert('Extracted direct image URL from Google Images link');
        }
      }
      
      // If user provided a URL or path, use it; otherwise use placeholder
      if(!imgValue){
        imgValue = '../img/machine-placeholder.png';
      } else if(!imgValue.startsWith('http') && !imgValue.startsWith('../img/')){
        // If it's just a filename, prepend the img folder path
        imgValue = imgValue;
      }
      
      const m = {
        id: uid('m'),
        name: document.getElementById('new-name').value || 'Unnamed',
        img: imgValue,
        minTemp: Number(document.getElementById('new-minT').value) || 0,
        maxTemp: Number(document.getElementById('new-maxT').value) || 0,
        minVib: Number(document.getElementById('new-minV').value) || 0,
        maxVib: Number(document.getElementById('new-maxV').value) || 0,
        interval: Number(document.getElementById('new-interval').value) || 15,
        status: 'green',
        notes: ''
      };
      const arr = load(MACHINE_KEY);
      arr.push(m);
      save(MACHINE_KEY, arr);
      const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
      modal.hide();
      addForm.reset();
      renderMachinesPage();
      updateSidebarCounts();
      startMachineReporter(m);
    });
  }

  /* ---- Machine Details Page ---- */
  function loadMachineDetails(){
    const machineId = localStorage.getItem('selectedMachine');
    if(!machineId) return;
    
    const machines = load(MACHINE_KEY);
    const machine = machines.find(m => m.id === machineId);
    if(!machine) {
      alert('Machine not found!');
      window.location.href = 'index.html';
      return;
    }

    // Populate display section
    const imgEl = document.getElementById('m-photo');
    const nameDisplay = document.getElementById('m-name-display');
    const notesDisplay = document.getElementById('m-notes-display');
    const specsDisplay = document.getElementById('m-specs');
    
    if(imgEl) {
      imgEl.src = machine.img || '../img/machine-placeholder.png';
      imgEl.onerror = function(){ this.src = '../img/machine-placeholder.png'; };
    }
    if(nameDisplay) nameDisplay.textContent = machine.name;
    if(notesDisplay) notesDisplay.textContent = machine.notes || 'No notes';
    if(specsDisplay) {
      specsDisplay.innerHTML = `
        <div>Temperature: ${machine.minTemp}°C - ${machine.maxTemp}°C</div>
        <div>Vibration: ${machine.minVib}g - ${machine.maxVib}g</div>
        <div>Report Interval: ${machine.interval}s</div>
      `;
    }

    // Set status lights
    const greenLight = document.getElementById('l-green');
    const yellowLight = document.getElementById('l-yellow');
    const redLight = document.getElementById('l-red');
    if(greenLight) greenLight.classList.toggle('active', machine.status === 'green');
    if(yellowLight) yellowLight.classList.toggle('active', machine.status === 'yellow');
    if(redLight) redLight.classList.toggle('active', machine.status === 'red');

    // Populate edit form
    const imgInput = document.getElementById('m-img');
    const nameInput = document.getElementById('m-name');
    const minTempInput = document.getElementById('m-min-temp');
    const maxTempInput = document.getElementById('m-max-temp');
    const minVibInput = document.getElementById('m-min-vib');
    const maxVibInput = document.getElementById('m-max-vib');
    const notesInput = document.getElementById('m-notes');

    if(imgInput) imgInput.value = machine.img || '';
    if(nameInput) nameInput.value = machine.name || '';
    if(minTempInput) minTempInput.value = machine.minTemp || 0;
    if(maxTempInput) maxTempInput.value = machine.maxTemp || 0;
    if(minVibInput) minVibInput.value = machine.minVib || 0;
    if(maxVibInput) maxVibInput.value = machine.maxVib || 0;
    if(notesInput) notesInput.value = machine.notes || '';

    // Status simulation buttons
    const btnGreen = document.getElementById('btn-sim-green');
    const btnYellow = document.getElementById('btn-sim-yellow');
    const btnRed = document.getElementById('btn-sim-red');

    if(btnGreen) {
      btnGreen.addEventListener('click', () => {
        updateMachineStatus(machineId, 'green');
        loadMachineDetails();
      });
    }
    if(btnYellow) {
      btnYellow.addEventListener('click', () => {
        updateMachineStatus(machineId, 'yellow');
        loadMachineDetails();
      });
    }
    if(btnRed) {
      btnRed.addEventListener('click', () => {
        updateMachineStatus(machineId, 'red');
        loadMachineDetails();
      });
    }
  }

  function updateMachineStatus(machineId, newStatus){
    const machines = load(MACHINE_KEY);
    const idx = machines.findIndex(m => m.id === machineId);
    if(idx !== -1){
      machines[idx].status = newStatus;
      save(MACHINE_KEY, machines);
    }
  }

  // Edit form submission
  const editForm = document.getElementById('editForm');
  if(editForm){
    editForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const machineId = localStorage.getItem('selectedMachine');
      if(!machineId) return;

      const machines = load(MACHINE_KEY);
      const idx = machines.findIndex(m => m.id === machineId);
      if(idx === -1) return;

      let imgValue = document.getElementById('m-img').value.trim();
      if(!imgValue){
        imgValue = '../img/machine-placeholder.png';
      } else if(!imgValue.startsWith('http') && !imgValue.startsWith('../img/')){
        imgValue = '../img/' + imgValue;
      }

      machines[idx].img = imgValue;
      machines[idx].name = document.getElementById('m-name').value || 'Unnamed';
      machines[idx].minTemp = Number(document.getElementById('m-min-temp').value) || 0;
      machines[idx].maxTemp = Number(document.getElementById('m-max-temp').value) || 0;
      machines[idx].minVib = Number(document.getElementById('m-min-vib').value) || 0;
      machines[idx].maxVib = Number(document.getElementById('m-max-vib').value) || 0;
      machines[idx].notes = document.getElementById('m-notes').value || '';

      save(MACHINE_KEY, machines);
      alert('Machine updated successfully!');
      loadMachineDetails();
    });
  }

  /* ---- Logs page rendering and workflow ---- */
  function renderLogsPage(){
    const notFixed = document.getElementById('notFixed');
    const inProg = document.getElementById('inProgress');
    const fixed = document.getElementById('fixed');
    if(!notFixed) return;
    const logs = load(LOGS_KEY);
    notFixed.innerHTML = ''; inProg.innerHTML = ''; fixed.innerHTML = '';
    logs.forEach(l=>{
      const el = document.createElement('div');
      el.className = 'log-item';
      el.dataset.id = l.id;
      el.innerHTML = `
        <div>
          <div class="fw-semibold">${l.message}</div>
          <div class="meta">Machine: ${l.machineId}</div>
        </div>
        <div class="actions"></div>
      `;
      const actions = el.querySelector('.actions');
      if(l.status === 'not') actions.innerHTML = `<button class="btn btn-sm btn-primary btn-go">Start Fix</button>`;
      else if(l.status === 'in') actions.innerHTML = `<button class="btn btn-sm btn-success btn-done">Done</button>`;
      else actions.innerHTML = `<button class="btn btn-sm btn-outline-secondary btn-view">View</button>`;

      if(l.status === 'not') notFixed.appendChild(el);
      else if(l.status === 'in') inProg.appendChild(el);
      else fixed.appendChild(el);
    });

    // attach handlers
    document.querySelectorAll('.btn-go').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = e.target.closest('.log-item').dataset.id;
        changeLogStatus(id, 'in');
      });
    });
    document.querySelectorAll('.btn-done').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = e.target.closest('.log-item').dataset.id;
        document.getElementById('finishId').value = id;
        document.getElementById('finishDesc').value = '';
        const modal = new bootstrap.Modal(document.getElementById('finishModal'));
        modal.show();
      });
    });
    document.querySelectorAll('.btn-view').forEach(b=>{
      b.addEventListener('click', (e)=>{
        const id = e.target.closest('.log-item').dataset.id;
        const logs = load(LOGS_KEY);
        const l = logs.find(x=>x.id===id);
        alert(`Log: ${l.message}\n\nFix notes:\n${l.desc || '(no description)'}`);
      });
    });
  }

  // finish form
  const finishForm = document.getElementById('finishForm');
  if(finishForm){
    finishForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = document.getElementById('finishId').value;
      const desc = document.getElementById('finishDesc').value.trim();
      if(!desc){ alert('Please describe the fix.'); return; }
      changeLogStatus(id, 'fixed', desc);
      bootstrap.Modal.getInstance(document.getElementById('finishModal')).hide();
    });
  }

  function changeLogStatus(id, newStatus, desc=''){
    const logs = load(LOGS_KEY);
    const idx = logs.findIndex(x=>x.id===id);
    if(idx === -1) return;
    logs[idx].status = newStatus;
    if(desc) logs[idx].desc = desc;
    save(LOGS_KEY, logs);

    const machineId = logs[idx].machineId;
    syncMachineStatusFromLogs(machineId);

    renderLogsPage();
    renderMachinesPage();
  }

  function syncMachineStatusFromLogs(machineId){
    const logs = load(LOGS_KEY).filter(l=>l.machineId === machineId);
    const hasNot = logs.some(l=>l.status==='not');
    const hasIn = logs.some(l=>l.status==='in');
    const machines = load(MACHINE_KEY);
    const mIdx = machines.findIndex(x=>x.id===machineId);
    if(mIdx === -1) return;
    if(hasNot) machines[mIdx].status = 'red';
    else if(hasIn) machines[mIdx].status = 'yellow';
    else machines[mIdx].status = 'green';
    save(MACHINE_KEY, machines);
  }

  /* ---- Status reports (timer-driven) ---- */
  function sampleReading(m){
    const t = (m.minTemp || 0) + Math.random()*( (m.maxTemp||100) - (m.minTemp||0) );
    const v = (m.minVib || 0) + Math.random()*((m.maxVib||5) - (m.minVib||0));
    return { temp: +(t.toFixed(2)), vib: +(v.toFixed(2)) };
  }

  function startMachineReporter(m){
    if(window._reporters && window._reporters[m.id]) return;
    window._reporters = window._reporters || {};
    const id = setInterval(()=>{
      const reading = sampleReading(m);
      const report = {
        id: uid('r'),
        machineId: m.id,
        machineName: m.name,
        temp: reading.temp,
        vib: reading.vib,
        timestamp: nowISO()
      };
      const arr = load(REPORTS_KEY);
      arr.unshift(report);
      if(arr.length>200) arr.pop();
      save(REPORTS_KEY, arr);

      let createdLog = false;
      if(reading.temp > m.maxTemp || reading.temp < m.minTemp){
        const logs = load(LOGS_KEY);
        logs.unshift({ id: uid('l'), machineId: m.id, message:`Temperature out of range (${reading.temp}°C)`, status:'not', desc:''});
        save(LOGS_KEY, logs);
        createdLog = true;
      }
      if(reading.vib > m.maxVib || reading.vib < m.minVib){
        const logs = load(LOGS_KEY);
        logs.unshift({ id: uid('l'), machineId: m.id, message:`Vibration out of range (${reading.vib}g)`, status:'not', desc:''});
        save(LOGS_KEY, logs);
        createdLog = true;
      }
      if(createdLog) {
        syncMachineStatusFromLogs(m.id);
        renderLogsPage();
        renderMachinesPage();
      }

      renderStatusPage();
    }, (m.interval || 15)*1000);
    window._reporters[m.id] = id;
  }

  function startAllReporters(){
    load(MACHINE_KEY).forEach(m => startMachineReporter(m));
  }

  /* ---- Status page rendering ---- */
  function renderStatusPage(){
    const tbody = document.getElementById('statusTable');
    if(!tbody) return;
    const reports = load(REPORTS_KEY);
    tbody.innerHTML = '';
    reports.slice(0,80).forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date(r.timestamp).toLocaleString()}</td>
                      <td>${r.machineName}</td>
                      <td>${r.temp}</td>
                      <td>${r.vib}</td>
                      <td class="small text-muted">Auto report</td>`;
      tbody.appendChild(tr);
    });
  }

  /* ---- Problems page ---- */
  function renderProblemsPage(){
    const wrap = document.getElementById('problemsList');
    if(!wrap) return;
    const probs = load(PROB_KEY);
    wrap.innerHTML = '';
    probs.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'problem-card';
      card.innerHTML = `<h5>${p.title}</h5><p>${p.desc}</p>
        ${p.video ? `<div class="ratio ratio-16x9"><iframe src="${p.video}" allowfullscreen></iframe></div>` : ''}`;
      wrap.appendChild(card);
    });
  }
  const problemForm = document.getElementById('problemForm');
  if(problemForm){
    problemForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const title = document.getElementById('p-title').value.trim();
      const desc = document.getElementById('p-desc').value.trim();
      const video = document.getElementById('p-video').value.trim();
      if(!title||!desc) return alert('Please fill title and description');
      const arr = load(PROB_KEY);
      arr.unshift({ id: uid('p'), title, desc, video });
      save(PROB_KEY, arr);
      problemForm.reset();
      renderProblemsPage();
      alert('Problem added successfully!');
    });
  }

  /* ---- Profile handlers ---- */
  function renderProfile(){
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const photoEl = document.getElementById('profilePhoto');
    const machinesEl = document.getElementById('profileMachines');
    if(nameEl) nameEl.textContent = p.name;
    if(emailEl) emailEl.textContent = p.email;
    if(photoEl) photoEl.src = p.photo;
    if(machinesEl) machinesEl.textContent = load(MACHINE_KEY).length;

    const sbName = document.querySelectorAll('#sbName,#sbN,#sbN2');
    const sbEmail = document.querySelectorAll('#sbEmail,#sbE,#sbE2');
    sbName.forEach(el=> el && (el.textContent = p.name));
    sbEmail.forEach(el=> el && (el.textContent = p.email));
  }

  const editProfileBtn = document.getElementById('editProfileBtn');
  if(editProfileBtn){
    editProfileBtn.addEventListener('click', ()=>{
      document.getElementById('editArea').style.display = 'block';
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
      document.getElementById('p-name').value = p.name;
      document.getElementById('p-email').value = p.email;
      document.getElementById('p-photo').value = p.photo;
      window.scrollTo({top:0,behavior:'smooth'});
    });
    const profForm = document.getElementById('profileForm');
    if(profForm){
      profForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        const newP = { 
          name: document.getElementById('p-name').value || 'Demo User', 
          email: document.getElementById('p-email').value || 'demo@example.com', 
          photo: document.getElementById('p-photo').value || '../img/user.jpg' 
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(newP));
        renderProfile();
        updateSidebarCounts();
        document.getElementById('editArea').style.display = 'none';
        alert('Profile updated successfully!');
      });
    }
  }

  /* ---- Page initializers ---- */
  function init(){
    updateSidebarCounts();
    renderMachinesPage();
    renderLogsPage();
    renderStatusPage();
    renderProblemsPage();
    renderProfile();
    loadMachineDetails(); // Load machine details if on machine.html
    startAllReporters();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.demoAPI = {
    addLog: (machineId, message) => {
      const logs = load(LOGS_KEY);
      logs.unshift({ id: uid('l'), machineId, message, status:'not', desc:'' });
      save(LOGS_KEY, logs);
      syncMachineStatusFromLogs(machineId);
      renderLogsPage();
      renderMachinesPage();
    },
    setMachineStatus: (id, status) => {
      const arr = load(MACHINE_KEY);
      const i = arr.findIndex(x=>x.id===id);
      if(i>=0){ arr[i].status = status; save(MACHINE_KEY, arr); renderMachinesPage(); }
    }
  };

})();