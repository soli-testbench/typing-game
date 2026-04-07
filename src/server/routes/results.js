const express = require('express');
const pool = require('../db');

const router = express.Router();

// POST /api/results - Save a game result
router.post('/', async (req, res) => {
  try {
    const { wpm, accuracy, time_taken, challenge_text } = req.body;

    if (wpm == null || accuracy == null || time_taken == null || !challenge_text) {
      return res.status(400).json({ error: 'Missing required fields: wpm, accuracy, time_taken, challenge_text' });
    }

    if (typeof wpm !== 'number' || typeof accuracy !== 'number' || typeof time_taken !== 'number') {
      return res.status(400).json({ error: 'wpm, accuracy, and time_taken must be numbers' });
    }

    const result = await pool.query(
      `INSERT INTO game_results (wpm, accuracy, time_taken, challenge_text, completed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [wpm, accuracy, time_taken, challenge_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving result:', err);
    res.status(500).json({ error: 'Failed to save game result' });
  }
});

// GET /api/results - Get recent game history (last 20)
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM game_results ORDER BY completed_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch game results' });
  }
});

module.exports = router;
