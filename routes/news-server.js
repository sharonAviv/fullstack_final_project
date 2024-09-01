const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.get('/', async (req, res) => {
  const apiKey = '84923122f7f44024a0f46f7fc72f7b2b'; 
  const query = 'Israel\'s national soccer team NOT war NOT Hamas NOT lebanon NOT Removed';

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      res.json(data.articles);
    } else {
      res.status(response.status).json({ error: response.statusText });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
