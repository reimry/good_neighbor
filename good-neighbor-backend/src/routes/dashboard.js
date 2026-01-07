const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // 1. Get Apartment Info (Balance, Area)
    // We already have apartment_id in the token/user object usually, 
    // but let's fetch fresh data from DB to get current balance
    const apartmentResult = await db.query(
        'SELECT number, area, balance FROM apartments WHERE id = $1',
        [user.apartment_id]
    );
    const apartment = apartmentResult.rows[0];

    // 2. Get Top 3 Latest News
    const newsResult = await db.query(
        'SELECT id, title, content, is_important, created_at FROM news ORDER BY created_at DESC LIMIT 3'
    );
    const latest_news = newsResult.rows;

    res.json({
        apartment,
        latest_news
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
