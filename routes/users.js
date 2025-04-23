var express = require('express')
var router = express.Router()
var jsend = require('jsend')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

var db = require('../models')

var UserService = require('../services/UserService')
var userService = new UserService(db)

var ItemService = require('../services/ItemService')
var itemService = new ItemService(db)

var OrderService = require('../services/OrderService')
var orderService = new OrderService(db)

var CategoryService = require('../services/CategoryService')
const { isAuthenticated } = require('./authMiddlewares')
var categoryService = new CategoryService(db)

router.use(jsend.middleware)

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.status(200).jsend.success({
    statusCode: 200,
    result: 'OK: Users endpoint',
    message: 'Respond with a resource',
  })
})

// Get all favorite items for the logged-in user
router.get('/favorites', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    let favorites = await userService.getFavorites(userId);

    if (favorites.length > 0) {
      favorites = favorites.map((item) => {
        const plainItem = item.toJSON();
        plainItem.isFavorite = true;
        return plainItem;
      });
    } else {
      // Fallback: Get top 3 favorites across all users
      favorites = await userService.getTopFavoritedItems(3);
    }

    res.render('favorites', {
      title: 'Your Favorites',
      favorites,
      isFallback: favorites.length > 0 && !favorites.some((f) => f.isFavorite),
    });
    
  } catch (error) {
    console.error('Failed to load favorites', error);
    res.status(500).send('Error loading favorites');
  }
});


// Add a favorite item for the user
router.post('/favorites', isAuthenticated, jsonParser, async (req, res) => {
  try {
    const { itemId } = req.body


    if (!itemId) {
      return res.status(400).jsend.error({
        status: 'error',
        message: 'Missing required field: itemId',
      })
    }

    const favorite = await userService.addFavorite(req.user.id, itemId)

    res.status(201).jsend.success({
      statusCode: 201,
      result: 'OK: Item added to favorites',
      favorite,
    })
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: error.message || 'Internal Server Error: Failed to add favorite',
    })
  }
})

// Remove a favorite item for the user
router.delete('/favorites', isAuthenticated, jsonParser, async (req, res) => {
  try {
    const { itemId } = req.body


    if (!itemId) {
      return res.status(400).jsend.error({
        status: 'error',
        message: 'Missing required field: itemId',
      })
    }

    const favorite = await userService.deleteFavorite(req.user.id, itemId)

    res.status(201).jsend.success({
      statusCode: 201,
      result: 'OK: Item deleted from favorites',
      favorite,
    })
  } catch (error) {
    res.status(500).jsend.error({
      status: 'error',
      message: error.message || 'Internal Server Error: Failed to delete favorite',
    })
  }
})

module.exports = router
