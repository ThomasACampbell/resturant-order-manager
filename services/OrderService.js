const { Op } = require('sequelize');

class OrderService {
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

  // Get all orders
  async getAllByUserId(userId) {
    try {
      console.log('DEBUG: Fetching all orders with related info')

      const orders = await this.Order.findAll({
        where: { userId: userId },
        include: [
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [
              {
                model: this.Role,
                as: 'role',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            model: this.Status,
            as: 'status',
            attributes: ['id', 'name'],
          },
          {
            model: this.OrderItems,
            as: 'order_items',
            attributes: ['id', 'orderId', 'itemId', 'quantity'],
            include: [
              {
                model: this.Item,
                as: 'item',
                attributes: ['id', 'name', 'description', 'price', 'imageUrl'],
                include: [
                  {
                    model: this.Category,
                    as: 'category',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        attributes: ['id', 'userId', 'statusId', 'createdAt', 'updatedAt'],
      })

      console.log('DEBUG: Orders retrieved successfully')
      return orders
    } catch (error) {
      console.error('ERROR: Error fetching orders', error)
      throw new Error('Error retrieving orders')
    }
  }

  async getFiltered({ statusName, onlyToday = false, userId = null }) {
    try {
      const whereClause = {}

      // If filtering by user
      if (userId) {
        whereClause.userId = userId
      }

      // If filtering by today
      if (onlyToday) {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)
        whereClause.createdAt = { [Op.between]: [startOfDay, endOfDay] }
      }

      // Resolve status ID if provided
      if (statusName) {
        const status = await this.Status.findOne({
          where: { name: statusName },
        })
        if (status) {
          whereClause.statusId = status.id
        }
      }

      const orders = await this.Order.findAll({
        where: whereClause,
        include: [
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [
              { model: this.Role, as: 'role', attributes: ['id', 'name'] },
            ],
          },
          {
            model: this.Status,
            as: 'status',
            attributes: ['id', 'name'],
          },
          {
            model: this.OrderItems,
            as: 'order_items',
            attributes: ['id', 'orderId', 'itemId', 'quantity'],
            include: [
              {
                model: this.Item,
                as: 'item',
                attributes: ['id', 'name', 'price', 'imageUrl'],
                include: [
                  {
                    model: this.Category,
                    as: 'category',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        attributes: ['id', 'userId', 'statusId', 'createdAt', 'updatedAt'],
      })

      return orders
    } catch (error) {
      console.error('ERROR: Failed to fetch filtered orders', error)
      throw new Error('Error retrieving filtered orders')
    }
  }

  async getAll() {
    try {
      console.log('DEBUG: Fetching all orders with related info')

      const orders = await this.Order.findAll({
        where: {},
        include: [
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [
              {
                model: this.Role,
                as: 'role',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            model: this.Status,
            as: 'status',
            attributes: ['id', 'name'],
          },
          {
            model: this.OrderItems,
            as: 'order_items',
            attributes: ['id', 'orderId', 'itemId', 'quantity'],
            include: [
              {
                model: this.Item,
                as: 'item',
                attributes: ['id', 'name', 'description', 'price', 'imageUrl'],
                include: [
                  {
                    model: this.Category,
                    as: 'category',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        attributes: ['id', 'userId', 'statusId', 'createdAt', 'updatedAt'],
      })

      console.log('DEBUG: Orders retrieved successfully')
      return orders
    } catch (error) {
      console.error('ERROR: Error fetching orders', error)
      throw new Error('Error retrieving orders')
    }
  }

  // Get one order by ID
  async getOne(orderId, userId) {
    try {
      const order = await this.Order.findByPk(orderId, {
        where: { userId },
        include: [
          {
            model: this.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [
              {
                model: this.Role,
                as: 'role',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            model: this.Status,
            as: 'status',
            attributes: ['id', 'name'],
          },
          {
            model: this.OrderItems,
            as: 'order_items',
            attributes: ['id', 'orderId', 'itemId', 'quantity'],
            include: [
              {
                model: this.Item,
                as: 'item',
                attributes: ['id', 'name', 'description', 'price', 'imageUrl'],
                include: [
                  {
                    model: this.Category,
                    as: 'category',
                    attributes: ['id', 'name'],
                  },
                ],
              },
            ],
          },
        ],
        attributes: ['id', 'userId', 'statusId', 'createdAt', 'updatedAt'],
      })

      if (!order) {
        throw new Error('Order not found')
      }

      return order
    } catch (error) {
      console.error('ERROR: Error fetching single order', error)
      throw new Error('Error retrieving order')
    }
  }

  // Create a new order
  async create({ userId, itemIds }) {
    const t = await this.Order.sequelize.transaction()
    try {
      if (!itemIds || itemIds.length === 0) {
        throw new Error('No items provided')
      }

      const pendingStatus = await this.Status.findOne({
        where: { name: 'pending' },
      })

      if (!pendingStatus) {
        throw new Error('Status "pending" not found in database')
      }

      const newOrder = await this.Order.create(
        {
          userId,
          statusId: pendingStatus.id,
        },
        { transaction: t }
      )

      const orderItems = itemIds.map((itemId) => ({
        orderId: newOrder.id,
        itemId,
        quantity: 1, // You can change this later
      }))

      await this.OrderItems.bulkCreate(orderItems, { transaction: t })

      await t.commit()

      return await this.getOne(newOrder.id)
    } catch (error) {
      await t.rollback()
      console.error('ERROR: Failed to create order', error)
      throw new Error('Error creating order')
    }
  }

  //This isnt tested so well.
  async update(orderId, { status, userId, items }) {
    const t = await this.Order.sequelize.transaction()
    try {
      // Find the order
      const order = await this.Order.findOne({ where: { id: orderId } })

      if (!order) {
        throw new Error('Order not found')
      }

      // Update status if provided
      if (status) {
        const statusRecord = await this.Status.findOne({
          where: { name: status },
        })
        if (!statusRecord) {
          throw new Error(`Status "${status}" not found`)
        }
        order.statusId = statusRecord.id
      }

      // Update userId if provided
      if (userId) {
        order.userId = userId
      }

      await order.save({ transaction: t })

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Split itemIds into additions and removals (if you want to support negatives)
        const toRemove = items.filter((id) => id < 0).map((id) => Math.abs(id))
        const toAdd = items.filter((id) => id > 0)

        if (toRemove.length > 0) {
          await this.OrderItems.destroy({
            where: {
              orderId,
              itemId: toRemove,
            },
            transaction: t,
          })
        }

        if (toAdd.length > 0) {
          const newItems = toAdd.map((itemId) => ({
            orderId,
            itemId,
            quantity: 1,
          }))
          await this.OrderItems.bulkCreate(newItems, { transaction: t })
        }
      }

      await t.commit()
      return await this.getOne(orderId)
    } catch (error) {
      await t.rollback()
      console.error('ERROR: Failed to update order', error)
      throw new Error('Error updating order')
    }
  }

  async updateStatus(orderId, newStatusName) {
    try {
      // Find the new status by name
      const status = await this.Status.findOne({
        where: { name: newStatusName },
      })
      if (!status) {
        throw new Error(`Status "${newStatusName}" not found`)
      }

      // Update the order's statusId
      const [updatedCount] = await this.Order.update(
        { statusId: status.id },
        { where: { id: orderId } }
      )

      if (updatedCount === 0) {
        throw new Error(`Order with ID ${orderId} not found`)
      }

      // Return the updated order (optional)
      return await this.getOne(orderId)
    } catch (error) {
      console.error('ERROR: Failed to update order status', error)
      throw new Error('Error updating order status: ' + error.message)
    }
  }

  // Delete an order by ID
  async delete(orderId) {
    try {
      const order = await this.Order.findByPk(orderId)
      if (!order) {
        throw new Error('Order not found')
      }

      await order.destroy()
      return { message: 'Order deleted' }
    } catch (error) {
      console.error('ERROR: Failed to delete order', error)
      throw new Error('Error deleting order')
    }
  }
}

module.exports = OrderService
