document.addEventListener('DOMContentLoaded', () => {
  // Select all favorite toggle buttons
  const toggleButtons = document.querySelectorAll('.favorite-toggle');

  toggleButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const itemId = button.dataset.itemId;
      const icon = button.querySelector('i');
      const isFavorite = icon.classList.contains('fas');
      button.disabled = true; // Disable button during request

      try {
        if (isFavorite) {
          // Remove favorite (DELETE request)
          const response = await fetch('/users/favorites', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId }),
          });

          if (!response.ok) {
            throw new Error((await response.json()).error || 'Failed to remove favorite');
          }

          // Update UI
          icon.classList.remove('fas');
          icon.classList.add('far');
          showToast('Item removed from favorites', 'success');
        } else {
          // Add favorite (POST request)
          const response = await fetch('/users/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId }),
          });

          if (!response.ok) {
            throw new Error((await response.json()).error || 'Failed to add favorite');
          }

          // Update UI
          icon.classList.remove('far');
          icon.classList.add('fas');
          showToast('Item added to favorites', 'success');
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        showToast(error.message, 'danger');
      } finally {
        button.disabled = false; // Re-enable button
      }
    });
  });

  // Function to show Bootstrap toast notification
  function showToast(message, type) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toastId = `toast-${Date.now()}`;
    const bgClass = type === 'success' ? 'bg-success' : 'bg-danger';
    const toastHtml = `
      <div id="${toastId}" class="toast ${bgClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
          <button type="button" class="btn(close" data-bs-dismiss="toast" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="toast-body">${message}</div>
      </div>
    `;

   

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    toastElement.addEventListener("click", () => {
      window.location.href = "/users/favorites";
    });
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
  }

  // Create toast container if it doesn't exist
  function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
  }
});