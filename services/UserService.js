const { Op } = require("sequelize");
const { fn, col, literal, notIn } = require("sequelize");

class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.Order = db.orders;
    this.OrderItems = db.order_items;
    this.Item = db.items;
    this.User = db.users;
    this.UserItems = db.user_items;
    this.Category = db.categories;
    this.Status = db.statuses;
    this.Role = db.roles;
  }

  async create(firstName, lastName, email, salt, encryptedPassword, roleId) {
    console.log(firstName, lastName, email, salt, encryptedPassword, roleId);

    // Ensure the role exists in the roles table before creating a user
    let role = await this.Role.findOne({ where: { name: "customer" || 0 } });
    if (!role) {
      // You can decide how to handle missing role ID
      throw new Error("Role not found");
    }

    // Create user with the role's id (foreign key constraint is respected)
    return this.User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      encryptedPassword: encryptedPassword,
      salt: salt,
      roleId: role.id, // Link to the existing role (foreign key constraint)
    });
  }

  //Not testet func:
  async updatePassword(userId, salt, hashedPassword) {
    return this.User.update(
      { salt: salt, encryptedPassword: hashedPassword },
      { where: { id: userId } },
    );
  }

  async getAll() {
    return this.User.findAll({
      where: {},
      include: {
        model: this.Role,
        as: "role",
      },
    });
  }

  async getOne(userId) {
    return await this.User.findOne({
      where: { id: userId },
      include: {
        model: this.Role,
        as: "role",
      },
    });
  }

  async getOneByEmail(email) {
    return await this.User.findOne({
      where: { email: email },
      include: {
        model: this.Role,
        as: "role",
      },
    });
  }

  async deleteUser(userId) {
    return this.User.destroy({
      where: {
        id: userId,
        role: {
          [Op.not]: "Admin",
        },
      },
    });
  }

  async getFavorites(userId) {
    const favorites = await this.UserItems.findAll({
      where: { userId },
      include: [
        {
          model: this.Item, // assumes association is defined between UserItems and Item
          as: "item", // use 'as' only if you defined an alias in the association
        },
      ],
    });

    // Map to only return the full item details
    return favorites.map((fav) => fav.item);
  }

  async getTopFavoritedItems(limit = 6) {
    // First: fetch most favorited items
    const topFavorites = await this.UserItems.findAll({
      attributes: [
        "itemId",
        [this.client.fn("COUNT", this.client.col("itemId")), "count"],
      ],
      include: [
        {
          model: this.Item,
          as: "item",
        },
      ],
      group: ["itemId", "item.id"],
      order: [[this.client.literal("count"), "DESC"]],
      limit,
    });

    // Convert results to plain items
    let favoriteItems = topFavorites.map((fav) => {
      const item = fav.item.toJSON();
      item.isFavorite = false;
      return item;
    });

    // If not enough, fill with random items from various categories
    const missingCount = limit - favoriteItems.length;
    if (missingCount > 0) {
      const excludeIds = favoriteItems.map((item) => item.id);

      const fillerItems = await this.Item.findAll({
        where: {
          id: {
            [Op.notIn]: excludeIds,
          },
        },
        order: this.client.literal("RAND()"), // Random fallback
        limit: missingCount,
      });

      const fillerWithFlag = fillerItems.map((item) => {
        const plain = item.toJSON();
        plain.isFavorite = false;
        return plain;
      });

      favoriteItems = favoriteItems.concat(fillerWithFlag);
    }

    return favoriteItems;
  }

  // Add an item to a user's favorites
  async addFavorite(userId, itemId) {
    try {
      console.log(
        `DEBUG: Adding favorite for user ${userId} and item ${itemId}`,
      );

      // Validate user existence
      const user = await this.User.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      // Validate item existence
      const item = await this.Item.findOne({ where: { id: itemId } });
      if (!item) {
        throw new Error("Item not found");
      }

      // Create favorite entry
      const favorite = await this.UserItems.create({
        userId,
        itemId,
      });

      return favorite;
    } catch (error) {
      console.error(error);
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new Error("Item is already in favorites");
      }
      throw new Error("Error adding favorite: " + error.message);
    }
  }

  // Remove an item from a user's favorites
  // Remove an item from a user's favorites
  async deleteFavorite(userId, itemId) {
    try {
      console.log(
        `DEBUG: Deleting favorite for user ${userId} and item ${itemId}`,
      );

      // Validate user existence
      const user = await this.User.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }

      // Validate item existence
      const item = await this.Item.findOne({ where: { id: itemId } });
      if (!item) {
        throw new Error("Item not found");
      }

      // Try to find and delete the favorite
      const deletedCount = await this.UserItems.destroy({
        where: {
          userId,
          itemId,
        },
      });

      if (deletedCount === 0) {
        throw new Error("Favorite not found or already deleted");
      }

      console.log(`DEBUG: Successfully deleted favorite`);
      return true;
    } catch (error) {
      console.error("ERROR deleting favorite:", error);
      throw new Error("Error deleting favorite: " + error.message);
    }
  }
}

module.exports = UserService;
