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
var jsend = require('jsend');

router.use(jsend.middleware);

// Redirect root to all categories
router.get("/", (req, res) => res.redirect("/categories/all"));

// Get all categories
router.get("/all", async function (req, res, next) {
  try {
    const categories = await categoryService.getAll();
    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Categories retrieved successfully',
      categories: categories,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while fetching categories.',
    });
  }
});

// Get one category by ID
router.get("/:id", async function (req, res, next) {
  try {
    const category = await categoryService.getOne(req.params.id);
    if (!category) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Category not found',
      });
    }
    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Category retrieved successfully',
      category: category,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while fetching the category.',
    });
  }
});

// Create a new category
router.post("/create", jsonParser, async function (req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).jsend.error({
        status: 'error',
        message: 'Missing required field: name.',
      });
    }

    const newCategory = await categoryService.create({ name });

    res.status(201).jsend.success({
      statusCode: 201,
      result: 'OK: Category created successfully',
      category: newCategory,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while creating the category.',
    });
  }
});

// Update a category by ID
router.put("/update/:id", jsonParser, async function (req, res) {
  try {
    const { name } = req.body;
    const updatedCategory = await categoryService.update(req.params.id, { name });

    if (!updatedCategory) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Category not found or update failed.',
      });
    }

    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while updating the category.',
    });
  }
});

// Delete a category by ID
router.delete("/delete/:id", async function (req, res) {
  try {
    const deletedCategory = await categoryService.delete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).jsend.error({
        status: 'error',
        message: 'Category not found or delete failed.',
      });
    }

    res.status(200).jsend.success({
      statusCode: 200,
      result: 'OK: Category deleted successfully',
    });
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: 'Internal Server Error: Something went wrong while deleting the category.',
    });
  }
});

module.exports = router;
