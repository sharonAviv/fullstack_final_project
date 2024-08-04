const express = require('express');
const router = express.Router();
const { logActivity } = require('./activityLogger');

router.post('/', async (req, res) => {
    console.log("Attempting to logout");
    const { username } = req.body; // Access the username from the request body

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Log the logout activity
        await logActivity(username, 'logout');
        // Instruct the client to delete the token
        res.status(200).send({ message: 'Logged out successfully', clearToken: true });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).send({ message: 'Error logging out' });
    }
});

module.exports = router;
