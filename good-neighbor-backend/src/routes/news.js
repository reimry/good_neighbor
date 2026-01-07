const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// GET /api/news?page=1&limit=10
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await db.query('SELECT COUNT(*) FROM news');
        const total = parseInt(countResult.rows[0].count);

        const newsResult = await db.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            news: newsResult.rows,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/news (Admin only)
router.post('/', 
    authenticate, 
    requireRole('admin'), 
    [
        body('title').notEmpty().withMessage('Заголовок обов’язковий'),
        body('content').notEmpty().withMessage('Зміст обов’язковий')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, is_important } = req.body;
        const author_id = req.user.id;

        try {
            const result = await db.query(
                'INSERT INTO news (title, content, is_important, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [title, content, is_important || false, author_id]
            );
            
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// DELETE /api/news/:id (Admin only)
router.delete('/:id',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM news WHERE id = $1', [id]);
            res.json({ message: 'Новину видалено' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

module.exports = router;
