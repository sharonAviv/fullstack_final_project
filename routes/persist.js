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
    console.log("tabels created")
    await ensureAdminUserExists();
    console.log("admin")
    await initGames();
    console.log("games")
    await initTickets();
    console.log("tickets")
    await initProducts();
    console.log("products")

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
        name TEXT,
        price REAL NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cart_id) REFERENCES carts(cart_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS activities (
        activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
        datetime TEXT NOT NULL,
        username TEXT NOT NULL,
        user_id INTEGER,
        type TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
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
        user_id INTEGER,
        game_id INTEGER,
        game_date DATE,
        seat_number TEXT,
        stand TEXT CHECK(stand IN ('north', 'south', 'east', 'west')),
        price FLOAT, 
        status TEXT CHECK(status IN ('available', 'sold')),
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(game_id) REFERENCES games(game_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS ticket_cart (
        ticket_id INTEGER,
        user_id INTEGER
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(ticket_id) REFERENCES tickets(ticket_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        images TEXT NOT NULL, -- Store images as a JSON string
        stock INTEGER NOT NULL
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


// // Retrieve game IDs
// async function getGameIds() {
//   return new Promise((resolve, reject) => {
//     const query = `SELECT game_id FROM games ORDER BY game_id`;
//     db.all(query, [], (err, rows) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(rows.map(row => row.game_id));
//       }
//     });
//   });
// }

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
    { title: 'Israel vs Germany', game_date: '2024-08-20', team_home: 'Israel', team_away: 'Germany', stadium_name:'National Stadium', status: 'scheduled' },
    { title: 'Israel vs France', game_date: '2024-09-10', team_home: 'Israel', team_away: 'France', stadium_name:'National Stadium', status: 'scheduled' },
  ];

  for (const game of games) {
    await saveGame(game);
  }
  console.log('Games initialized:', games);
}

// Initialize tickets from a predefined list
async function initTickets() {
  // Retrieve the game IDs
  const games = await getAllGames();

  if (games.length < 2) {
    console.error('Not enough games found to initialize tickets - Games init error');
    return;
  }

  const firstGameId = games[0].game_id;
  const secondGameId = games[1].game_id;

  // Implement logic to initialize tickets if necessary
  const tickets = [
    { seat_number: '1N', game_date: '2024-08-20', stand: 'north', price: '50', status:'available', game_id: firstGameId },
    { seat_number: '1S', game_date: '2024-08-20', stand: 'south', price: '50', status:'available', game_id: firstGameId },
    { seat_number: '1E', game_date: '2024-08-20', stand: 'east', price: '30', status:'available', game_id: firstGameId },
    { seat_number: '1W', game_date: '2024-08-20', stand: 'west', price: '30', status:'available', game_id: firstGameId },
    { seat_number: '1N', game_date: '2024-09-10', stand: 'north', price: '60', status:'available', game_id: secondGameId },
    { seat_number: '1S', game_date: '2024-09-10', stand: 'south', price: '60', status:'available', game_id: secondGameId },
    { seat_number: '1E', game_date: '2024-09-10', stand: 'east', price: '20', status:'available', game_id: secondGameId },
    { seat_number: '1W', game_date: '2024-09-10', stand: 'west', price: '20', status:'available', game_id: secondGameId },
  ]
  console.log('Tickets initialized');

  for (const ticket of tickets) {
    await saveTicket(ticket);
  }
}

async function initProducts() {
  return new Promise((resolve, reject) => {
    const products = [
      {
        id: "prod001",
        name: "Blue T-Shirt",
        description: "A comfortable blue t-shirt made from 100% cotton.",
        price: 19.99,
        images: JSON.stringify(["../icons/front_shirt_ISR.jpg", "../icons/rear_shirt_ISR.jpg"]),
        stock: 50
      },
      {
        id: "prod002",
        name: "White Sneakers",
        description: "Stylish white sneakers suitable for casual wear.",
        price: 49.99,
        images: JSON.stringify(["../icons/front_sneakers_ISR.jpg", "../icons/rear_sneakers_ISR.jpg"]),
        stock: 50
      }
    ];

    db.serialize(() => {
      const stmt = db.prepare(`INSERT INTO products (id, name, description, price, images, stock) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const product of products) {
        stmt.run(product.id, product.name, product.description, product.price, product.images, product.stock);
      }
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
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

async function findUserIDByUsername(username) {
  return new Promise((resolve, reject) => {
    const query = `SELECT user_id FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          resolve(row.user_id); // Resolve the user_id directly
        } else {
          reject(new Error('User not found'));
        }
      }
    });
  });
}

// Get cart items for a specific user
async function getCart(username) {
  const user_id = await findUserIDByUsername(username);
  console.log(user_id + "user id")
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = ?)`;
    db.all(query, [user_id], (err, rows) => {
      if (err) {
        console.error('Error executing query:', err);
        reject(err);
      } else {
        console.log('Query executed successfully, retrieved rows:', rows);
        resolve(rows);
      }
    });
  });
} 

// Get cart items for a specific user
async function getTicketCart(username) {
  const user_id = await findUserIDByUsername(username);
  console.log(user_id + "user id")
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ticket_cart WHERE user_id = ?`;
    db.all(query, [user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Save cart items for a specific user
async function saveCart(username, cartItems) {
  userId = await findUserIDByUsername(username);
  console.log(userId + " userid in save carts");
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await getCartByUserId(userId);
      const cartId = cart ? cart.cart_id : await createCart(userId);
      console.log(cartId + " cartid");
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

// Save ticket cart items for a specific user
async function saveTicketCart(userId, cartItems) {
  return new Promise(async (resolve, reject) => {
    try {
      await clearTicketCartItems(userId);
      for (const item of cartItems) {
        await addTicketCartItem(userId, item);
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

// Get cart by user ID
async function getTicketCartByUserId(userId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ticket_cart WHERE user_id = ?`;
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

// Clear ticket cart items
async function clearTicketCartItems(userId) {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM ticket_cart WHERE user_id = ?`;
    db.run(query, [userId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function getProductDetails(productId) {
  return new Promise((resolve, reject) => {
    console.log(productId + " prodid"); // Log the product ID being queried
    const query = `SELECT name, price FROM products WHERE id = ?`;
    db.get(query, [productId], (err, row) => {
      if (err) {
        console.error('Error fetching product details:', err); // Log any errors
        reject(err);
      } else {
        console.log('Fetched product details:', row); // Log the retrieved product details
        resolve(row);
      }
    });
  });
}

// Add a cart item
async function addCartItem(cartId, productDetails) {
  try {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO cart_items (cart_id, product_id, quantity, name, price) VALUES (?, ?, ?, ?, ?)`;
      db.run(query, [cartId, productDetails.product_id, productDetails.quantity, productDetails.name, productDetails.price], function (err) {
        if (err) {
          console.error('Error inserting cart item:', err); // Log any errors
          reject(err);
        } else {
          console.log('Inserted cart item with ID:', this.lastID); // Log the ID of the inserted item
          resolve(this.lastID);
        }
      });
    });
  } catch (error) {
    console.error('Error in addCartItem:', error); // Log any errors
    throw error;
  }
}

// Add a ticket to ticket cart
async function addTicketCartItem(userId, ticketId) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO ticket_cart (user_id, ticket_id) VALUES (?, ?)`;
    db.run(query, [userId, ticketId], function (err) {
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
    const query = `INSERT INTO games (title, game_date, team_home, team_away, stadium_name , status) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [game.title, game.game_date, game.team_home, game.team_away, game.stadium_name, game.status], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

async function addActivity(activity) {
  return new Promise((resolve, reject) => {
    console.log(activity)
    const userIdQuery = 'SELECT user_id FROM users WHERE username = ?';
    
    db.get(userIdQuery, [activity.username], (err, row) => {
      if (err) {
        reject(err);
      } else if (!row) {
        reject(new Error('User not found'));
      } else {
        const userId = row.user_id;
        const query = `INSERT INTO activities (datetime, username, user_id, type) VALUES (?, ?, ?, ?)`;
        
        db.run(query, [activity.datetime, activity.username, userId, activity.type], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
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

// Save a new ticket to the database
async function saveTicket(ticket) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO tickets (seat_number, game_date, stand, price, status, game_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [ticket.seat_number, ticket.game_date, ticket.stand, ticket.price, ticket.status, ticket.game_id, ticket.user_id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
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
  try {
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error('User not found');
    }
    const userId = user.user_id;
    const cart = await getCartByUserId(userId);
    const cartId = cart ? cart.cart_id : await createCart(userId);
    const existingCartItem = await findCartItem(cartId, productId);
    const productDetails = await getProductDetails(productId);
    if (!productDetails) {
      throw new Error('Product not found');
    }
    if (existingCartItem) {
      await updateCartItemQuantity(existingCartItem.product_id, existingCartItem.quantity + 1, productDetails.price);
    } else {
      await addCartItem(cartId, {
        product_id: productId,
        quantity: 1,
        name: productDetails.name,
        price: productDetails.price
      });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

// Add a product to the user's ticket cart
async function addToTicketCart(username, ticketId) {
  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }
  const userId = user.user_id;

  const cart = await getTicketCartByUserId(userId);

  const existingCartItem = await findTicketCartItem(userId, ticketId);
  if (existingCartItem) {
    // Return a message indicating the ticket is already in the cart
    return { success: false, message: 'Ticket already in cart' };
  } else {
    await addTicketCartItem(userId, ticketId);
    console.log('ticket added to cart, ticketId: ' + ticketId + ', userId: ' + userId);
    return { success: true, message: 'Ticket added to cart' };
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

// Find a cart item by cart ID and product ID
async function findTicketCartItem(userId, ticketId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ticket_cart WHERE user_id = ? AND ticket_id = ?`;
    db.get(query, [userId, ticketId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Update the quantity of a cart item
async function updateCartItemQuantity(productId, quantity, price) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE cart_items SET quantity = ?, price = ? WHERE product_id = ?`;
    db.run(query, [quantity, price * quantity, productId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Get tickets for a specific game and stand
async function getTicketsByGameStand(gameId, stand) {
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

async function getTicketsByTicketID(ticketId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM tickets WHERE ticket_id = ?`;
    db.all(query, [ticketId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function getTicketsByGameID(gameId) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM tickets WHERE game_id = ?`;
    db.all(query, [gameId], (err, rows) => {
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
  getTicketCart,
  saveCart,
  saveTicketCart,
  addActivity,
  getActivities,
  saveGame,
  getAllGames,
  saveProduct,
  getProducts,
  searchProducts,
  addToCart,
  addToTicketCart,
  getTicketsByGameStand,
  getTicketsByTicketID,
  getTicketsByGameID,
  purchaseTickets,
};

