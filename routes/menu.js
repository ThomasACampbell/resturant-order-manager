var express = require('express')
var router = express.Router()
var db = require('../models')
var ItemService = require('../services/ItemService')
var itemService = new ItemService(db)

const UserService = require('../services/UserService')
const userService = new UserService(db);

var OrderService = require('../services/OrderService')
var orderService = new OrderService(db)

var CategoryService = require('../services/CategoryService')
var categoryService = new CategoryService(db)
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var jwt = require('jsonwebtoken')
var jsend = require('jsend')


router.use(jsend.middleware)

// Handle GET request to load the menu page
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id; // Safe check if user is logged in
    let favoriteIds = [];

    if (userId) {
      const favorites = await userService.getFavorites(userId);
      favoriteIds = favorites.map(fav => fav.id); // extract item.id from each favorite
    }

    const categories = await categoryService.getAll({
      order: [['name', 'ASC']],
    });

    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const items = await itemService.getByCategoryId(category.id);

        // Inject isFavorite into each item
        const enrichedItems = items.map((item) => {
          const plainItem = item.toJSON();
          plainItem.isFavorite = favoriteIds.includes(item.id);
          return plainItem;
        });

        return {
          ...category.toJSON(),
          items: enrichedItems,
        };
      })
    );

    // Fetch top-selling items
    const topItems = await itemService.getTopSellings();

    // Fetch the basket from the session
    const basket = req.session.basket || [];

    // Fetch the detailed basket items with quantity and total price
    const itemIds = basket.map(b => b.itemId);
    const dbItems = await itemService.getAllByIds(itemIds);

    const detailedBasket = basket.map(b => {
      const item = dbItems.find(i => i.id === b.itemId);
      return {
        ...item.dataValues,
        quantity: b.quantity,
        total: (b.quantity * item.price).toFixed(2),
      };
    });

    res.render('menu', {
      title: 'Menu',
      categories: enrichedCategories,
      topItems: topItems,
      basket: detailedBasket, // Pass the basket data to the view
    });
  } catch (err) {
    console.error('ERROR: Failed to load menu', err);
    res.status(500).send('Error loading menu');
  }
});



module.exports = router
