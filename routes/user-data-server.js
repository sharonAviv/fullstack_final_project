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

module.exports = router;
