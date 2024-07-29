const express = require('express');
const router = express.Router();
const { readActivities } = require('./activityLogger');

router.get('/activities', async (req, res) => {
    try {
        const activities = await readActivities();
        res.json(activities);
    } catch (error) {
        res.status(500).send({ message: 'Failed to fetch activities' });
    }
});

module.exports = router;
