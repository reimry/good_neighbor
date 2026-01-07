const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate } = require('../middleware/authMiddleware');

// GET /api/services
// Get all bills for current user's apartment, grouped by month
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's apartment_id
        const userResult = await db.query('SELECT apartment_id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || !userResult.rows[0].apartment_id) {
            return res.status(404).json({ error: 'Apartment not found for user' });
        }
        
        const apartmentId = userResult.rows[0].apartment_id;
        
        // Get all bills for this apartment, ordered by month (newest first)
        const billsResult = await db.query(
            `SELECT * FROM bills 
             WHERE apartment_id = $1 
             ORDER BY month DESC, service_type ASC`,
            [apartmentId]
        );
        
        // Group bills by month
        const billsByMonth = {};
        billsResult.rows.forEach(bill => {
            const monthKey = bill.month.toISOString().substring(0, 7); // '2025-01'
            if (!billsByMonth[monthKey]) {
                billsByMonth[monthKey] = {
                    month: bill.month,
                    bills: [],
                    total: 0
                };
            }
            billsByMonth[monthKey].bills.push(bill);
            billsByMonth[monthKey].total += parseFloat(bill.amount);
        });
        
        // Convert to array and sort by month (newest first)
        const months = Object.values(billsByMonth).sort((a, b) => 
            new Date(b.month) - new Date(a.month)
        );
        
        // Get apartment balance
        const aptResult = await db.query('SELECT balance FROM apartments WHERE id = $1', [apartmentId]);
        const balance = aptResult.rows[0]?.balance || 0;
        
        res.json({
            apartment_id: apartmentId,
            balance: parseFloat(balance),
            months: months
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/services/:month
// Get bills for a specific month (format: YYYY-MM)
router.get('/:month', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { month } = req.params; // '2025-01'
        
        // Validate month format
        if (!/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
        }
        
        // Get user's apartment_id
        const userResult = await db.query('SELECT apartment_id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || !userResult.rows[0].apartment_id) {
            return res.status(404).json({ error: 'Apartment not found for user' });
        }
        
        const apartmentId = userResult.rows[0].apartment_id;
        const monthDate = new Date(month + '-01');
        
        // Get bills for this month
        const billsResult = await db.query(
            `SELECT * FROM bills 
             WHERE apartment_id = $1 AND month = $2 
             ORDER BY service_type ASC`,
            [apartmentId, monthDate]
        );
        
        const total = billsResult.rows.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        
        res.json({
            month: monthDate,
            bills: billsResult.rows,
            total: total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


