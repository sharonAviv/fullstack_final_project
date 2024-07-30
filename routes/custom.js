const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // Make sure to npm install node-fetch if not already installed
const { verifyToken } = require('./middleware');
const { logActivity } = require('./activityLogger');

// Endpoint to submit a new customization
router.post('/submit', verifyToken, async (req, res) => {
    const username = req.user;
    const { productId, customization } = req.body; // customization should be an object e.g., {name: "Name", number: "Number"}

    if (!customization || !productId) {
        return res.status(400).json({ message: 'Product ID and customization details are required' });
    }

    // Prepare to add the customized product to the user's cart
    try {
        const cartServiceUrl = `http://localhost:3000/api/cart/add`; // URL to interact with the cart server
        const response = await fetch(cartServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.token}` // assuming the token is stored in cookies
            },
            body: JSON.stringify({ productId, customization })
        });

        const cartResponse = await response.json();
        if (response.ok) {
            await logActivity(username, 'customization-added-to-cart');
            return res.status(201).send(cartResponse);
        } else {
            throw new Error(cartResponse.message);
        }
    } catch (error) {
        res.status(500).send({ message: 'Failed to add customization to cart', error: error.message });
    }
});

module.exports = router;
