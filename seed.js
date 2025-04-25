const db = require('./models');
const hashPassword = require('./utils/hashPassword');

// Wrap your callback-based hashPassword function into a promise
const hashPasswordAsync = (password) => {
  return new Promise((resolve, reject) => {
    hashPassword(password, (err, result) => {
      if (err) return reject(err);
      resolve(result); // result = { salt, hashedPassword }
    });
  });
};

const getRandomItems = (items, count = 2) => {
  const shuffled = items.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await db.order_items.destroy({ where: {} });
    await db.orders.destroy({ where: {} });
    await db.user_items.destroy({ where: {} }); // Clear favorites table
    await db.items.destroy({ where: {} });
    await db.categories.destroy({ where: {} });
    await db.users.destroy({ where: {} });
    await db.roles.destroy({ where: {} });
    await db.statuses.destroy({ where: {} });

    // Seed roles
    const roles = await db.roles.bulkCreate([
      { name: 'guest' },
      { name: 'customer' },
      { name: 'staff' },
      { name: 'admin' },
    ]);

    // Seed statuses
    const statuses = await db.statuses.bulkCreate([
      { name: 'pending' },
      { name: 'ongoing' },
      { name: 'ready' },
      { name: 'completed' },
      { name: 'canceled' },
    ]);

    // Seed users
    const plainPassword = 'password123';
    const { salt, hashedPassword } = await hashPasswordAsync(plainPassword);
    const users = await db.users.bulkCreate([
      {
        firstName: 'Default',
        lastName: 'Guest',
        email: 'guest@vividrem.com',
        encryptedPassword: hashedPassword,
        salt,
        roleId: roles.find((r) => r.name === 'guest').id,
      },
      {
        firstName: 'Toshi',
        lastName: 'Augustus',
        email: 'admin@vividrem.com',
        encryptedPassword: hashedPassword,
        salt,
        roleId: roles.find((r) => r.name === 'admin').id,
      },
      {
        firstName: 'Ritka',
        lastName: 'Amelili',
        email: 'staff@vividrem.com',
        encryptedPassword: hashedPassword,
        salt,
        roleId: roles.find((r) => r.name === 'staff').id,
      },
      {
        firstName: 'Thili',
        lastName: 'Octo',
        email: 'customer@vividrem.com',
        encryptedPassword: hashedPassword,
        salt,
        roleId: roles.find((r) => r.name === 'customer').id,
      },
    ]);

    // Seed categories
    const categories = await db.categories.bulkCreate([
      { name: 'Appetizers' },
      { name: 'Main Courses' },
      { name: 'Burgers' },
      { name: 'Pasta' },
      { name: 'Pizza' },
      { name: 'Salads' },
      { name: 'Desserts' },
      { name: 'Drinks' },
    ]);

    // Seed items
    const menuItems = await db.items.bulkCreate([
      {
        name: 'Garlic Bread',
        description: 'Garlicky',
        price: 349,
        imageUrl: 'https://ordering.egon.no/media/jvgnx0nk/101-amerikansk-frokost.jpg?height=441&width=360',
        categoryId: categories[0].id,
      },
      {
        name: 'Tortilla Chips',
        description: 'Crunchy',
        price: 799,
        imageUrl: 'https://ordering.egon.no/media/r4rnc4d1/104-bourbonglazed-kyllingburger.jpg?height=441&width=360',
        categoryId: categories[0].id,
      },
      {
        name: 'Grilled Pork',
        description: 'Juicy pork',
        price: 330,
        imageUrl: 'https://ordering.egon.no/media/czhgnr5y/105-avokadosandwich-med-egg.jpg?height=441&width=360',
        categoryId: categories[1].id,
      },
      {
        name: 'Chicken Confit',
        description: 'Fancy chicken',
        price: 264,
        imageUrl: 'https://ordering.egon.no/media/42chspxx/650-kylling-blt-salat.jpg?height=441&width=360',
        categoryId: categories[1].id,
      },
      {
        name: 'Chickenparty',
        description: 'Cluck yeah',
        price: 310,
        imageUrl: 'https://ordering.egon.no/media/invhcs3c/652-lun-chevresalat.jpg?height=441&width=360',
        categoryId: categories[2].id,
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based',
        price: 299,
        imageUrl: 'https://ordering.egon.no/media/v5snlw3p/653-pastasalat-med-grillet-kylling-og-mozarella.jpg?height=441&width=360',
        categoryId: categories[2].id,
      },
      {
        name: 'Spaghetti',
        description: 'Classic bolognese',
        price: 149,
        imageUrl: 'https://ordering.egon.no/media/4rqbsu0m/600-ultimateburger.jpg?height=441&width=360',
        categoryId: categories[3].id,
      },
      {
        name: 'Fettuccine',
        description: 'Creamy Alfredo',
        price: 999,
        imageUrl: 'https://ordering.egon.no/media/0f3b3pqi/601-egonburger.jpg?height=441&width=360',
        categoryId: categories[3].id,
      },
    ]);

    // Seed favorites for each user
    for (const user of users) {
      const favoriteItems = getRandomItems(menuItems, 2); // Each user gets 2 random favorite items
      const favorites = favoriteItems.map((item) => ({
        userId: user.id,
        itemId: item.id,
      }));
      await db.user_items.bulkCreate(favorites);
    }

    // Create multiple orders for each customer user
    for (const user of users) {
      for (let i = 0; i < 3; i++) {
        const status = statuses[0];
        const order = await db.orders.create({
          userId: user.id,
          statusId: status.id,
        });

        const selectedItems = getRandomItems(menuItems, 3);
        const orderItems = selectedItems.map((item) => ({
          orderId: order.id,
          itemId: item.id,
          quantity: 3,
        }));

        await db.order_items.bulkCreate(orderItems);
      }
    }

    console.log('✅ Database seeded with multiple orders and favorites per user');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

seedDatabase();