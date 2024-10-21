document.addEventListener('DOMContentLoaded', function() {
  console.log('Document ready function started');
  console.log('Preview Header button visibility:', $('#previewHeaderBtn').is(':visible'));
  console.log('Preview Footer button visibility:', $('#previewFooterBtn').is(':visible'));
  const website = JSON.parse(document.getElementById('websiteData').textContent);

  function showSpinner() {
    $('#headerFooterSpinner').show();
  }

  function hideSpinner() {
    $('#headerFooterSpinner').hide();
  }

  function updatePreview(type, content, css) {
    console.log(`Updating preview for ${type}`);
    $(`#preview${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).show();
    window[`${type}Content`] = content;
    window[`${type}CSS`] = css;
    console.log(`${type} preview button should now be visible`);
  }

  function generateHeaderFooter(type) {
    console.log(`Generating ${type} - Start`);
    showSpinner();
    $.post(`/websites/${website.id}/generate-header-footer`, { type })
      .done(function(data) {
        console.log(`${type} generation successful:`, data);
        updatePreview(type, data.content, data.css);
        $(`#generate${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).hide();
        $(`#preview${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).show();

        console.log(`Removing existing edit button for ${type}`);
        $(`#edit${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).remove();

        console.log(`Creating new edit button for ${type}`);
        const editBtn = $(`<button id="edit${type.charAt(0).toUpperCase() + type.slice(1)}Btn" class="btn btn-primary">Edit ${type.charAt(0).toUpperCase() + type.slice(1)}</button>`);
        $(`#generate${type.charAt(0).toUpperCase() + type.slice(1)}Btn`).after(editBtn);
        showConfetti();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.error(`Error generating ${type}:`, textStatus, errorThrown);
        alert(`Error generating ${type}: ${errorThrown}`);
      })
      .always(function() {
        hideSpinner();
      });
  }

  function editHeaderFooter(type) {
    console.log(`editHeaderFooter called for ${type}`);
    console.log(`Current event target:`, event ? event.currentTarget : 'No event object');

    const description = prompt(`Enter new description for the ${type}:`);
    if (description) {
        console.log(`Description entered for ${type}: ${description}`);
        showSpinner();
        $.ajax({
            url: `/websites/${website.id}/edit-header-footer`,
            method: 'PUT',
            data: { type, description },
            success: function(data) {
                console.log(`${type} edit successful:`, data);
                updatePreview(type, data.content, data.css);
                showConfetti();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(`Error editing ${type}:`, textStatus, errorThrown);
                alert(`Error editing ${type}: ${errorThrown}`);
            },
            complete: function() {
                hideSpinner();
            }
        });
    } else {
        console.log(`Edit cancelled or empty description for ${type}`);
    }
  }

  $('#generateHeaderBtn').click(function() {
    generateHeaderFooter('header');
  });

  $('#generateFooterBtn').click(function() {
    generateHeaderFooter('footer');
  });

  // Event delegation for edit buttons
  $(document).on('click', '#editHeaderBtn, #editFooterBtn', function(e) {
    e.preventDefault();
    const type = this.id === 'editHeaderBtn' ? 'header' : 'footer';
    console.log(`Edit ${type} button clicked`);
    editHeaderFooter(type);
  });

  $(document).on('click', '#previewHeaderBtn', function() {
    console.log('Preview Header button clicked');
    openPreviewInNewTab('header');
  });

  $(document).on('click', '#previewFooterBtn', function() {
    console.log('Preview Footer button clicked');
    openPreviewInNewTab('footer');
  });

  function openPreviewInNewTab(type) {
    const websiteId = JSON.parse(document.getElementById('websiteData').textContent).id;
    const previewUrl = `/websites/${websiteId}/preview-header-footer/${type}`;
    window.open(previewUrl, `${type}Preview`);
  }

  if (website.header && website.header.content) {
    $('#generateHeaderBtn').hide();
    $('#editHeaderBtn').show();
    $('#previewHeaderBtn').show();
  }

  if (website.footer && website.footer.content) {
    $('#generateFooterBtn').hide();
    $('#editFooterBtn').show();
    $('#previewFooterBtn').show();
  }

  // Add tooltips to buttons
  $('[data-toggle="tooltip"]').tooltip();

  // Add a confetti effect when generating or editing is successful
  function showConfetti() {
    console.log('Attempting to show confetti');
    if (typeof confetti === 'undefined') {
      console.error('confetti is not defined. The confetti library may not be loaded correctly.');
      return;
    }
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  // Add a canvas for the confetti
  $('body').append('<canvas id="confetti-canvas"></canvas>');
  $('#confetti-canvas').css({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999
  });
});