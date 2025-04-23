class CategoryService {
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
  
  // Get all categories
  async getAll() {
    try {
      return await this.Category.findAll();
    } catch (error) {
      console.error(error)
      throw new Error('Error fetching categories');
    }
  }

  // Get one category by ID
  async getOne(id) {
    try {
      return await this.Category.findOne({ where: { id: id } });
    } catch (error) {
      console.error(error)
      throw new Error('Error fetching category');
    }
  }

  // Create a new category
  async create(categoryData) {
    try {
      return await this.Category.create(categoryData);
    } catch (error) {
      console.error(error)
      throw new Error('Error creating category');
    }
  }

  // Update a category by ID
  async update(id, categoryData) {
    try {
      const category = await this.Category.findOne({ where: { id: id } });
      if (!category) {
        throw new Error('Category not found');
      }
      return await category.update(categoryData);
    } catch (error) {
      console.error(error)
      throw new Error('Error updating category');
    }
  }

  // Delete a category by ID
  async delete(id) {
    try {
      const category = await this.Category.findOne({ where: { id: id } });
      if (!category) {
        throw new Error('Category not found');
      }
      await category.destroy();
      return category;
    } catch (error) {
      console.error(error)
      throw new Error('Error deleting category');
    }
  }
}

module.exports = CategoryService;
