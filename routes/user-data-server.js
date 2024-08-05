const express = require('express');
const router = express.Router();
const { verifyToken } = require('./middleware'); // Adjust the path as necessary

router.get('/user-data', verifyToken, (req, res) => {
    console.log('trying to ver', username);
    const username = req.user;
    console.log('User authenticated:', username);
    res.json({ user: username });
});

module.exports = router;
