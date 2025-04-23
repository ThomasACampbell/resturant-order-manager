var express = require('express');
var router = express.Router();
var db = require("../models");
var ItemService = require('../services/ItemService')
var itemService = new ItemService(db)

var OrderService = require('../services/OrderService')
var orderService = new OrderService(db)

var CategoryService = require('../services/CategoryService')
var categoryService = new CategoryService(db)


router.get("/", (req, res) => res.redirect("/menu"));

module.exports = router;
