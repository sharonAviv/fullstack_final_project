const express = require('express');
const router = express.Router();
const Game = require('../models/Game'); // Assuming Mongoose models

// POST a new game
router.post('/', async (req, res) => {
  const { name, datetime } = req.body;
  try {
    const newGame = new Game({ name, datetime });
    await newGame.save();
    res.status(201).send(newGame);
  } catch (error) {
    res.status(400).send(error);
  }
});

// GET all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find({});
    res.status(200).send(games);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
