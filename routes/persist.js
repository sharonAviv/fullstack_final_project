const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const USERS_FILE = path.join(__dirname, 'users.json');
const CART_FILE = path.join(__dirname, 'carts.json');

// Ensure admin user exists
async function init() {
  try {
    const adminUser = { username: 'admin', password: '$2b$10$7B2kAI/3fX7KgX3XZTL5reJ56BObA5LB.n3b7F6fyQZ2pFhxS9Um6' };
    let users = await getUsers();
    if (!users.find(user => user.username === 'admin')) {
      users.push(adminUser);
      await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

// Get all users from users.json
async function getUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = await fs.promises.readFile(USERS_FILE, 'utf8');
      if (data.trim() === '') {
        return []; // Handle empty file by returning an empty array
      }
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}


async function saveUser(user) {
  try {
    const users = await getUsers();
    users.push(user);
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

// Find a user by username
async function findUserByUsername(username) {
  try {
    const users = await getUsers();
    return users.find(user => user.username === username);
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Get cart items for a specific user
async function getCart(username) {
  const carts = await getCarts();
  return carts[username] || [];
}

// Save cart items for a specific user
async function saveCart(username, cartItems) {
  const carts = await getCarts();
  carts[username] = cartItems;
  await fs.promises.writeFile(CART_FILE, JSON.stringify(carts, null, 2));
}

// Get all carts from carts.json
async function getCarts() {
  try {
    const data = await fs.promises.readFile(CART_FILE);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}; // Return an empty object if file doesn't exist
    } else {
      throw error; // Rethrow other errors
    }
  }
}

module.exports = { init, saveUser, getUsers, findUserByUsername, getCart, saveCart };
