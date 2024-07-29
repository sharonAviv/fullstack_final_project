const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');
const CART_FILE = path.join(__dirname, 'carts.json');

async function init() {
  const adminUser = { username: 'admin', password: '$2b$10$7B2kAI/3fX7KgX3XZTL5reJ56BObA5LB.n3b7F6fyQZ2pFhxS9Um6' }; // bcrypt hash for 'admin'
  let users = await getUsers();
  if (!users.find(user => user.username === 'admin')) {
    users.push(adminUser);
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(users));
  }
}

async function saveUser(user) {
  const users = await getUsers();
  users.push(user);
  return fs.promises.writeFile(USERS_FILE, JSON.stringify(users));
}

async function getUsers() {
  try {
    const data = await fs.promises.readFile(USERS_FILE);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function findUserByUsername(username) {
  const users = await getUsers();
  return users.find(user => user.username === username);
}

async function getCart(username) {
    const carts = await getCarts();
    return carts[username] || [];
}

async function saveCart(username, cartItems) {
    const carts = await getCarts();
    carts[username] = cartItems;
    await fs.promises.writeFile(CART_FILE, JSON.stringify(carts));
}

async function getCarts() {
    try {
        const data = await fs.promises.readFile(CART_FILE);
        return JSON.parse(data);
    } catch (error) {
        return {}; // Return an empty object if no carts or error
    }
}

module.exports = { init, saveUser, getUsers, findUserByUsername, getCart, saveCart };
