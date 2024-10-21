document.addEventListener('DOMContentLoaded', function() {
  const customizationForm = document.getElementById('customizationForm');

  // Log the initial values of the form fields
  console.log('Initial form field values:', {
    targetAudience: document.getElementById('targetAudience').value,
    mainGoal: document.getElementById('mainGoal').value,
    uniqueSellingPoint: document.getElementById('uniqueSellingPoint').value,
    brandPersonality: document.getElementById('brandPersonality').value
  });

  customizationForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Extracting the websiteId from the URL
    const websiteId = window.location.pathname.split('/')[2];

    const formData = {
      targetAudience: document.getElementById('targetAudience').value,
      mainGoal: document.getElementById('mainGoal').value,
      uniqueSellingPoint: document.getElementById('uniqueSellingPoint').value,
      brandPersonality: document.getElementById('brandPersonality').value
    };

    try {
      const response = await fetch(`/api/websites/${websiteId}/customize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      alert('Website customization saved successfully!');
    } catch (error) {
      console.error('Error saving customization:', error.message, error.stack);
      alert('Failed to save customization. Please try again.');
    }
  });
});