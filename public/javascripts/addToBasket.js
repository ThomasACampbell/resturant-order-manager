document.querySelectorAll(".add-to-basket-form").forEach((form) => {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const itemId = this.dataset.itemId;
    const quantity = this.querySelector('input[name="quantity"]').value;
    await handleBasketChange("/basket/add", { itemId, quantity });
  });
});

document.querySelectorAll(".adjust-quantity").forEach((button) => {
  button.addEventListener("click", async function () {
    const itemId = this.dataset.itemId;
    const action = this.dataset.action;
    await handleBasketChange(`/basket/update/${itemId}`, { action });
  });
});

async function handleBasketChange(url, bodyData) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    
    renderBasket(data.basket, data.item);
  } catch (err) {
    alert(err.message || "Something went wrong.");
  }
}

function renderBasket(basket, updatedItem = null) {
  updateBadge(basket);
  updateTotal(basket);

  

  if (updatedItem) {
    updateItemDOM(updatedItem);
  } else {
    // Fallback in case no specific item info is provided
    location.reload();
  }
}

function updateBadge(basket) {
  const badge = document.getElementById("basket-count");
  if (badge) {
    const count = basket.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = count;
  }
}

function updateTotal(basket) {
  const totalElem = document.getElementById("basket-total");
  if (totalElem) {
    const total = basket.reduce((sum, item) => sum + parseFloat(item.total), 0);
    totalElem.textContent = `Total: ${total.toFixed(2)} Fizzles`;
  }
}

function updateItemDOM(item) {
  const el = document.getElementById(`basket-item-${item.id}`);
  if (el) {
    const quantityElement = el.querySelector(".item-quantity");
    const totalElement = el.querySelector(".item-total");
    if (quantityElement) quantityElement.textContent = item.quantity;
    if (totalElement) totalElement.textContent = `${item.total}`;
  } else {
    location.reload(); // fallback if item not yet in DOM
  }
}

// Checkout Handler
const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    if (!confirm("Place this order?")) return;
    try {
      const res = await fetch("/basket/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = `/orders/${data.orderId}`;
    } catch (err) {
      alert("⚠️ Failed to place order.");
    }
  });
}
