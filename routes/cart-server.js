const express = require('express');
const router = express.Router();
const { getCart, saveCart } = require('./persist');
const { verifyToken } = require('./middleware'); // Middleware for authentication
const { logActivity } = require('./activityLogger'); // Activity logging

// View the cart
router.get('/view', verifyToken, async (req, res) => {
    console.log('/view route hit'); // Debugging log
    const username = req.user; // Assuming req.user is set by verifyToken
    try {
        const cartItems = await getCart(username);
        res.json(cartItems);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching cart items' });
    }
});

// Add an item to the cart
router.post('/add-to-cart', verifyToken, async (req, res) => {
    console.log('/add-to-cart route hit'); // Debugging log
    const username = req.user; // Assuming req.user is set by verifyToken
    console.log('Username:', username); // Debugging log
    const { productId, customization = null } = req.body; // Expecting productId and customization details

    try {
        let cartItems = await getCart(username);
        console.log('Current cart items:', cartItems); // Debugging log
        const newItem = {
            productId,
            customization,  // Stores custom details like {name: "Custom Name", number: "99"}
            quantity: 1
        };

        // Check if the item already exists in the cart
        const existingItem = cartItems.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1; // Increment quantity
        } else {
            cartItems.push(newItem); // Add new item
        }

        await saveCart(username, cartItems);
        await logActivity(username, 'item-added-to-cart');
        res.status(201).send({ message: 'Item added to cart successfully with customization', cartItems });
    } catch (error) {
        res.status(500).send({ message: 'Error adding item to cart', error: error.message });
    }
});

// Remove an item from the cart
router.post('/remove', verifyToken, async (req, res) => {
    console.log('/remove route hit'); // Debugging log
    const username = req.user; // Assuming req.user is set by verifyToken
    const { productId } = req.body;
    try {
        let cartItems = await getCart(username);
        cartItems = cartItems.filter(item => item.productId !== productId);
        await saveCart(username, cartItems);
        await logActivity(username, 'item-removed-from-cart');
        res.send({ message: 'Item removed successfully', cartItems });
    } catch (error) {
        res.status(500).send({ message: 'Error removing item from cart', error: error.message });
    }
});

module.exports = router;
