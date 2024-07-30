const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// GET tickets for a specific game
router.get('/', async (req, res) => {
  const { gameId } = req.query;
  try {
    const tickets = await Ticket.find({ game_id: gameId });
    res.status(200).send(tickets);
  } catch (error) {
    res.status(500).send(error);
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
