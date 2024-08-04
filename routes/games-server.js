const express = require('express');
const router = express.Router();
const { addGame, getAllGames } = require('./persist'); // Adjust the path as necessary

// POST a new game
router.post('/', async (req, res) => {
    const { title, date, venue, teams } = req.body;
    try {
        const newGame = { title, date, venue, teams, status: 'scheduled' }; // Generate an ID
        const addedGame = await addGame(newGame);
        res.status(201).send(addedGame);
    } catch (error) {
        res.status(400).send({ message: 'Error adding game', error: error.message });
    }
});

// GET all games
router.get('/', async (req, res) => {
    try {
        const games = await getAllGames();
        res.status(200).send(games);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching games', error: error.message });
    }
});

module.exports = router;
