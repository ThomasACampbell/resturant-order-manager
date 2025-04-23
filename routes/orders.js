var express = require('express')
var router = express.Router()
var db = require('../models')
var ItemService = require('../services/ItemService')
var itemService = new ItemService(db)

var OrderService = require('../services/OrderService')
var orderService = new OrderService(db)

var StatusService = require('../services/StatusService')
var statusService = new StatusService(db)

var CategoryService = require('../services/CategoryService')
var categoryService = new CategoryService(db)
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var jsend = require('jsend')

var { isAuthenticated, hasAnyRole, hasRole } = require('./authMiddlewares')

router.use(jsend.middleware)

router.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

// Redirect root to all orders

// Get all orders
// routes/orders.js

router.get('/', isAuthenticated, async function (req, res, next) {
  try {
    const { status, today } = req.query;

    const onlyToday = today === 'on'; // Checkbox returns 'on' if checked
    const statusName = status !== 'all' ? status : null;

    let orders;
    if (req.user.role === 'admin') {
      orders = await orderService.getFiltered({ statusName, onlyToday });
    } else {
      orders = await orderService.getFiltered({ statusName, onlyToday, userId: req.user.id });
    }

    const statuses = await statusService.getAll();

    return res.render('orders', {
      title: `${req.user.firstName}'s orders`,
      orders,
      statuses,
      selectedStatus: status || 'all',
      onlyToday: today === 'on', // <-- must include this too
    });
  } catch (error) {
    console.error('ERROR: Failed to filter orders', error);
    res.status(500).jsend.error({
      message: 'Internal Server Error: Failed to apply filters.',
    });
  }
});


//get one
router.get('/:id', jsonParser, async function (req, res) {
  try {
    const order = await orderService.getOne(req.params.id)
    res.render('order', { order, title: `Order #${order.id}` })
  } catch (error) {
    console.error('ERROR: Error retrieving order', error)

    // Respond with JSON error regardless of client type
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Failed to fetch order.',
    })
  }
})


// Create a new order
router.post('/create', isAuthenticated, jsonParser, async function (req, res) {
  try {
    const { order_items_Ids } = req.body

    if (!order_items_Ids || order_items_Ids.length === 0) {
      return res.status(400).jsend.error({
        status: 'error',
        message: 'Order must contain at least one item.',
      })
    }

    const userId = req.user.id;

    const newOrder = await orderService.create({
      userId,
      itemIds: order_items_Ids,
    })

    res.status(201).jsend.success({
      statusCode: 201,
      result: 'OK: Order created successfully',
      order: newOrder,
    })
  } catch (error) {
    console.error('ERROR: Error creating order', error)
    res.status(500).jsend.error({
      status: 'error',
      message:
        'Internal Server Error: Something went wrong while creating the order.',
    })
  }
})

router.put('/update/:id', isAuthenticated, jsonParser, async function (req, res) {
  console.log('📩 PUT /orders/update/:id HIT');

  try {
    const orderId = req.params.id;
    const { status, step } = req.body; // Accepts either 'status' or 'step'

    const order = await orderService.getOne(orderId);
    if (!order) {
      console.warn('⚠️ Order not found for ID:', orderId);
      return res.status(404).send('Order not found');
    }

    const statuses = await statusService.getAll(); // Assumes sorted by progression
    const currentStatusIndex = statuses.findIndex(s => s.name === order.status.name);

    if (currentStatusIndex === -1) {
      console.error('🚫 Current status not found in DB:', order.status.name);
      return res.status(500).send('Current status not recognized');
    }

    let newStatus;

    // 👉 Handle step-based progression
    if (typeof step !== 'undefined') {
      const stepInt = parseInt(step);
      if (isNaN(stepInt)) {
        return res.status(400).send('Invalid step value');
      }

      let newIndex = currentStatusIndex + stepInt;

      // Clamp to bounds
      newIndex = Math.max(0, Math.min(newIndex, statuses.length - 1));
      newStatus = statuses[newIndex].name;
    }

    // 👉 Handle direct status change
    else if (typeof status === 'string') {
      const isValidStatus = statuses.some(s => s.name === status);
      if (!isValidStatus) {
        return res.status(400).send('Invalid status provided');
      }
      newStatus = status;
    } else {
      return res.status(400).send('Missing status or step');
    }

    // ✅ No need to update if status is unchanged
    if (order.status.name === newStatus) {
      return res.status(200).send('Status unchanged');
    }

    // ❌ Don't allow canceling orders not in 'pending'
    if (newStatus === 'canceled' && order.status.name !== 'pending') {
      return res.status(400).send("Cannot cancel this order because it's in progress");
    }

    await orderService.updateStatus(orderId, newStatus);

    console.log(`✅ Order #${order.id} status updated from ${order.status.name} ➡️ ${newStatus}`);
    res.status(200).json({ message: 'Order status updated', newStatus });

  } catch (err) {
    console.error('🔥 Error updating order status:', err);
    res.status(500).send('Internal Server Error');
  }
});




// Delete an order by ID
router.delete('/delete/:id', async function (req, res) {
  try {
    const deletedOrder = await orderService.delete(req.params.id)

    if (!deletedOrder) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Order not found or delete failed.',
      })
    }

    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Order deleted successfully',
    })
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message:
        'Internal Server Error: Something went wrong while deleting the order.',
    })
  }
})

module.exports = router
