/* problems.js - Problems Database Page */

(() => {
    // Render problems list
    function renderProblems() {
      const container = document.getElementById('problemsList');
      if (!container) return;
  
      const problems = Storage.load(CONFIG.STORAGE_KEYS.PROBLEMS, []);
      container.innerHTML = '';
  
      if (problems.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-5">No problems documented yet. Add your first problem below.</div>';
        return;
      }
  
      problems.forEach(problem => {
        const card = document.createElement('div');
        card.className = 'problem-card';
        card.dataset.id = problem.id;
  
        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="mb-0">${problem.title}</h5>
            <button class="btn btn-sm btn-outline-danger btn-delete-problem" title="Delete">×</button>
          </div>
          <p class="mb-2">${problem.description}</p>
          ${problem.videoUrl ? `
            <div class="ratio ratio-16x9 mb-2">
              <iframe src="${problem.videoUrl}" allowfullscreen></iframe>
            </div>
          ` : ''}
          <div class="small text-muted">
            Added: ${problem.createdAt ? Utils.formatDate(problem.createdAt) : 'Unknown'}
          </div>
        `;
  
        container.appendChild(card);
      });
  
      // Attach delete listeners
      attachProblemDeleteListeners();
    }
  
    // Attach delete listeners to problem cards
    function attachProblemDeleteListeners() {
      document.querySelectorAll('.btn-delete-problem').forEach(button => {
        button.addEventListener('click', (e) => {
          if (!UI.confirm('Are you sure you want to delete this problem?')) return;
  
          const card = e.target.closest('.problem-card');
          const problemId = card.dataset.id;
          deleteProblem(problemId);
        });
      });
    }
  
    // Delete problem
    function deleteProblem(problemId) {
      let problems = Storage.load(CONFIG.STORAGE_KEYS.PROBLEMS, []);
      problems = problems.filter(p => p.id !== problemId);
      Storage.save(CONFIG.STORAGE_KEYS.PROBLEMS, problems);
      
      renderProblems();
      UI.showAlert('Problem deleted successfully', 'success');
    }
  
    // Setup add problem form
    function setupProblemForm() {
      const form = document.getElementById('problemForm');
      if (!form) return;
  
      form.addEventListener('submit', (e) => {
        e.preventDefault();
  
        // Get form values
        const title = document.getElementById('p-title').value.trim();
        const description = document.getElementById('p-desc').value.trim();
        const videoUrl = document.getElementById('p-video').value.trim();
  
        // Validate
        if (!title) {
          UI.showAlert('Problem title is required', 'warning');
          return;
        }
  
        if (!description) {
          UI.showAlert('Problem description is required', 'warning');
          return;
        }
  
        // Validate video URL if provided
        if (videoUrl && !Validator.isValidUrl(videoUrl)) {
          UI.showAlert('Invalid video URL format', 'warning');
          return;
        }
  
        // Create new problem
        const newProblem = {
          id: Utils.uid('p'),
          title: title,
          description: description,
          videoUrl: videoUrl,
          createdAt: Utils.nowISO()
        };
  
        // Save
        const problems = Storage.load(CONFIG.STORAGE_KEYS.PROBLEMS, []);
        problems.unshift(newProblem); // Add to beginning
        Storage.save(CONFIG.STORAGE_KEYS.PROBLEMS, problems);
  
        // Reset form and re-render
        form.reset();
        renderProblems();
        UI.showAlert('Problem added successfully!', 'success');
  
        // Scroll to top to see new problem
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  
    // Search/filter problems
    function setupSearch() {
      const searchInput = document.getElementById('problemSearch');
      if (!searchInput) return;
  
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const problems = Storage.load(CONFIG.STORAGE_KEYS.PROBLEMS, []);
  
        if (!searchTerm) {
          renderProblems();
          return;
        }
  
        // Filter problems
        const filtered = problems.filter(p => 
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
        );
  
        // Render filtered results
        const container = document.getElementById('problemsList');
        if (!container) return;
  
        container.innerHTML = '';
  
        if (filtered.length === 0) {
          container.innerHTML = '<div class="text-center text-muted p-5">No problems found matching your search.</div>';
          return;
        }
  
        filtered.forEach(problem => {
          const card = document.createElement('div');
          card.className = 'problem-card';
          card.dataset.id = problem.id;
  
          card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="mb-0">${problem.title}</h5>
              <button class="btn btn-sm btn-outline-danger btn-delete-problem" title="Delete">×</button>
            </div>
            <p class="mb-2">${problem.description}</p>
            ${problem.videoUrl ? `
              <div class="ratio ratio-16x9 mb-2">
                <iframe src="${problem.videoUrl}" allowfullscreen></iframe>
              </div>
            ` : ''}
            <div class="small text-muted">
              Added: ${problem.createdAt ? Utils.formatDate(problem.createdAt) : 'Unknown'}
            </div>
          `;
  
          container.appendChild(card);
        });
  
        attachProblemDeleteListeners();
      });
    }
  
    // Initialize page
    function init() {
      UI.updateSidebar();
      renderProblems();
      setupProblemForm();
      setupSearch();
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();