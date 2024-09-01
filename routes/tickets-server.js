const express = require('express');
const router = express.Router();
const { getTicketsByGameStand, purchaseTickets, getTicketsByGameID, getTicketsByTicketID, getGameById,saveTicketCart } = require('./persist'); // Adjust the path as necessary
const { verifyToken } = require('./middleware');
const { logActivity } = require('./activityLogger'); // Activity logging


// GET tickets for a specific (game and stand) or ticketId
router.get('/', async (req, res) => {
    const { gameId, stand, ticketId } = req.query;
    try {
        let tickets;
        if (gameId) {
            // Fetch tickets by gameId
            tickets = await getTicketsByGameID(gameId);
        } else if (gameId && stand) {
            // Fetch tickets by gameId and stand
            tickets = await getTicketsByGameStand(gameId, stand);
        } else if (ticketId) {
            // Fetch tickets by ticketId
            tickets = await getTicketsByTicketID(ticketId);
        } else {
            throw new Error('Missing required query parameters');
        }
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).send({ error: 'Error fetching tickets', details: error.message });
    }
});

// POST to purchase tickets
router.post('/purchase',verifyToken ,async (req, res) => {
    const username = req.user.username;
    const { ticketIds } = req.body;
    console.log('/purchase route hit for ticketIds' + JSON.stringify({ ticketIds }));
    try {
        await purchaseTickets(ticketIds);
        await saveTicketCart(username, []);
        await logActivity(username, 'purchase-completed');
        console.log('Tickets purchased successfully');
        res.status(200).send({ message: 'Tickets purchased successfully' });
    } catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).send(error);
    }
});

module.exports = router;
