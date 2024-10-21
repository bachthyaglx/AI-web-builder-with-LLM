document.addEventListener('DOMContentLoaded', function() {
  const deleteButtons = document.querySelectorAll('.delete-website');

  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const websiteId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this website?')) {
        deleteWebsite(websiteId);
      }
    });
  });

  function deleteWebsite(websiteId) {
    fetch(`/my-sites/${websiteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Website deleted successfully') {
        const websiteElement = document.querySelector(`[data-id="${websiteId}"]`).closest('li');
        websiteElement.remove();
      } else {
        alert('Error deleting website');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Error deleting website');
    });
  }
});