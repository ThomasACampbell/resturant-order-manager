const { QueryTypes } = require('sequelize')
const { fn, col } = require('sequelize')

class ItemService {
  constructor(db) {
    this.client = db.sequelize
    this.Order = db.orders
    this.OrderItems = db.order_items
    this.Item = db.items
    this.User = db.users
    this.UserItems = db.user_items
    this.Category = db.categories
    this.Status = db.statuses
    this.Role = db.roles
  }
  
  // Get all items
  async getAll() {
    try {
      console.log('DEBUG: Fetching all Items')
      return await this.Item.findAll()
    } catch (error) {
      console.error(error)
      throw new Error('Error fetching items: ' + error.message)
    }
  }

  // Get all items by their IDs (plural)
  async getAllByIds(ids) {
    try {
      console.log('DEBUG: Fetching Items by IDs', ids)

      // Find items where the ID is in the provided list of IDs
      return await this.Item.findAll({
        where: {
          id: ids, // Match the items with the given IDs
        },
      })
    } catch (error) {
      console.error('ERROR: Error fetching items by IDs', error)
      throw new Error('Error fetching items by IDs: ' + error.message)
    }
  }

  // Get one item by ID
  async getOne(id) {
    try {
      console.log(`DEBUG: Fetching item with id: ${id}`)
      return await this.Item.findOne({
        where: { id: id },
      })
    } catch (error) {
      console.error(error)
      throw new Error('Error fetching item by ID: ' + error.message)
    }
  }

  async getByCategoryId(categoryId) {
    return await this.Item.findAll({
      where: { categoryId },
      order: [['name', 'ASC']],
    })
  }


  //Not working correcly. 
  async getTopSellings(limit = 10) {
    return await this.OrderItems.findAll({
      attributes: [
        'itemId',
        [this.client.fn('SUM', this.client.col('quantity')), 'totalSold'],
      ],
      include: [
        {
          model: this.Item,
          as: 'item', // Use the correct alias from your association
          attributes: ['name', 'imageUrl'],
          required: true, // Ensures valid join (no nulls)
        },
      ],
      group: ['itemId', 'item.id'], // Ensure 'item.id' is correctly grouped with alias
      order: [[this.client.fn('SUM', this.client.col('quantity')), 'DESC']],
      limit, // Limit to the top X items
    });
  }
  

  // Create a new item
  async create(itemData) {
    console.log(`DEBUG: Creating item with data: ${itemData}`)
    try {
      return await this.Item.create(itemData)
    } catch (error) {
      console.error(error)
      throw new Error('Error creating item: ' + error.message)
    }
  }

  // Update an item by ID
  async update(id, itemData) {
    try {
      console.log(
        `DEBUG: Updating item with id: ${id}, using data: ${itemData}`
      )
      const item = await this.Item.findOne({
        where: { id: id },
      })

      if (!item) {
        return null // Item not found
      }

      // Update the item
      return await item.update(itemData)
    } catch (error) {
      console.error(error)
      throw new Error('Error updating item: ' + error.message)
    }
  }

  // Delete an item by ID
  async delete(id) {
    try {
      console.log(`DEBUG: Deleting item with id: ${id}`)
      const item = await this.Item.findOne({
        where: { id: id },
      })

      if (!item) {
        return null // Item not found
      }

      // Delete the item
      await item.destroy()
      return item
    } catch (error) {
      console.error(error)
      throw new Error('Error deleting item: ' + error.message)
    }
  }
}

module.exports = ItemService
