const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { title } = require('process');

const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath);

// Initialize the database
async function init() {
  try {
    await createTables();
    await ensureAdminUserExists();
    await initGames();
    await initTickets();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Create necessary tables if they don't exist
async function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS carts (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS cart_items (
        cart_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cart_id) REFERENCES carts(cart_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS activities (
        activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        datetime TEXT NOT NULL,
        username TEXT NOT NULL,
        user_id INTEGER,
        type TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        game_date DATE,
        team_home TEXT,
        team_away TEXT,
        stadium_name TEXT,
        status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed'))
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS tickets (
        ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_date DATE,
        seat_number TEXT,
        stand TEXT(status IN ('north', 'south', 'east', 'west')),
        price FLOAT, 
        status TEXT CHECK(status IN ('available', 'sold')),
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(game_id) REFERENCES games(game_id)
      )`, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

// Ensure admin user exists
async function ensureAdminUserExists() {
  const adminUser = {
    username: 'admin',
    password_hash: '$2b$10$7B2kAI/3fX7KgX3XZTL5reJ56BObA5LB.n3b7F6fyQZ2pFhxS9Um6', // Pre-hashed password
  };

  const user = await findUserByUsername(adminUser.username);
  if (!user) {
    await saveUser(adminUser);
  }
}

// Initialize games from a predefined list
async function initGames() {
  const games = [
    { title: 'Israel vs Germany', game_date: '2024-08-20', team_home: 'Israel', away: 'Germany', stadium_name:'National Stadium' },
    { title: 'Israel vs France', game_date: '2024-09-10', team_home: 'Israel', away: 'France', stadium_name:'National Stadium' },

  ];

  for (const game of games) {
    await saveGame(game);
  }
  console.log('Games initialized:', games);
}

// Initialize tickets from a predefined list
async function initTickets() {
  // Implement logic to initialize tickets if necessary
  const tickets = [
    { seat_number: '1N', game_date: '2024-08-20', stand: 'north', price: '50', status:'available' },
    { seat_number: '1S', game_date: '2024-08-20', stand: 'south', price: '50', status:'available' },
    { seat_number: '1E', game_date: '2024-08-20', stand: 'east', price: '30', status:'available' },
    { seat_number: '1W', game_date: '2024-08-20', stand: 'west', price: '30', status:'available' },
    { seat_number: '1N', game_date: '2024-09-10', stand: 'north', price: '60', status:'available' },
    { seat_number: '1S', game_date: '2024-09-10', stand: 'south', price: '60', status:'available' },
    { seat_number: '1E', game_date: '2024-09-10', stand: 'east', price: '20', status:'available' },
    { seat_number: '1W', game_date: '2024-09-10', stand: 'west', price: '20', status:'available' },
  ]
  console.log('Tickets initialized');
}

// Save a new user to the database
async function saveUser(user) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
    db.run(query, [user.username, user.password_hash], function (err) {
    
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Get all users from the database
async function getUsers() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users`;
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Find a user by username
async function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Get cart items for a specific user
async function getCart(userId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = ?)`;
    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Save cart items for a specific user
async function saveCart(userId, cartItems) {
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await getCartByUserId(userId);
      const cartId = cart ? cart.cart_id : await createCart(userId);
      await clearCartItems(cartId);
      for (const item of cartItems) {
        await addCartItem(cartId, item);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Create a new cart for a user
async function createCart(userId) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO carts (user_id) VALUES (?)`;
    db.run(query, [userId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Get cart by user ID
async function getCartByUserId(userId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM carts WHERE user_id = ?`;
    db.get(query, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Clear cart items
async function clearCartItems(cartId) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM cart_items WHERE cart_id = ?`;
    db.run(query, [cartId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Add a cart item
async function addCartItem(cartId, item) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)`;
    db.run(query, [cartId, item.product_id, item.quantity], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Save a game to the database
async function saveGame(game) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO games (name, genre, release_date) VALUES (?, ?, ?)`;
    db.run(query, [game.title, game.genre, game.release_date], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Add an activity to the database
async function addActivity(activity) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO activities (activity_time, user_id, type) VALUES (?, ?, ?)`;
    console.log(activity.datetime)
    db.run(query, [activity.datetime, activity.user_id, activity.type], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Get all activities from the database
async function getActivities() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM activities ORDER BY datetime DESC`;
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function addGame(game) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO games (title, date, venue, teams, status) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [game.title, game.date, game.venue, game.teams, game.status], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...game });
      }
    });
  });
}

// Get all games from the database
async function getAllGames() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM games`;
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Add a product to the database
async function saveProduct(product) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)`;
    db.run(query, [product.name, product.description, product.price, product.stock], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// Get all products from the database
async function getProducts() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM products`;
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Search products in the database
async function searchProducts(query) {
  return new Promise((resolve, reject) => {
    const searchQuery = `%${query}%`;
    const sql = `SELECT * FROM products WHERE name LIKE ? OR description LIKE ?`;
    db.all(sql, [searchQuery, searchQuery], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Add a product to the user's cart
async function addToCart(username, productId) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  const userId = user.user_id;

  const cart = await getCartByUserId(userId);
  const cartId = cart ? cart.cart_id : await createCart(userId);

  const existingCartItem = await findCartItem(cartId, productId);
  if (existingCartItem) {
    await updateCartItemQuantity(existingCartItem.cart_item_id, existingCartItem.quantity + 1);
  } else {
    await addCartItem(cartId, { product_id: productId, quantity: 1 });
  }
}

// Find a cart item by cart ID and product ID
async function findCartItem(cartId, productId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?`;
    db.get(query, [cartId, productId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Update the quantity of a cart item
async function updateCartItemQuantity(cartItemId, quantity) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?`;
    db.run(query, [quantity, cartItemId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Get tickets for a specific game and stand
async function getTickets(gameId, stand) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM tickets WHERE game_id = ?`;
    const params = [gameId];

    if (stand) {
      query += ` AND stand = ?`;
      params.push(stand);
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Update ticket status to 'sold'
async function purchaseTickets(ticketIds) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE tickets SET status = 'sold' WHERE ticket_id IN (${ticketIds.map(() => '?').join(', ')}) AND status = 'available'`;
    db.run(query, ticketIds, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  init,
  saveUser,
  getUsers,
  findUserByUsername,
  getCart,
  saveCart,
  addActivity,
  getActivities,
  addGame,
  getAllGames,
  saveProduct,
  getProducts,
  searchProducts,
  addToCart,
  getTickets,
  purchaseTickets,
};

