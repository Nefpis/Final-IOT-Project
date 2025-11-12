/* profile.js - Profile Page */

(() => {
  // Load and display profile
  function loadProfile() {
    const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {
      firstname: 'Demo',
      lastname: 'User',
      name: 'Demo User',
      email: 'demo@example.com',
      photo: '../img/user.jpg'
    });

    // Display profile info
    displayProfile(profile);
    
    // Update statistics
    updateStatistics();
  }

  // Display profile information
  function displayProfile(profile) {
    // Build full name
    const fullName = profile.name || `${profile.firstname || 'Demo'} ${profile.lastname || 'User'}`;
    
    // Update header
    const nameDisplay = document.getElementById('profileNameDisplay');
    const emailDisplay = document.getElementById('profileEmailDisplay');
    
    if (nameDisplay) nameDisplay.textContent = fullName;
    if (emailDisplay) emailDisplay.textContent = profile.email || 'demo@example.com';

    // Update info fields
    const firstNameDisplay = document.getElementById('displayFirstName');
    const lastNameDisplay = document.getElementById('displayLastName');
    const emailInfoDisplay = document.getElementById('displayEmail');
    
    if (firstNameDisplay) firstNameDisplay.textContent = profile.firstname || 'Demo';
    if (lastNameDisplay) lastNameDisplay.textContent = profile.lastname || 'User';
    if (emailInfoDisplay) emailInfoDisplay.textContent = profile.email || 'demo@example.com';

    // Update profile photo
    updateProfilePhoto(profile.photo || '../img/user.jpg');
  }

  // Update profile photo display
  function updateProfilePhoto(photoUrl) {
    const finalPhotoUrl = photoUrl || '../img/user.jpg';
    
    // Update large profile photo
    const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
    if (profilePhotoDisplay) {
      profilePhotoDisplay.src = finalPhotoUrl;
      profilePhotoDisplay.onerror = function() {
        this.onerror = null;
        this.src = '../img/user.jpg';
      };
    }

    // Update all sidebar photos
    const sidebarPhotos = document.querySelectorAll('.user-photo');
    sidebarPhotos.forEach(photo => {
      photo.src = finalPhotoUrl;
      photo.onerror = function() {
        this.onerror = null;
        this.src = '../img/user.jpg';
      };
    });
  }

  // Update statistics
  function updateStatistics() {
    const machines = Storage.load(CONFIG.STORAGE_KEYS.MACHINES, []);
    const logs = Storage.load(CONFIG.STORAGE_KEYS.LOGS, []);
    const fixedLogs = logs.filter(l => l.status === CONFIG.LOG_STATUS.FIXED);

    // Update stat displays
    const statMachines = document.getElementById('statMachines');
    const statLogs = document.getElementById('statLogs');
    const statFixed = document.getElementById('statFixed');

    if (statMachines) statMachines.textContent = machines.length;
    if (statLogs) statLogs.textContent = logs.length;
    if (statFixed) statFixed.textContent = fixedLogs.length;
  }

  // Setup photo upload
  function setupPhotoUpload() {
    const photoUpload = document.getElementById('photoUpload');
    if (!photoUpload) return;

    photoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        UI.showAlert('Please select an image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        UI.showAlert('Image size must be less than 5MB', 'error');
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      
      reader.onload = function(event) {
        const base64Image = event.target.result;
        
        // Get existing profile
        const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {});
        
        // Update photo
        profile.photo = base64Image;
        
        // Save profile
        Storage.save(CONFIG.STORAGE_KEYS.PROFILE, profile);

        // Update display immediately
        updateProfilePhoto(base64Image);
        
        // Force update sidebar
        UI.updateSidebar();

        UI.showAlert('Profile photo updated successfully!', 'success');
      };

      reader.onerror = function() {
        UI.showAlert('Error reading image file', 'error');
      };

      reader.readAsDataURL(file);
    });
  }

  // Show edit form
  function showEditForm() {
    const editArea = document.getElementById('editArea');
    if (!editArea) return;

    const profile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {});

    // Populate form
    const firstnameInput = document.getElementById('p-firstname');
    const lastnameInput = document.getElementById('p-lastname');
    const emailInput = document.getElementById('p-email');

    if (firstnameInput) firstnameInput.value = profile.firstname || '';
    if (lastnameInput) lastnameInput.value = profile.lastname || '';
    if (emailInput) emailInput.value = profile.email || '';

    // Show edit area with smooth transition
    editArea.style.display = 'block';

    // Scroll to form
    setTimeout(() => {
      editArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showEditForm();
    });
  }

  // Setup profile form
  function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form values
      const firstname = document.getElementById('p-firstname').value.trim();
      const lastname = document.getElementById('p-lastname').value.trim();
      const email = document.getElementById('p-email').value.trim();

      // Validate
      if (!firstname || !lastname) {
        UI.showAlert('First name and last name are required', 'error');
        return;
      }

      if (!Validator.isValidEmail(email)) {
        UI.showAlert('Please enter a valid email address', 'error');
        return;
      }

      // Get existing profile to preserve photo
      const existingProfile = Storage.load(CONFIG.STORAGE_KEYS.PROFILE, {});

      // Build updated profile
      const updatedProfile = {
        firstname: firstname,
        lastname: lastname,
        name: `${firstname} ${lastname}`,
        email: email,
        photo: existingProfile.photo || '../img/user.jpg'
      };

      // Save profile
      Storage.save(CONFIG.STORAGE_KEYS.PROFILE, updatedProfile);

      // Update displays
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

  // Delete account
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
        window.location.href = 'login-registration.html';
      }, 2000);
    });
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    loadProfile();
    setupPhotoUpload();
    setupEditButton();
    setupProfileForm();
    setupCancelButton();
    setupDeleteAccount();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();