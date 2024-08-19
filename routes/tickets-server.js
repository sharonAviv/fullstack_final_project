const express = require('express');
const router = express.Router();
const { getTicketsByGameStand, purchaseTickets, getTicketsByGameID } = require('./persist'); // Adjust the path as necessary

// GET tickets for a specific (game and stand) or ticketId
router.get('/', async (req, res) => {
    const { gameId, stand, ticketId } = req.query;
    console.log("gameid : " + gameId);
    console.log("stand : " + stand);
    console.log("ticketid : " + ticketId);

    try {
        let tickets;
        if (gameId) {
            // Fetch tickets by ticketId
            tickets = await getTicketsByGameID(gameId);
            console.log("Tickets fetched for gameId:", { gameId, tickets });
        } else if (gameId && stand) {
            // Fetch tickets by gameId and stand
            tickets = await getTicketsByGameStand(gameId, stand);
            console.log("Tickets fetched for gameId and stand:", { gameId, stand, tickets });
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
