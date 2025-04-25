var express = require("express");
var router = express.Router();
var db = require("../models");

var ItemService = require("../services/ItemService");
var itemService = new ItemService(db);

var OrderService = require("../services/OrderService");
var orderService = new OrderService(db);

var CategoryService = require("../services/CategoryService");
var categoryService = new CategoryService(db);

var UserService = require("../services/UserService");
var userService = new UserService(db);

var StatusService = require("../services/StatusService");
const { isAuthenticated } = require("./authMiddlewares");
var statusService = new StatusService(db);

router.get("/", async (req, res) => {
  const basket = req.session.basket || [];

  const itemIds = basket.map((b) => b.itemId);
  const dbItems = await itemService.getAllByIds(itemIds);

  const detailedBasket = basket.map((b) => {
    const item = dbItems.find((i) => i.id === b.itemId);
    return {
      ...item.dataValues,
      quantity: b.quantity,
      total: (b.quantity * item.price).toFixed(2),
    };
  });

  const topItems = await itemService.getTopSellings();
  topItems.map((item) => ({
    name: item.item.name,
    sold: item.dataValues.totalSold,
  }));

  res.render("basket", {
    topItems: topItems,
    basket: detailedBasket,
    title: "Basket",
  });
});

router.post("/add", async (req, res) => {
  const { itemId, quantity } = req.body;

  if (!req.session.basket) {
    req.session.basket = [];
  }

  const basket = req.session.basket;
  const existing = basket.find((item) => item.itemId == itemId);

  if (existing) {
    existing.quantity += parseInt(quantity);
  } else {
    basket.push({ itemId: parseInt(itemId), quantity: parseInt(quantity) });
  }

  req.session.basket = basket;
  await sendDetailedBasket(req, res, itemId);
});


// Route handler for updating basket
router.post("/update/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { action } = req.body;

  if (!req.session.basket) {
    return res.status(400).json({ message: "Basket is empty" });
  }

  const basket = req.session.basket;
  const item = basket.find((i) => i.itemId == itemId);

  if (!item) {
    return res.status(404).json({ message: "Item not found in basket" });
  }

  if (action === "increase") {
    item.quantity += 1;
  } else if (action === "decrease" && item.quantity > 1) {
    item.quantity -= 1;
  }

  req.session.basket = basket;
  await sendDetailedBasket(req, res, itemId);
});

// Increase quantity
router.post("/increase", async (req, res) => {
  const { itemId } = req.body;
  const basket = req.session.basket || [];
  const item = basket.find((i) => i.itemId == itemId);
  if (item) item.quantity += 1;

  await sendDetailedBasket(req, res);
});

// Decrease quantity or remove
router.post("/decrease", async (req, res) => {
  const { itemId } = req.body;
  let basket = req.session.basket || [];
  const item = basket.find((i) => i.itemId == itemId);
  if (item) {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      basket = basket.filter((i) => i.itemId != itemId);
    }
  }

  req.session.basket = basket;
  await sendDetailedBasket(req, res);
  
});

// Shared logic to send updated detailed basket
async function sendDetailedBasket(req, res, changedItemId = null) {
  const itemIds = req.session.basket.map((b) => b.itemId);
  const dbItems = await itemService.getAllByIds(itemIds);

  const detailedBasket = req.session.basket.map((b) => {
    const item = dbItems.find((i) => i.id === b.itemId);
    return {
      ...item.dataValues,
      quantity: b.quantity,
      total: (b.quantity * item.price).toFixed(2),
    };
  });

  const wasEmptyBefore = detailedBasket.length === 1; // this is the first item added

  console.log(wasEmptyBefore);

  const response = {
    basket: detailedBasket,
    wasEmptyBefore,
  };

  if (changedItemId) {
    response.item = detailedBasket.find((i) => i.id == changedItemId);
  }

  res.status(200).json(response);
}


router.post("/checkout", async (req, res) => {
  const basket = req.session.basket;

  if (!basket || basket.length === 0) {
    return res.status(400).json({ message: "Basket is empty" });
  }

  try {
    // ✅ Robust user ID resolution
    let userId;

    if (req.isAuthenticated?.() && req.user?.id) {
      userId = req.user.id;
    } else {
      if (!req.session.guestUserId) {
        const guestUser = await userService.getOne(5);
        req.session.guestUserId = guestUser.id;
      }
      userId = req.session.guestUserId;
    }

    const pendingStatus = await statusService.getOneByName("pending");

    if (!pendingStatus) {
      return res
        .status(500)
        .json({ message: "Pending status not found in the database." });
    }

    const newOrder = await db.orders.create({
      userId,
      statusId: pendingStatus.id,
    });

    const orderItems = basket.map((item) => ({
      orderId: newOrder.id,
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    await db.order_items.bulkCreate(orderItems);

    req.session.basket = [];

    req.flash("success", `Order placed successfully.`);

    res.redirect(`/orders/${newOrder.id}`);
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
