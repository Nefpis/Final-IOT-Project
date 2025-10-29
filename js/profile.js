/* profile.js - Profile Page */

(() => {
    // Load and display profile
    function loadProfile() {
      const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {
        name: 'Demo User',
        email: 'demo@example.com',
        photo: '../img/user.jpg'
      });
  
      // Display profile info
      displayProfile(profile);
      
      // Update machine count
      updateMachineCount();
    }
  
    // Display profile information
    function displayProfile(profile) {
      const nameEl = document.getElementById('profileName');
      const emailEl = document.getElementById('profileEmail');
      const photoEl = document.getElementById('profilePhoto');
  
      if (nameEl) nameEl.textContent = profile.name;
      if (emailEl) emailEl.textContent = profile.email;
      if (photoEl) {
        photoEl.src = profile.photo || '../img/user.jpg';
        photoEl.onerror = function() {
          this.onerror = null;
          this.src = '../img/user.jpg';
        };
      }
    }
  
    // Update machine count
    function updateMachineCount() {
      const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
      const countEl = document.getElementById('profileMachines');
      
      if (countEl) {
        countEl.textContent = machines.length;
      }
    }
  
    // Show edit form
    function showEditForm() {
      const editArea = document.getElementById('editArea');
      const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {});
  
      if (!editArea) return;
  
      // Populate form
      const nameInput = document.getElementById('p-name');
      const emailInput = document.getElementById('p-email');
      const photoInput = document.getElementById('p-photo');
  
      if (nameInput) nameInput.value = profile.name || '';
      if (emailInput) emailInput.value = profile.email || '';
      if (photoInput) photoInput.value = profile.photo || '';
  
      // Show edit area
      editArea.style.display = 'block';
  
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    // Hide edit form
    function hideEditForm() {
      const editArea = document.getElementById('editArea');
      if (editArea) {
        editArea.style.display = 'none';
      }
    }
  
    // Setup edit button
    function setupEditButton() {
      const editBtn = document.getElementById('editProfileBtn');
      if (!editBtn) return;
  
      editBtn.addEventListener('click', showEditForm);
    }
  
    // Setup profile form
    function setupProfileForm() {
      const form = document.getElementById('profileForm');
      if (!form) return;
  
      form.addEventListener('submit', (e) => {
        e.preventDefault();
  
        // Get form values
        const formData = {
          name: document.getElementById('p-name').value.trim(),
          email: document.getElementById('p-email').value.trim(),
          photo: document.getElementById('p-photo').value.trim()
        };
  
        // Validate
        const validation = Validator.validateProfileData(formData);
        if (!validation.isValid) {
          Validator.showErrors(validation.errors);
          return;
        }
  
        // Process photo URL
        if (formData.photo) {
          formData.photo = Utils.formatImageUrl(formData.photo);
        } else {
          formData.photo = '../img/user.jpg';
        }
  
        // Save profile
        Storage.save(CONFIG.STORAGE_KEYS.PROFILE, formData);
  
        // Update display
        loadProfile();
        UI.updateSidebar();
        hideEditForm();
  
        UI.showAlert('Profile updated successfully!', 'success');
      });
    }
  
    // Setup cancel button
    function setupCancelButton() {
      const cancelBtn = document.getElementById('cancelEditBtn');
      if (!cancelBtn) return;
  
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideEditForm();
      });
    }
  
    // Setup logout button (will be used with Firebase later)
    function setupLogoutButton() {
      const logoutBtn = document.getElementById('logoutBtn');
      if (!logoutBtn) return;
  
      logoutBtn.addEventListener('click', () => {
        if (!UI.confirm('Are you sure you want to logout?')) return;
  
        // For now, just clear data and redirect
        // Will be replaced with Firebase logout
        Storage.clear();
        window.location.href = 'login.html';
      });
    }
  
    // Delete account (will be enhanced with Firebase)
    function setupDeleteAccount() {
      const deleteBtn = document.getElementById('deleteAccountBtn');
      if (!deleteBtn) return;
  
      deleteBtn.addEventListener('click', () => {
        const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        
        if (confirmation !== 'DELETE') {
          UI.showAlert('Account deletion cancelled', 'info');
          return;
        }
  
        // Clear all data
        Storage.clear();
        UI.showAlert('Account deleted. Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      });
    }
  
    // Initialize page
    function init() {
      UI.updateSidebar();
      loadProfile();
      setupEditButton();
      setupProfileForm();
      setupCancelButton();
      setupLogoutButton();
      setupDeleteAccount();
    }
  
    // Run when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();