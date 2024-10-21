document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  const previewArea = document.getElementById('previewArea');
  console.log('Preview area element:', previewArea);
  const pathParts = window.location.pathname.split('/');
  const websiteId = pathParts[pathParts.length - 1];
  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('page');
  const addSectionForm = document.getElementById('addSectionForm');
  const sectionInput = document.getElementById('sectionInput');
  const toggleInputBtn = document.getElementById('toggleInputBtn');
  const inputColumn = document.getElementById('inputColumn');
  const previewColumn = document.querySelector('.builder-preview');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  let drake;

  if (welcomeOverlay) {
    welcomeOverlay.addEventListener('click', () => {
      welcomeOverlay.style.opacity = '0';
      setTimeout(() => {
        welcomeOverlay.style.display = 'none';
      }, 500);
    });
  }

  function showSpinner() {
    document.getElementById('spinner').style.display = 'flex';
  }

  function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
  }

  let toastQueue = [];
  let isToastActive = false;

  function showToast(message, type = 'success') {
    toastQueue.push({ message, type });
    if (!isToastActive) {
      displayNextToast();
    }
  }

  function displayNextToast() {
    if (toastQueue.length === 0) {
      isToastActive = false;
      return;
    }

    isToastActive = true;
    const { message, type } = toastQueue.shift();
    const toast = document.getElementById('toast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    toast.offsetHeight; // Trigger reflow
    toast.style.animation = null;
    toast.classList.add('show');

    // Dismiss toast after 3 seconds
    setTimeout(() => {
      dismissToast();
    }, 3000);
  }

  function dismissToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('hide');
    setTimeout(() => {
      toast.classList.remove('show', 'hide');
      toast.style.display = 'none';
      displayNextToast(); // Display the next toast in queue
    }, 300);
  }

  // Add click event to dismiss toast
  document.getElementById('toast').addEventListener('click', () => {
    dismissToast();
  });

  if (pageId) {
    loadPageContent(websiteId, pageId);
  }

  addSectionForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const description = sectionInput.value;
    await addSection(description);
  });

  previewArea.addEventListener('click', async function(e) {
    console.log('Click event triggered on preview area');
    console.log('Clicked element:', e.target);

    const clickedButton = e.target.closest('.edit-section, .copy-section, .delete-section');

    if (clickedButton) {
      if (clickedButton.classList.contains('edit-section')) {
        console.log('Edit button clicked');
        const sectionElement = clickedButton.closest('.section');
        const sectionId = sectionElement.dataset.sectionId;
        const newDescription = prompt('Enter new description for this section:', '');
        if (newDescription) {
          await editSection(sectionId, newDescription);
        } else {
          console.log('Edit cancelled or empty description');
        }
      } else if (clickedButton.classList.contains('delete-section')) {
        console.log('Delete button clicked');
        const sectionElement = clickedButton.closest('.section');
        const sectionId = sectionElement.dataset.sectionId;
        if (confirm('Are you sure you want to delete this section?')) {
          await deleteSection(sectionId);
        } else {
          console.log('Delete cancelled');
        }
      } else if (clickedButton.classList.contains('copy-section')) {
        console.log('Copy button clicked');
        const sectionElement = clickedButton.closest('.section');
        const sectionId = sectionElement.dataset.sectionId;
        await copySection(sectionId);
      }
    }
  });

  toggleInputBtn.addEventListener('click', function() {
    inputColumn.classList.toggle('collapsed');
    previewColumn.classList.toggle('full-width');
    this.classList.toggle('collapsed');
    this.querySelector('i').classList.toggle('fa-chevron-left');
    this.querySelector('i').classList.toggle('fa-chevron-right');
  });

  // Initialize dragula for drag-and-drop functionality
  drake = dragula([previewArea], {
    moves: function (el, container, handle) {
      console.log('Dragula move check:', el, container, handle);
      return handle.classList.contains('drag-handle') || handle.closest('.drag-handle');
    },
    direction: 'vertical'
  });

  drake.on('drag', function(el, source) {
    console.log('Drag started:', el, source);
  });

  drake.on('drop', function (el, target, source, sibling) {
    console.log('Drop event:', el, target, source, sibling);
    updateSectionOrder();
  });

  async function addSection(description) {
    try {
      showSpinner();
      console.log('Adding section with description:', description);
      const response = await fetch(`/api/websites/${websiteId}/sections${pageId ? `?page=${pageId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to add section');
      }

      const newSection = await response.json();
      console.log('New section added:', newSection);
      updatePreview(newSection);
      sectionInput.value = '';
      showToast('Section added successfully!');
    } catch (error) {
      console.error('Error adding section:', error);
      showToast('Failed to add section. Please try again.', 'danger');
    } finally {
      hideSpinner();
    }
  }

  async function editSection(sectionId, newDescription) {
    try {
      console.log('Editing section with ID:', sectionId);
      console.log('New description:', newDescription);
      showSpinner();
      const response = await fetch(`/api/websites/${websiteId}/sections/${sectionId}${pageId ? `?page=${pageId}` : ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit section');
      }

      const updatedSection = await response.json();
      console.log('Updated section:', updatedSection);
      updatePreview(updatedSection);
      showToast('Section edited successfully!');
    } catch (error) {
      console.error('Error editing section:', error);
      showToast('Failed to edit section. Please try again.', 'danger');
    } finally {
      hideSpinner();
    }
  }

  async function deleteSection(sectionId) {
    try {
      console.log('Deleting section with ID:', sectionId);
      showSpinner();
      const response = await fetch(`/api/websites/${websiteId}/sections/${sectionId}${pageId ? `?page=${pageId}` : ''}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete section');
      }

      console.log('Section deleted:', sectionId);
      const sectionElement = previewArea.querySelector(`[data-section-id="${sectionId}"]`);
      if (sectionElement) {
        sectionElement.remove();
      }

      showToast('Section deleted successfully!');
    } catch (error) {
      console.error('Error deleting section:', error);
      showToast('Failed to delete section. Please try again.', 'danger');
    } finally {
      hideSpinner();
    }
  }

  async function copySection(sectionId) {
    try {
      console.log('Copying section with ID:', sectionId);
      showSpinner();
      const response = await fetch(`/api/websites/${websiteId}/sections/${sectionId}/copy${pageId ? `?page=${pageId}` : ''}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to copy section');
      }

      const newSection = await response.json();
      console.log('New section created:', newSection);
      const originalSection = previewArea.querySelector(`[data-section-id="${sectionId}"]`);
      const newSectionElement = createSectionElement(newSection);
      originalSection.insertAdjacentElement('afterend', newSectionElement);

      showToast('Section copied successfully!');
    } catch (error) {
      console.error('Error copying section:', error);
      showToast('Failed to copy section. Please try again.', 'danger');
    } finally {
      hideSpinner();
    }
  }

  async function loadPageContent(websiteId, pageId) {
    try {
      showSpinner();
      const response = await fetch(`/api/websites/${websiteId}/pages/${pageId}`);
      if (!response.ok) {
        throw new Error('Failed to load page content');
      }
      const pageData = await response.json();
      pageData.sections.forEach(section => updatePreview(section));
      showToast('Page content loaded successfully!');
    } catch (error) {
      console.error('Error loading page content:', error);
      showToast('Failed to load page content. Please try again.', 'danger');
    } finally {
      hideSpinner();
    }
  }

  function updatePreview(section) {
    console.log('Section updated:', section);
    console.log('Section content:', section.content);
    console.log('Section CSS:', section.css);

    const existingSection = previewArea.querySelector(`[data-section-id="${section.sectionReference}"]`);

    if (existingSection) {
      existingSection.querySelector('.section-content').innerHTML = section.content;
      // Update the style element
      let styleElement = existingSection.querySelector('style');
      if (!styleElement) {
        styleElement = document.createElement('style');
        existingSection.appendChild(styleElement);
      }
      styleElement.textContent = section.css;
    } else {
      const sectionElement = createSectionElement(section);
      previewArea.appendChild(sectionElement);
    }
  }

  async function updateSectionOrder() {
    const sections = Array.from(document.querySelectorAll('.section'));
    const order = sections.map(section => section.dataset.sectionId);

    try {
      console.log('Updating section order:', order);
      const response = await fetch(`/api/websites/${websiteId}/pages/${pageId}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order }),
      });

      if (!response.ok) {
        throw new Error('Failed to update section order');
      }

      console.log('Section order updated successfully');
      showToast('Section order updated successfully!');
    } catch (error) {
      console.error('Error updating section order:', error);
      showToast('Failed to update section order. Please try again.', 'danger');
    }
  }

  function createSectionElement(section) {
    console.log('Creating section element:', section);
    console.log('Section reference:', section.sectionReference);
    console.log('Section content:', section.content);
    console.log('Section CSS:', section.css);

    const sectionElement = document.createElement('div');
    sectionElement.classList.add('section');
    sectionElement.dataset.sectionId = section.sectionReference;

    // Create a style element for the section's CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = section.css;

    sectionElement.innerHTML = `
      <div class="section-controls">
        <span class="drag-handle"><i class="fas fa-grip-lines"></i></span>
        <button class="btn btn-primary btn-sm edit-section" title="Edit Section">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-success btn-sm copy-section" title="Copy Section">
          <i class="fas fa-copy"></i>
        </button>
        <button class="btn btn-danger btn-sm delete-section" title="Delete Section">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <div class="section-content">${section.content}</div>
    `;

    // Append the style element to the section
    sectionElement.appendChild(styleElement);

    return sectionElement;
  }

  // Add flashy effect to the "Add Section" button
  const addSectionBtn = addSectionForm.querySelector('button[type="submit"]');
  addSectionBtn.classList.add('flashy-btn');
});