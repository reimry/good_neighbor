const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/connection');
const { authenticate } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// GET /api/profile
// Get current user profile
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, phone, full_name, role, apartment_id, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        
        // Get apartment info if exists
        let apartment = null;
        if (user.apartment_id) {
            const aptResult = await db.query('SELECT number, area, balance FROM apartments WHERE id = $1', [user.apartment_id]);
            apartment = aptResult.rows[0];
        }

        res.json({
            ...user,
            apartment
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/profile/phone
// Update phone number
router.patch('/phone',
    authenticate,
    [
        body('phone').notEmpty().withMessage('Телефон обов\'язковий'),
        body('phone').matches(/^\+380\d{9}$/).withMessage('Телефон має бути у форматі +380XXXXXXXXX')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone } = req.body;
        const userId = req.user.id;

        try {
            // Check if phone is already taken by another user
            const phoneCheck = await db.query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
            if (phoneCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Користувач з таким телефоном вже існує' });
            }

            // Update phone
            const result = await db.query(
                'UPDATE users SET phone = $1 WHERE id = $2 RETURNING id, phone, full_name, role',
                [phone, userId]
            );

            res.json({
                message: 'Номер телефону оновлено',
                user: result.rows[0]
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// PATCH /api/profile/password
// Update password
router.patch('/password',
    authenticate,
    [
        body('current_password').notEmpty().withMessage('Поточний пароль обов\'язковий'),
        body('new_password').isLength({ min: 6 }).withMessage('Новий пароль має бути мінімум 6 символів')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        try {
            // Get current user's password hash
            const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Невірний поточний пароль' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update password
            await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

            res.json({ message: 'Пароль успішно змінено' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

module.exports = router;


