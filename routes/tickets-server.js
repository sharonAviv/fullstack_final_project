const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// GET tickets for a specific game and stand
router.get('/', async (req, res) => {
    const { gameId, stand } = req.query;
    try {
        const query = { game_id: gameId };
        if (stand) {
            query.stand = stand;
        }
        const tickets = await Ticket.find(query);
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// POST to purchase tickets
router.post('/purchase', async (req, res) => {
    const { ticketIds } = req.body;
    try {
        await Ticket.updateMany(
            { _id: { $in: ticketIds }, status: 'available' },
            { $set: { status: 'sold' } }
        );
        res.status(200).send({ message: 'Tickets purchased successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
