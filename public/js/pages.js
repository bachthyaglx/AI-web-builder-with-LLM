document.addEventListener('DOMContentLoaded', function() {
  const addPageForm = document.getElementById('addPageForm');
  const pagesList = document.getElementById('pagesList');

  addPageForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    console.log('Form data before submission:', Object.fromEntries(formData));
    const response = await fetch(this.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (response.ok) {
      console.log('Response OK, reloading page');
      window.location.reload();
    } else {
      const errorData = await response.json();
      console.error('Error response:', response.status, errorData);
      alert(errorData.message || 'Failed to create page. Please try again.');
    }
  });

  pagesList.addEventListener('click', async function(e) {
    if (e.target.classList.contains('delete-page')) {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this page?')) {
        const websiteId = e.target.dataset.websiteId;
        const pageId = e.target.dataset.pageId;
        const response = await fetch(`/websites/${websiteId}/pages/${pageId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          e.target.closest('.col-md-6').remove();
        } else {
          const error = await response.text();
          console.error('Error deleting page:', error);
          alert('Failed to delete page. Please check the console for details.');
        }
      }
    }
  });
});