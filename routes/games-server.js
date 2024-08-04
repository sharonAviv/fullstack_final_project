const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const GAMES_FILE = path.join(__dirname, 'games.json');

// Load games from the JSON file
async function loadGames() {
    const data = await fs.promises.readFile(GAMES_FILE);
    return JSON.parse(data);
}

// Save games to the JSON file
async function saveGames(games) {
    await fs.promises.writeFile(GAMES_FILE, JSON.stringify(games, null, 2));
}

// POST a new game
router.post('/', async (req, res) => {
    const { title, date, venue, teams } = req.body;
    try {
        const games = await loadGames();
        const newGame = { id: games.length + 1, title, date, venue, teams, status: 'scheduled' }; // Generate an ID
        games.push(newGame);
        await saveGames(games);
        res.status(201).send(newGame);
    } catch (error) {
        res.status(400).send(error);
    }
});

// GET all games
router.get('/', async (req, res) => {
    try {
        const games = await loadGames();
        res.status(200).send(games);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
