document.addEventListener("DOMContentLoaded", () => {
  const basketList = document.getElementById("basket-items");
  const basketCount = document.getElementById("basket-count");

  function renderBasket(basket) {
    basketList.innerHTML = "";
    const basketTotal = document.getElementById("basket-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    if (!basket || basket.length === 0) {
      basketList.innerHTML =
        '<li class="list-group-item text-muted">Basket is empty</li>';
      basketCount.textContent = "0";
      basketTotal.textContent = "";
      checkoutBtn.textContent = "Place Fake-Order (You won't be charged)";
      return;
    }

    let count = 0;
    let total = 0;

    basket.forEach((item) => {
      count += item.quantity;
      total += item.quantity * item.price;
    
      const li = document.createElement("li");
      li.className =
        "list-group-item p-0 d-flex align-items-center border-0 mb-2";
      li.style.height = "80px";
      li.style.position = "relative";
      li.style.background = `url('${item.imageUrl}') center center / cover no-repeat`;
      li.style.borderRadius = "0.5rem";
      li.style.overflow = "hidden";
      li.style.color = "white";
      li.style.backdropFilter = "blur(4px)";
      li.style.webkitBackdropFilter = "blur(4px)";
    
      const overlay = document.createElement("div");
      overlay.style.background = "rgba(0,0,0,0.65)";
      overlay.style.backdropFilter = "blur(4px)";
      overlay.style.webkitBackdropFilter = "blur(4px)";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.display = "flex";
      overlay.style.flexDirection = "row";
      overlay.style.justifyContent = "space-between";
      overlay.style.alignItems = "center";
      overlay.style.padding = "0.5rem 1rem";
      overlay.style.borderRadius = "0.5rem";
    
      overlay.innerHTML = `
        <div>
          <div class="fw-bold">${item.name}</div>
          <small>Qty: ${item.quantity} • ${(item.price * item.quantity).toFixed(2)} Fizzles</small>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button class="btn btn-sm btn-light" data-action="decrease" data-id="${item.id}">−</button>
          <button class="btn btn-sm btn-light" data-action="increase" data-id="${item.id}">+</button>
        </div>
      `;
    
      li.appendChild(overlay);
      basketList.appendChild(li);
    });
    

    basketCount.textContent = count;
    basketTotal.textContent = `Total: ${total.toFixed(2)} Fizzles`;
    checkoutBtn.textContent = `Place Fake-Order – ${total.toFixed(2)} Fizzles`;

    // Bind increase/decrease actions
    basketList.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const itemId = btn.dataset.id;
        const action = btn.dataset.action;

        const response = await fetch(`/basket/${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId }),
        });

        const data = await response.json();
        if (response.ok) {
          renderBasket(data.basket);
        } else {
          alert("Failed to update basket");
        }
      });
    });
  }

  // Fetch current basket when page loads, currently doesnt even work. 
  /* fetch("/basket")
    .then((res) => res.json())
    .then((data) => {
      if (data.basket) renderBasket(data.basket);
    })
    .catch((err) => {
      console.error("Error loading basket:", err);
      // Handle the error
    }); */

  // Hook into add-to-basket forms
  document.querySelectorAll(".add-to-basket-form").forEach((form) => {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const itemId = this.dataset.itemId;
      const quantity = this.querySelector('input[name="quantity"]').value;

      const response = await fetch("/basket/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity }),
      });

      const data = await response.json();
      if (response.ok) {
        renderBasket(data.basket);
      } else {
        alert("Failed to add item");
      }
    });
  });

  document
    .getElementById("checkout-btn")
    .addEventListener("click", async () => {
      const confirmOrder = confirm("Place this order?");
      if (!confirmOrder) return;

      const response = await fetch("/basket/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = `/orders/${data.orderId}`; // if you have an order view page
        renderBasket([]); // Clear the sidebar
      } else {
        alert(data.message || "Failed to place order");
      }
    });
});
