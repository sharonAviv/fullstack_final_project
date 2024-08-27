const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('./middleware'); // Adjust the path as necessary

// Example route accessible to all authenticated users
router.get('/user-data', verifyToken, (req, res) => {
    console.log("im in user data");
    //onsole.log("user data req: " + req);
    const user = req.user;
    console.log('User authenticated:', user);
    res.json({ user });
});

// Example route only accessible to admin users
router.get('/admin-data', verifyToken, verifyAdmin, (req, res) => {
    console.log('Admin authenticated:', req.user.username);
    res.json({ message: 'Welcome, admin!', user: req.user });
});

module.exports = router;
