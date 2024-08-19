const express = require('express');
const router = express.Router();
const { getCart, saveCart, addToCart } = require('./persist');
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
    console.log('cart of user :', username); // Debugging log
    console.log(req.body);

    const { productId } = req.body; // Ensure productId is correctly extracted from the request body

    try {
        await addToCart(username, productId);
        const cartItems = await getCart(username); // Get updated cart items for the response
        console.log(cartItems)
        await logActivity(username, 'item-added-to-cart');
        res.status(201).send({ message: 'Item added to cart successfully', cartItems });
    } catch (error) {
        console.error('Error adding item to cart:', error); // Log the error for debugging
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

router.post('/removeAll', verifyToken, async (req, res) => {
    console.log('/remove all route hit'); // Debugging log
    const username = req.user; // Assuming req.user is set by verifyToken
    try {
        const cartItems = []
        await saveCart(username, cartItems);
        await logActivity(username, 'all-item-removed-from-cart');
        res.send({ message: 'Items removed successfully', cartItems });
    } catch (error) {
        res.status(500).send({ message: 'Error removing all items from cart', error: error.message });
    }
});

module.exports = router;
