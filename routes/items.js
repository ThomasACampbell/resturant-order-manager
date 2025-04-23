var express = require("express");
var router = express.Router();
var db = require("../models");
var ItemService = require('../services/ItemService')
var itemService = new ItemService(db)

var OrderService = require('../services/OrderService')
var orderService = new OrderService(db)

var CategoryService = require('../services/CategoryService')
var categoryService = new CategoryService(db)
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var jwt = require('jsonwebtoken');
var jsend = require('jsend');

router.use(jsend.middleware);

// Get all items
router.get("/", async function (req, res, next) {
  try {
    const items = await itemService.getAll();
    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Items retrieved successfully',
      items: items,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while fetching items.',
    });
  }
});

// Get one item by ID
router.get("/:id", async function (req, res, next) {
  try {
    const item = await itemService.getOne(req.params.id);
    if (!item) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Item not found',
      });
    }

    res.render('item', {item: item, title: `${item.name}` })

  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while fetching the item.',
    });
  }
});

// Create a new item
router.post("/create", jsonParser, async function (req, res) {
  try {
    const { name, description, price, imageUrl, categoryId } = req.body;

    if (!name || !price || !categoryId || !imageUrl) {
      return res.status(400).jsend.error({
        status: 'error',
        message: 'Missing required fields: name, price, imageUrl and categoryId.',
      });
    }

    const newItem = await itemService.create({
      name,
      description,
      price,
      imageUrl,
      categoryId,
    });

    res.status(201).jsend.success({
      statusCode: 201,
      result: 'OK: Item created successfully',
      item: newItem,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while creating the item.',
    });
  }
});

// Update an item by ID
router.put("/update/:id", jsonParser, async function (req, res) {
  try {
    const { name, description, price, imageUrl, categoryId } = req.body;
    const updatedItem = await itemService.update(req.params.id, {
      name,
      description,
      price,
      imageUrl,
      categoryId,
    });

    if (!updatedItem) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Item not found or update failed.',
      });
    }

    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while updating the item.',
    });
  }
});

// Delete an item by ID
router.delete("/delete/:id", async function (req, res) {
  try {
    const deletedItem = await itemService.delete(req.params.id);

    if (!deletedItem) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Item not found or delete failed.',
      });
    }

    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Item deleted successfully',
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while deleting the item.',
    });
  }
});

module.exports = router;
