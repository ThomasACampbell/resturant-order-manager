var DataTypes = require("sequelize").DataTypes;
var _categories = require("./categories");
var _items = require("./items");
var _order_items = require("./order_items");
var _orders = require("./orders");
var _roles = require("./roles");
var _statuses = require("./statuses");
var _user_items = require("./user_items");
var _users = require("./users");

function initModels(sequelize) {
  var categories = _categories(sequelize, DataTypes);
  var items = _items(sequelize, DataTypes);
  var order_items = _order_items(sequelize, DataTypes);
  var orders = _orders(sequelize, DataTypes);
  var roles = _roles(sequelize, DataTypes);
  var statuses = _statuses(sequelize, DataTypes);
  var user_items = _user_items(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  items.belongsTo(categories, { as: "category", foreignKey: "categoryId"});
  categories.hasMany(items, { as: "items", foreignKey: "categoryId"});
  order_items.belongsTo(items, { as: "item", foreignKey: "itemId"});
  items.hasMany(order_items, { as: "order_items", foreignKey: "itemId"});
  user_items.belongsTo(items, { as: "item", foreignKey: "itemId"});
  items.hasMany(user_items, { as: "user_items", foreignKey: "itemId"});
  order_items.belongsTo(orders, { as: "order", foreignKey: "orderId"});
  orders.hasMany(order_items, { as: "order_items", foreignKey: "orderId"});
  users.belongsTo(roles, { as: "role", foreignKey: "roleId"});
  roles.hasMany(users, { as: "users", foreignKey: "roleId"});
  orders.belongsTo(statuses, { as: "status", foreignKey: "statusId"});
  statuses.hasMany(orders, { as: "orders", foreignKey: "statusId"});
  orders.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(orders, { as: "orders", foreignKey: "userId"});
  user_items.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(user_items, { as: "user_items", foreignKey: "userId"});

  return {
    categories,
    items,
    order_items,
    orders,
    roles,
    statuses,
    user_items,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
