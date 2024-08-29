const express = require('express');
const router = express.Router();
const { getTicketsByGameStand, purchaseTickets, getTicketsByGameID, getTicketsByTicketID, getGameById } = require('./persist'); // Adjust the path as necessary
const { verifyAdmin } = require('./middleware');

// GET tickets for a specific (game and stand) or ticketId
router.get('/', async (req, res) => {
    const { gameId, stand, ticketId } = req.query;
    console.log("gameid : " + gameId);
    console.log("stand : " + stand);
    console.log("ticketid : " + ticketId);

    try {
        let tickets;
        if (gameId) {
            // Fetch tickets by gameId
            console.log("Fetching tickets by gameId:", gameId);
            tickets = await getTicketsByGameID(gameId);
            console.log("Tickets fetched for gameId:", { gameId, tickets });
        } else if (gameId && stand) {
            // Fetch tickets by gameId and stand
            console.log("Fetching tickets by gameId and stand:", { gameId, stand });
            tickets = await getTicketsByGameStand(gameId, stand);
            console.log("Tickets fetched for gameId and stand:", { gameId, stand, tickets });
        } else if (ticketId) {
            // Fetch tickets by ticketId
            console.log("Fetching ticket by ID:", ticketId);
            tickets = await getTicketsByTicketID(ticketId);
            console.log("Tickets fetched for ticketId:", { ticketId, tickets });
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
    console.log('/purchase route hit for ticketIds' + JSON.stringify({ ticketIds }));
    try {
        await purchaseTickets(ticketIds);
        console.log('Tickets purchased successfully');
        res.status(200).send({ message: 'Tickets purchased successfully' });
    } catch (error) {
        console.error('Error purchasing tickets:', error);
        res.status(500).send(error);
    }
});

router.post('/', verifyAdmin, async (req, res) => {
    const { gameId, seatNumber, stand, price } = req.body;
    console.log('Received POST request to add ticket:', req.body);

    try {
        const game = await getGameById(gameId); 
        if (!game) {
            return res.status(404).send({ message: 'Game not found' });
        }

        const newTicket = { 
            game_id: gameId, 
            game_date: game.game_date, 
            seat_number: seatNumber, 
            stand, 
            price, 
            status: 'available' 
        };
        
        const addedTicket = await saveTicket(newTicket);
        
        if (typeof addedTicket === 'number') {
            console.log('Ticket added:', addedTicket);
            res.status(201).send({ message: 'Ticket added successfully', ticketId: addedTicket });
        } else {
            console.log('Ticket already exists:', addedTicket);
            res.status(200).send({ message: 'Ticket already exists', ticket: addedTicket });
        }
    } catch (error) {
        res.status(400).send({ message: 'Error adding ticket', error: error.message });
    }
});


module.exports = router;
