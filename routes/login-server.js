const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { findUserByUsername } = require('./persist');
const jwt = require('jsonwebtoken');
const { logActivity } = require('./activityLogger'); // Import the logging utility

router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    const user = await findUserByUsername(username);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send({ message: 'Invalid credentials.' });
    }
    
    const expiresIn = rememberMe ? '10d' : '30m';
    const token = jwt.sign({ username }, 'your_secret_key', { expiresIn });

    res.cookie('token', token, { httpOnly: true, maxAge: rememberMe ? 864000000 : 1800000 });

    // Ensure logging is complete before sending the response
    await logActivity(username, 'login');
    res.send({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Error during login:', error);
    if (!res.headersSent) {
      res.status(500).send({ message: 'Failed to process login' });
    }
  }
});

module.exports = router;
