require("dotenv").config(); // Load environment variables from .env
const { Sequelize } = require("sequelize");
const initModels = require("./init-models"); // Import init-models.js

const connection = {
  dialect: process.env.DIALECT,
  dialectModel: process.env.DIALECTMODEL,
  database: process.env.DATABASE_NAME,
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  host: process.env.HOST,
};

//connect to db
const sequelize = new Sequelize(connection);

const db = initModels(sequelize);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

testConnection();

module.exports = { sequelize, ...db };
