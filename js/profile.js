/* profile.js - Profile Page (FIRESTORE) */

(() => {
  // Load and display profile
  async function loadProfile() {
    const profile = await FirestoreDB.getUserProfile();
    
    if (!profile) {
      console.warn('No profile found, using defaults');
      return;
    }

    Storage._cache.profile = profile;
    displayProfile(profile);
    updateStatistics();
  }

  // Display profile information
  function displayProfile(profile) {
    const fullName = profile.name || `${profile.firstname || 'Demo'} ${profile.lastname || 'User'}`;
    
    const nameDisplay = document.getElementById('profileNameDisplay');
    const emailDisplay = document.getElementById('profileEmailDisplay');
    
    if (nameDisplay) nameDisplay.textContent = fullName;
    if (emailDisplay) emailDisplay.textContent = profile.email || 'demo@example.com';

    const firstNameDisplay = document.getElementById('displayFirstName');
    const lastNameDisplay = document.getElementById('displayLastName');
    const emailInfoDisplay = document.getElementById('displayEmail');
    
    if (firstNameDisplay) firstNameDisplay.textContent = profile.firstname || 'Demo';
    if (lastNameDisplay) lastNameDisplay.textContent = profile.lastname || 'User';
    if (emailInfoDisplay) emailInfoDisplay.textContent = profile.email || 'demo@example.com';

    updateProfilePhoto(profile.photo || '../img/user.jpg');
  }

  // Update profile photo display
  function updateProfilePhoto(photoUrl) {
    const finalPhotoUrl = photoUrl || '../img/user.jpg';
    
    const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
    if (profilePhotoDisplay) {
      profilePhotoDisplay.src = finalPhotoUrl;
      profilePhotoDisplay.onerror = function() {
        this.onerror = null;
        this.src = '../img/user.jpg';
      };
    }

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
    const machines = Storage._cache.machines;
    const logs = Storage._cache.logs;
    const fixedLogs = logs.filter(l => l.status === CONFIG.LOG_STATUS.FIXED);

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

    photoUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        UI.showAlert('Please select an image file', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        UI.showAlert('Image size must be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      
      reader.onload = async function(event) {
        const base64Image = event.target.result;
        
        // Update in Firestore
        const result = await FirestoreDB.updateUserProfile({
          photo: base64Image
        });

        if (result.success) {
          updateProfilePhoto(base64Image);
          UI.updateSidebar();
          UI.showAlert('Profile photo updated successfully!', 'success');
        } else {
          UI.showAlert('Failed to update photo: ' + result.error, 'error');
        }
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

    const profile = Storage._cache.profile;

    const firstnameInput = document.getElementById('p-firstname');
    const lastnameInput = document.getElementById('p-lastname');
    const emailInput = document.getElementById('p-email');

    if (firstnameInput) firstnameInput.value = profile.firstname || '';
    if (lastnameInput) lastnameInput.value = profile.lastname || '';
    if (emailInput) emailInput.value = profile.email || '';

    editArea.style.display = 'block';

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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstname = document.getElementById('p-firstname').value.trim();
      const lastname = document.getElementById('p-lastname').value.trim();
      const email = document.getElementById('p-email').value.trim();

      if (!firstname || !lastname) {
        UI.showAlert('First name and last name are required', 'error');
        return;
      }

      if (!Validator.isValidEmail(email)) {
        UI.showAlert('Please enter a valid email address', 'error');
        return;
      }

      const updatedProfile = {
        firstname: firstname,
        lastname: lastname,
        name: `${firstname} ${lastname}`,
        email: email
      };

      // Update in Firestore
      const result = await FirestoreDB.updateUserProfile(updatedProfile);

      if (result.success) {
        await loadProfile();
        UI.updateSidebar();
        hideEditForm();
        UI.showAlert('Profile updated successfully!', 'success');
      } else {
        UI.showAlert('Failed to update profile: ' + result.error, 'error');
      }
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

    deleteBtn.addEventListener('click', async () => {
      const confirmation = prompt('Type "DELETE" to confirm account deletion:');
      
      if (confirmation !== 'DELETE') {
        UI.showAlert('Account deletion cancelled', 'info');
        return;
      }

      // In real implementation, you'd delete user data from Firestore
      // For now, just logout and clear local cache
      await Auth.logout();
      UI.showAlert('Account deleted. Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = 'login-registration.html';
      }, 2000);
    });
  }

  // Setup real-time listeners for statistics
  function setupRealtimeListeners() {
    FirestoreDB.listenToMachines((machines) => {
      Storage._cache.machines = machines;
      updateStatistics();
    });

    FirestoreDB.listenToLogs((logs) => {
      Storage._cache.logs = logs;
      updateStatistics();
    });
  }

  // Initialize page
  function init() {
    UI.updateSidebar();
    loadProfile();
    setupRealtimeListeners();
    setupPhotoUpload();
    setupEditButton();
    setupProfileForm();
    setupCancelButton();
    setupDeleteAccount();
  }

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