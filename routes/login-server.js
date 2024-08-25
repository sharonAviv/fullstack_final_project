const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByUsername } = require('./persist'); // Adjust the path as necessary
const { logActivity } = require('./activityLogger'); // Import the logging utility

router.post('/', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        console.log('Login attempt for user:', username);

        const user = await findUserByUsername(username);
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const passwordMatch = await bcryptjs.compare(password, user.password_hash);
        if (!passwordMatch) {
            console.log('Incorrect password for user:', username);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const expiresIn = remember ? '10d' : '30m';

        // Include isAdmin in the JWT payload
        const token = jwt.sign({ username: user.username, isAdmin: user.is_admin }, 'your_secret_key', { expiresIn });
        console.log('Token generated for user:', username, token);

        res.cookie('token', token, { maxAge: remember ? 864000000 : 1800000, httpOnly: true });

        await logActivity(username, 'login');
        res.json({ message: 'Logged in successfully', redirect: '/shop' });
        
    } catch (error) {
        console.error('Error during login:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to process login' });
        }
    }
});

module.exports = router;
