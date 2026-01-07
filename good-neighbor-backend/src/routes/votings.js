const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const { getAdminOSBBId, verifyVotingBelongsToOSBB } = require('../services/osbbService');
const { logVoting } = require('../services/loggerService');

// GET /api/votings
// List all votings for user's OSBB, ordered by status (active first) then creation date
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's OSBB ID (if they have an apartment)
        let osbbId = null;
        const userResult = await db.query(
            'SELECT apartment_id FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length > 0 && userResult.rows[0].apartment_id) {
            const aptResult = await db.query(
                'SELECT osbb_id FROM apartments WHERE id = $1',
                [userResult.rows[0].apartment_id]
            );
            if (aptResult.rows.length > 0) {
                osbbId = aptResult.rows[0].osbb_id;
            }
        }
        
        // For admins, get OSBB from user.osbb_id or registration
        if (req.user.role === 'admin' && !osbbId) {
            const { getAdminOSBBId } = require('../services/osbbService');
            osbbId = await getAdminOSBBId(userId);
        }
        
        // Filter by OSBB if available, otherwise return empty (tenant isolation)
        let query = 'SELECT * FROM votings';
        const params = [];
        
        if (osbbId) {
            query += ' WHERE osbb_id = $1';
            params.push(osbbId);
        } else {
            // User has no OSBB association - return empty (security: tenant isolation)
            return res.json([]);
        }
        
        query += ` ORDER BY 
            CASE WHEN status = 'active' THEN 1 ELSE 2 END,
            created_at DESC`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/votings/:id
// Get details. If user is provided, check if they voted.
// If finished, calculate results.
// Verifies voting belongs to user's OSBB (tenant isolation)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        // Get user's OSBB ID
        let userOSBBId = null;
        const userResult = await db.query(
            'SELECT apartment_id, role FROM users WHERE id = $1',
            [user_id]
        );
        
        if (userResult.rows.length > 0) {
            if (userResult.rows[0].apartment_id) {
                const aptResult = await db.query(
                    'SELECT osbb_id FROM apartments WHERE id = $1',
                    [userResult.rows[0].apartment_id]
                );
                if (aptResult.rows.length > 0) {
                    userOSBBId = aptResult.rows[0].osbb_id;
                }
            }
            
            // For admins, try to get from user.osbb_id or registration
            if (userResult.rows[0].role === 'admin' && !userOSBBId) {
                const { getAdminOSBBId } = require('../services/osbbService');
                userOSBBId = await getAdminOSBBId(user_id);
            }
        }

        // 1. Get Voting Details
        const votingResult = await db.query('SELECT * FROM votings WHERE id = $1', [id]);
        if (votingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Voting not found' });
        }
        const voting = votingResult.rows[0];
        
        // 2. Verify voting belongs to user's OSBB (tenant isolation)
        if (userOSBBId && voting.osbb_id !== userOSBBId) {
            return res.status(403).json({ 
                error: 'Voting does not belong to your OSBB' 
            });
        }
        
        if (!userOSBBId) {
            return res.status(403).json({ 
                error: 'You are not associated with an OSBB' 
            });
        }

        // 3. Check if current user voted
        const voteCheck = await db.query(
            'SELECT choice FROM votes WHERE voting_id = $1 AND user_id = $2',
            [id, user_id]
        );
        const userVote = voteCheck.rows.length > 0 ? voteCheck.rows[0].choice : null;

        // 4. Calculate Results (if finished or user wants to see "current standing" - usually only if finished)
        let results = null;
        if (voting.status === 'finished') {
            if (voting.type === 'legal') {
                // Legal: Sum of apartment areas (weighted by area)
                // Only count apartments from the same OSBB as the voting
                const legalStats = await db.query(`
                    SELECT 
                        v.choice, 
                        SUM(a.area) as total_weight,
                        COUNT(DISTINCT v.user_id) as voter_count
                    FROM votes v
                    JOIN users u ON v.user_id = u.id
                    JOIN apartments a ON u.apartment_id = a.id
                    WHERE v.voting_id = $1 AND a.osbb_id = $2
                    GROUP BY v.choice
                `, [id, voting.osbb_id]);
                
                // Get total possible area (sum of all apartments in this OSBB)
                const totalAreaResult = await db.query(
                    'SELECT SUM(area) as total FROM apartments WHERE osbb_id = $1',
                    [voting.osbb_id]
                );
                const totalPossibleWeight = parseFloat(totalAreaResult.rows[0]?.total) || 1;
                
                // Calculate percentages for each choice
                const statsWithPercentages = legalStats.rows.map(stat => ({
                    choice: stat.choice,
                    total_weight: parseFloat(stat.total_weight) || 0,
                    voter_count: parseInt(stat.voter_count) || 0,
                    percentage: totalPossibleWeight > 0 
                        ? ((parseFloat(stat.total_weight) / totalPossibleWeight) * 100).toFixed(2)
                        : 0
                }));

                results = {
                    stats: statsWithPercentages,
                    total_possible_weight: totalPossibleWeight,
                    total_voted_weight: legalStats.rows.reduce((sum, s) => sum + parseFloat(s.total_weight || 0), 0),
                    unit: 'sq.m'
                };
            } else {
                // Simple: Headcount
                const simpleStats = await db.query(`
                    SELECT choice, COUNT(*) as count 
                    FROM votes 
                    WHERE voting_id = $1 
                    GROUP BY choice
                `, [id]);
                
                // Get total users count in this OSBB (only owners/tenants with apartments)
                const totalUsersResult = await db.query(`
                    SELECT COUNT(DISTINCT u.id) as count 
                    FROM users u
                    JOIN apartments a ON u.apartment_id = a.id
                    WHERE a.osbb_id = $1 AND u.role IN ('owner', 'tenant')
                `, [voting.osbb_id]);
                
                const totalPossible = parseInt(totalUsersResult.rows[0]?.count) || 1;
                const totalVoted = simpleStats.rows.reduce((sum, s) => sum + parseInt(s.count || 0), 0);
                
                // Calculate percentages
                const statsWithPercentages = simpleStats.rows.map(stat => ({
                    choice: stat.choice,
                    count: parseInt(stat.count) || 0,
                    percentage: totalPossible > 0 
                        ? ((parseInt(stat.count) / totalPossible) * 100).toFixed(2)
                        : 0
                }));
                
                results = {
                    stats: statsWithPercentages,
                    total_possible: totalPossible,
                    total_voted: totalVoted,
                    unit: 'votes'
                };
            }
        }

        res.json({
            ...voting,
            user_vote: userVote,
            results
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/votings (Admin Only)
// Creates a voting and verifies admin's OSBB
router.post('/', 
    authenticate, 
    requireRole('admin'),
    [
        body('title').notEmpty(),
        body('description').notEmpty(),
        body('type').isIn(['simple', 'legal']),
        body('start_date').isISO8601().withMessage('Invalid start date'),
        body('end_date').isISO8601().withMessage('Invalid end date')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { title, description, type, start_date, end_date } = req.body;
        const created_by = req.user.id;
        
        // Verify admin has an OSBB
        const adminOSBBId = await getAdminOSBBId(created_by);
        if (!adminOSBBId) {
            return res.status(403).json({ 
                error: 'You must be associated with an OSBB to create votings' 
            });
        }
        
        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate >= endDate) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }
        
        if (startDate < new Date()) {
            return res.status(400).json({ error: 'Start date cannot be in the past' });
        }
        
        try {
            const result = await db.query(
                'INSERT INTO votings (title, description, type, start_date, end_date, status, created_by, osbb_id) VALUES ($1, $2, $3, $4, $5, \'active\', $6, $7) RETURNING *',
                [title, description, type, start_date, end_date, created_by, adminOSBBId]
            );
            
            // Log voting creation
            await logVoting.create(created_by, adminOSBBId, result.rows[0].id, {
                title,
                description,
                type,
                start_date,
                end_date
            }, req);
            
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// PATCH /api/votings/:id (Admin Only)
// Update voting - only allowed if status is 'draft'
// Once active or finished, parameters become immutable
router.patch('/:id',
    authenticate,
    requireRole('admin'),
    [
        body('title').optional().notEmpty(),
        body('description').optional().notEmpty(),
        body('type').optional().isIn(['simple', 'legal']),
        body('start_date').optional().isISO8601(),
        body('end_date').optional().isISO8601()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { id } = req.params;
        const adminUserId = req.user.id;

        try {
            // Get voting and verify it belongs to admin's OSBB
            const votingResult = await db.query('SELECT * FROM votings WHERE id = $1', [id]);
            if (votingResult.rows.length === 0) {
                return res.status(404).json({ error: 'Voting not found' });
            }

            const voting = votingResult.rows[0];

            // Verify voting belongs to admin's OSBB
            const belongsToOSBB = await verifyVotingBelongsToOSBB(id, adminUserId);
            if (!belongsToOSBB) {
                return res.status(403).json({ 
                    error: 'Voting does not belong to your OSBB' 
                });
            }

            // Immutability check: Cannot modify if active or finished
            if (voting.status !== 'draft') {
                return res.status(403).json({ 
                    error: 'Cannot modify voting once it is active or finished. Parameters are immutable for security.' 
                });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (req.body.title !== undefined) {
                updates.push(`title = $${paramIndex++}`);
                values.push(req.body.title);
            }
            if (req.body.description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(req.body.description);
            }
            if (req.body.type !== undefined) {
                updates.push(`type = $${paramIndex++}`);
                values.push(req.body.type);
            }
            if (req.body.start_date !== undefined) {
                updates.push(`start_date = $${paramIndex++}`);
                values.push(req.body.start_date);
            }
            if (req.body.end_date !== undefined) {
                updates.push(`end_date = $${paramIndex++}`);
                values.push(req.body.end_date);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(id);
            const query = `UPDATE votings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
            
            const result = await db.query(query, values);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// POST /api/votings/:id/vote
router.post('/:id/vote', authenticate, async (req, res) => {
    const { id } = req.params;
    const { choice } = req.body; // 'for', 'against', 'abstain'
    const user_id = req.user.id;

    if (!['for', 'against', 'abstain'].includes(choice)) {
        return res.status(400).json({ error: 'Invalid choice' });
    }

    try {
        // Get user's OSBB ID
        let userOSBBId = null;
        const userResult = await db.query(
            'SELECT apartment_id FROM users WHERE id = $1',
            [user_id]
        );
        
        if (userResult.rows.length > 0 && userResult.rows[0].apartment_id) {
            const aptResult = await db.query(
                'SELECT osbb_id FROM apartments WHERE id = $1',
                [userResult.rows[0].apartment_id]
            );
            if (aptResult.rows.length > 0) {
                userOSBBId = aptResult.rows[0].osbb_id;
            }
        }
        
        // 1. Check Voting Status and OSBB
        const votingResult = await db.query('SELECT status, osbb_id FROM votings WHERE id = $1', [id]);
        if (votingResult.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const voting = votingResult.rows[0];
        
        // Verify voting belongs to user's OSBB (tenant isolation)
        if (userOSBBId && voting.osbb_id !== userOSBBId) {
            return res.status(403).json({ 
                error: 'Voting does not belong to your OSBB' 
            });
        }
        
        if (!userOSBBId) {
            return res.status(403).json({ 
                error: 'You are not associated with an OSBB' 
            });
        }
        
        if (voting.status !== 'active') return res.status(400).json({ error: 'Voting is closed' });

        // 2. Check Duplicate Vote
        const voteCheck = await db.query('SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2', [id, user_id]);
        if (voteCheck.rows.length > 0) return res.status(400).json({ error: 'Already voted' });

        // 3. Record Vote
        await db.query(
            'INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3)',
            [id, user_id, choice]
        );

        res.json({ message: 'Vote recorded' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/votings/:id/close (Admin Only) - To finish voting and calculate results
// Verifies voting belongs to admin's OSBB
router.patch('/:id/close', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const adminUserId = req.user.id;
        
        // Verify voting belongs to admin's OSBB
        const belongsToOSBB = await verifyVotingBelongsToOSBB(id, adminUserId);
        if (!belongsToOSBB) {
            return res.status(403).json({ 
                error: 'Voting does not belong to your OSBB' 
            });
        }
        
        // Get current voting status
        const votingCheck = await db.query('SELECT status FROM votings WHERE id = $1', [id]);
        if (votingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Voting not found' });
        }
        
        if (votingCheck.rows[0].status === 'finished') {
            return res.status(400).json({ error: 'Voting is already finished' });
        }
        
        const result = await db.query(
            'UPDATE votings SET status = \'finished\' WHERE id = $1 RETURNING *',
            [id]
        );
        
        // Get OSBB ID for logging
        const votingOSBBId = result.rows[0].osbb_id;
        
        // Log voting closure
        await logVoting.close(adminUserId, votingOSBBId, id, req);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
