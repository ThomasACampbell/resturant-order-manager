const { QueryTypes } = require('sequelize')

class StatusService {
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

  // Get all statuses
  async getAll() {
    try {
      console.log('DEBUG: Fetching all statuses')
      return await this.Status.findAll() // Returns all statuses
    } catch (error) {
      console.error('ERROR: Error fetching all statuses', error)
      throw new Error('Error fetching all statuses: ' + error.message)
    }
  }

  // Get all statuses by a list of IDs
  async getAllByIds(ids) {
    try {
      console.log('DEBUG: Fetching statuses by IDs', ids)
      return await this.Status.findAll({
        where: {
          id: ids, // Match the IDs provided in the array
        },
      })
    } catch (error) {
      console.error('ERROR: Error fetching statuses by IDs', error)
      throw new Error('Error fetching statuses by IDs: ' + error.message)
    }
  }

  // Get a specific status by ID
  async getOne(id) {
    try {
      console.log('DEBUG: Fetching status by ID', id)
      const status = await this.Status.findOne({
        where: { id }, // Find the status with the provided ID
      })
      if (!status) {
        throw new Error('Status not found')
      }
      return status
    } catch (error) {
      console.error('ERROR: Error fetching status by ID', error)
      throw new Error('Error fetching status by ID: ' + error.message)
    }
  }

  // Get a specific status by serviceName (name)
  async getOneByName(serviceName) {
    try {
      console.log('DEBUG: Fetching status by serviceName', serviceName)
      const status = await this.Status.findOne({
        where: { name: serviceName }, // Find the status with the provided name
      })
      if (!status) {
        throw new Error('Status not found')
      }
      return status
    } catch (error) {
      console.error('ERROR: Error fetching status by serviceName', error)
      throw new Error('Error fetching status by serviceName: ' + error.message)
    }
  }
}

module.exports = StatusService
