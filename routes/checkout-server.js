const express = require('express');
const router = express.Router();
const { getCart, saveCart, getTicketCart, saveTicketCart } = require('./persist');
const { verifyToken } = require('./middleware');

// Route to review cart items before checkout
router.get('/review', verifyToken, async (req, res) => {
    const username = req.user;
    try {
        const cartItems = await getCart(username);
        if(cartItems.length === 0) {
            return res.status(400).send({ message: 'Your cart is empty' });
        }
        res.json(cartItems);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving cart items' });
    }
});

// Route to process the checkout
router.post('/pay', verifyToken, async (req, res) => {
    const username = req.user;
    try {
        const cartItems = await getCart(username);
        if(cartItems.length === 0) {
            return res.status(400).send({ message: 'Your cart is empty' });
        }
        // Assume payment is successful
        await saveCart(username, []); // Clear the cart after payment
        res.status(200).send({ message: 'Payment successful, your order is being processed', redirectUrl: '/thank-you' });
    } catch (error) {
        res.status(500).send({ message: 'Error processing your payment' });
    }
});

module.exports = router;
