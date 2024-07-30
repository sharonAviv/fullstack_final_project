const express = require('express');
const router = express.Router();
const { getCart, saveCart } = require('./persist');
const { verifyToken } = require('./middleware');
const { logActivity } = require('./activityLogger');

router.get('/view', verifyToken, async (req, res) => {
    const username = req.user;
    try {
        const cartItems = await getCart(username);
        res.json(cartItems);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching cart items' });
    }
});

router.post('/add', verifyToken, async (req, res) => {
    const username = req.user;
    const { productId, customization } = req.body;  // Expect customization details like {name: "Custom Name", number: "99"}

    try {
        let cartItems = await getCart(username);
        const newItem = {
            productId,
            customization,  // This will store custom details for a product
            quantity: 1     // Default quantity can be adjusted based on your needs
        };
        
        // Check if the item already exists in the cart to update quantity
        const existingItem = cartItems.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1; // Adjust quantity appropriately
        } else {
            cartItems.push(newItem);
        }

        await saveCart(username, cartItems);
        await logActivity(username, 'item-added-to-cart');
        res.status(201).send({ message: 'Item added to cart successfully with customization', cartItems });
    } catch (error) {
        res.status(500).send({ message: 'Error adding item to cart', error: error.message });
    }
});

router.post('/remove', verifyToken, async (req, res) => {
    const username = req.user;
    const productId = req.body.productId;
    try {
        let cartItems = await getCart(username);
        cartItems = cartItems.filter(item => item.productId !== productId);
        await saveCart(username, cartItems);
        await logActivity(username, 'item-removed-from-cart');
        res.send({ message: 'Item removed successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error removing item from cart' });
    }
});

module.exports = router;
