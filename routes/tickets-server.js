const express = require('express');
const router = express.Router();
const { getTickets, purchaseTickets } = require('./persist'); // Adjust the path as necessary

// GET tickets for a specific game and stand
router.get('/', async (req, res) => {
    const { gameId, stand } = req.query;
    try {
        const tickets = await getTickets(gameId, stand);
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).send({ error: 'Error fetching tickets', details: error.message });
    }
});

// POST to purchase tickets
router.post('/purchase', async (req, res) => {
    const { ticketIds } = req.body;
    try {
        await purchaseTickets(ticketIds);
        res.status(200).send({ message: 'Tickets purchased successfully' });
    } catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).send(error);
    }
});

module.exports = router;
