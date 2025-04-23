document.addEventListener('DOMContentLoaded', () => {
  document
    .querySelectorAll('.cancel-btn, .open-btn, .step-status-btn')
    .forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()

        const orderId = button.dataset.orderId
        const step = button.dataset.statusStep
        const status = button.dataset.status

        const payload = step
          ? { step: parseInt(step) } // Step-based change
          : { status } // Direct status change

        console.log('➡️ Sending PUT request with payload:', payload)

        try {
          const response = await axios.put(`/orders/update/${orderId}`, payload)

          if (response.status === 200) {
            console.log('✅ Status updated:', response.data)
            setTimeout(() => window.location.reload(), 200)
          } else {
            alert('Failed to update order')
          }
        } catch (err) {
          console.error('🔥 PUT request error:', err)
          alert('Something went wrong')
        }
      })
    })


      // JavaScript to filter orders based on selected criteria
      document.getElementById('orderFilterForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const statusFilter = document.getElementById('statusFilter').value;
        const todayFilter = document.getElementById('todayFilter').checked;

        const allOrders = JSON.stringify(orders);

        let filteredOrders = allOrders;

        // Filter by status
        if (statusFilter !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status.name.toLowerCase() === statusFilter.toLowerCase());
        }

        // Filter by today's orders only
        if (todayFilter) {
          const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
          filteredOrders = filteredOrders.filter(order => order.updatedAt.split('T')[0] === today);
        }

        // Render filtered orders dynamically
        const ordersContainer = document.getElementById('ordersContainer');
        ordersContainer.innerHTML = ''; // Clear existing orders

        filteredOrders.forEach(function(order) {
          const orderHTML = `<%- include('./partials/order-preview-card.ejs', { order }) %>`;
          ordersContainer.innerHTML += orderHTML;
        });
      });
})
