/* problems.js - Problems Database Page (FIRESTORE) */

(() => {
  let unsubscribeProblems = null;

  // Render problems list
  function renderProblems() {
    const container = document.getElementById('problemsList');
    if (!container) return;

    const problems = Storage._cache.problems;
    container.innerHTML = '';

    if (problems.length === 0) {
      container.innerHTML = '<div class="text-center text-muted p-5">No problems documented yet. Add your first problem below.</div>';
      return;
    }

    const currentUserId = Firebase.getCurrentUserId();

    problems.forEach(problem => {
      const card = document.createElement('div');
      card.className = 'problem-card';
      card.dataset.id = problem.id;

      // Only show delete button if user created this problem
      const deleteButton = problem.createdByUserId === currentUserId 
        ? `<button class="btn btn-sm btn-outline-danger btn-delete-problem" title="Delete">×</button>`
        : '';

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="mb-0">${problem.title}</h5>
          ${deleteButton}
        </div>
        <p class="mb-2">${problem.description}</p>
        ${problem.videoUrl ? `
          <div class="ratio ratio-16x9 mb-2">
            <iframe src="${problem.videoUrl}" allowfullscreen></iframe>
          </div>
        ` : ''}
        <div class="small text-muted">
          Added by: ${problem.createdBy || 'Unknown'} • 
          ${problem.createdAt ? Utils.formatDate(problem.createdAt) : 'Unknown date'}
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
      button.addEventListener('click', async (e) => {
        if (!UI.confirm('Are you sure you want to delete this problem?')) return;

        const card = e.target.closest('.problem-card');
        const problemId = card.dataset.id;
        
        // Find problem to get createdByUserId
        const problem = Storage._cache.problems.find(p => p.id === problemId);
        if (!problem) return;

        await deleteProblem(problemId, problem.createdByUserId);
      });
    });
  }

  // Delete problem - FIRESTORE
  async function deleteProblem(problemId, createdByUserId) {
    const result = await FirestoreDB.deleteProblem(problemId, createdByUserId);
    
    if (result.success) {
      UI.showAlert('Problem deleted successfully', 'success');
    } else {
      UI.showAlert('Failed to delete: ' + result.error, 'error');
    }
  }

  // Setup add problem form
  function setupProblemForm() {
    const form = document.getElementById('problemForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
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

      // Add to Firestore
      const result = await FirestoreDB.addProblem({
        title: title,
        description: description,
        videoUrl: videoUrl
      });

      if (result.success) {
        form.reset();
        UI.showAlert('Problem added successfully! Now visible to all users.', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        UI.showAlert('Failed to add problem: ' + result.error, 'error');
      }
    });
  }

  // Search/filter problems
  function setupSearch() {
    const searchInput = document.getElementById('problemSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const problems = Storage._cache.problems;

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

      const currentUserId = Firebase.getCurrentUserId();

      filtered.forEach(problem => {
        const card = document.createElement('div');
        card.className = 'problem-card';
        card.dataset.id = problem.id;

        const deleteButton = problem.createdByUserId === currentUserId 
          ? `<button class="btn btn-sm btn-outline-danger btn-delete-problem" title="Delete">×</button>`
          : '';

        card.innerHTML = `
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="mb-0">${problem.title}</h5>
            ${deleteButton}
          </div>
          <p class="mb-2">${problem.description}</p>
          ${problem.videoUrl ? `
            <div class="ratio ratio-16x9 mb-2">
              <iframe src="${problem.videoUrl}" allowfullscreen></iframe>
            </div>
          ` : ''}
          <div class="small text-muted">
            Added by: ${problem.createdBy || 'Unknown'} • 
            ${problem.createdAt ? Utils.formatDate(problem.createdAt) : 'Unknown'}
          </div>
        `;

        container.appendChild(card);
      });

      attachProblemDeleteListeners();
    });
  }

  // Setup real-time listener
  function setupRealtimeListener() {
    unsubscribeProblems = FirestoreDB.listenToProblems((problems) => {
      Storage._cache.problems = problems;
      renderProblems();
    });
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    setupRealtimeListener();
    setupProblemForm();
    setupSearch();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (unsubscribeProblems) unsubscribeProblems();
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