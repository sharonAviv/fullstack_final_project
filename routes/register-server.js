const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { saveUser, findUserByUsername } = require('./persist');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
    
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already in use.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await saveUser({ username, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
