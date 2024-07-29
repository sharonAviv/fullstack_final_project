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

router.post('/remove', verifyToken, async (req, res) => {
    const username = req.user;
    const productId = req.body.productId;
    try {
        let cartItems = await getCart(username);
        cartItems = cartItems.filter(item => item.productId !== productId);
        await saveCart(username, cartItems);
        await logActivity(username, 'add-to-cart');
        res.send({ message: 'Item removed successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error removing item from cart' });
    }
});

module.exports = router;
