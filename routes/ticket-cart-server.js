const express = require('express');
const router = express.Router();
const { getTicketCart, saveTicketCart, addToTicketCart } = require('./persist');
const { verifyToken } = require('./middleware'); // Middleware for authentication
const { logActivity } = require('./activityLogger'); // Activity logging

// View the cart
router.get('/view', verifyToken, async (req, res) => {
    console.log('/view route hit'); // Debugging log
    const username = req.user.username; // Assuming req.user is set by verifyToken
    try {
        const cartItems = await getTicketCart(username);
        res.json(cartItems);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching cart items' });
    }
});

// Add an item to the cart
router.post('/add-to-cart', verifyToken, async (req, res) => {
    console.log('/add-to-cart route hit'); // Debugging log
    const username = req.user.username; // Assuming req.user is set by verifyToken
    console.log('Username:', username); // Debugging log
    const { ticketId } = req.body; // Expecting productId and customization details

    try {
        console.log('Adding to cart, ticketId:', ticketId);
        await addToTicketCart(username, ticketId);
        let cartItems = await getTicketCart(username);
        await logActivity(username, 'item-added-to-cart');
        res.status(201).send({ message: 'Item added to cart successfully', cartItems });
    } catch (error) {
        console.error('Error adding item to cart:', error); // Added error logging
        res.status(500).send({ message: 'Error adding item to cart', error: error.message });
    }
});

// Remove an ticket from the cart
router.post('/remove', verifyToken, async (req, res) => {
    console.log('/remove route hit'); // Debugging log
    const username = req.user.username; // Assuming req.user is set by verifyToken
    const { ticketId } = req.body;
    console.log("ticketid: " + ticketId);
    try {
        let cartItems = await getTicketCart(username);
        console.log(JSON.stringify(cartItems, null, 2)); // This will show all items with full details in JSON format
        cartItems = cartItems.filter(ticket => ticket.ticket_id !== ticketId);
        console.log(JSON.stringify(cartItems, null, 2)); // This will show all items with full details in JSON format
        await saveTicketCart(username, cartItems);
        await logActivity(username, 'item-removed-from-cart');
        res.send({ message: 'Item removed successfully', cartItems });
    } catch (error) {
        res.status(500).send({ message: 'Error removing item from cart', error: error.message });
    }
});

module.exports = router;
