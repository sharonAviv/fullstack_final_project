const express = require('express');
const router = express.Router();
const { logActivity } = require('./activityLogger');
const { verifyToken } = require('./middleware');

router.post('/', verifyToken, async (req, res) => {
    console.log("Attempting to logout");
    const { username } = req.user; // Access the username from req.user, already decoded

    if (!req.user || !username) {
        return res.status(400).json({ message: 'Invalid user data, logout failed' });
    }

    try {
        // Log the logout activity
        
        // Clear the token cookie by setting its expiration date to a past date
        res.clearCookie('token', { path: '/', httpOnly: true, secure: true });
        
        await logActivity(username, 'logout');

        // Send a successful logout response
        res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).send({ message: 'Error logging out' });
    }
});

module.exports = router;
