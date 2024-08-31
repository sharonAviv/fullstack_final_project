const express = require('express');
const router = express.Router();
const { getAllGames } = require('./persist'); // Adjust the path as necessary

// GET all games
router.get('/', async (req, res) => {
    console.log('Received GET request to fetch all games');
    
    try {
        const games = await getAllGames();
        console.log('Games fetched successfully:', games.length, 'games found.');
        res.status(200).send(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).send({ message: 'Error fetching games', error: error.message });
    }
});

module.exports = router;
