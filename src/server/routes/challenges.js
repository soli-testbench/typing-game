const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/challenges/random - Get a random challenge
router.get('/random', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM challenges ORDER BY RANDOM() LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No challenges available' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching random challenge:', err);
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

module.exports = router;
