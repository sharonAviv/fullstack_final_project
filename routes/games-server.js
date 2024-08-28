const express = require('express');
const router = express.Router();
const { saveGame, getAllGames } = require('./persist'); // Adjust the path as necessary

// POST a new game
router.post('/', async (req, res) => {
    const { title, date, teamHome, teamAway, stadiumName } = req.body;
    console.log('Received POST request to add game:', req.body);

    try {
        const newGame = { title, game_date: date, team_home: teamHome, team_away: teamAway, stadium_name: stadiumName, status: 'scheduled' };
        const addedGame = await saveGame(newGame);
        
        if (addedGame.game_id) {
            console.log('Game added:', addedGame);
            res.status(201).send(addedGame);
        } else {
            console.log('Game already exists:', addedGame);
            res.status(200).send({ message: 'Game already exists', game: addedGame });
        }
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
