const express = require('express');
const router = express.Router();
const { logActivity } = require('./activityLogger');

router.post('/logout', (req, res) => {
    const username = req.user.username; // Assuming you have user information in req.user

    // Log the logout activity
    logActivity(username, 'logout').then(() => {
        // You can instruct the client to delete the token
        res.status(200).send({ message: 'Logged out successfully', clearToken: true });
    }).catch(error => {
        res.status(500).send({ message: 'Error logging out' });
    });
});

module.exports = router;
