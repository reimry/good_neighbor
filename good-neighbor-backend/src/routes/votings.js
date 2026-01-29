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
        
        // Check if osbb_id column exists
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'votings' AND column_name = 'osbb_id'
        `);
        const hasOsbbId = columnCheck.rows.length > 0;
        
        // Filter by OSBB if available, otherwise return empty (tenant isolation)
        let query = 'SELECT * FROM votings';
        const params = [];
        
        if (hasOsbbId && osbbId) {
            query += ' WHERE osbb_id = $1';
            params.push(osbbId);
        } else if (!hasOsbbId) {
            // If osbb_id column doesn't exist, return all votings (legacy behavior)
            // This maintains backward compatibility
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
        
        // 2. Check if osbb_id column exists
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'votings' AND column_name = 'osbb_id'
        `);
        const hasOsbbId = columnCheck.rows.length > 0;
        
        // 3. Verify voting belongs to user's OSBB (tenant isolation) - only if osbb_id column exists
        if (hasOsbbId) {
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
            // Check if osbb_id exists in voting
            const votingOsbbId = voting.osbb_id || userOSBBId;
            
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
                    WHERE v.voting_id = $1 ${votingOsbbId ? 'AND a.osbb_id = $2' : ''}
                    GROUP BY v.choice
                `, votingOsbbId ? [id, votingOsbbId] : [id]);
                
                // Get total possible area (sum of all apartments in this OSBB)
                // Exclude ADMIN apartments and ensure we only count valid apartments
                const totalAreaQuery = votingOsbbId 
                    ? 'SELECT SUM(area) as total FROM apartments WHERE osbb_id = $1 AND number != \'ADMIN\' AND area > 0'
                    : 'SELECT SUM(area) as total FROM apartments WHERE number != \'ADMIN\' AND area > 0';
                const totalAreaResult = await db.query(
                    totalAreaQuery,
                    votingOsbbId ? [votingOsbbId] : []
                );
                const totalPossibleWeight = parseFloat(totalAreaResult.rows[0]?.total) || 1;
                
                // Safety check: ensure totalPossibleWeight is positive
                if (totalPossibleWeight <= 0) {
                    console.warn(`Invalid totalPossibleWeight for voting ${id}: ${totalPossibleWeight}`);
                }
                
                // Calculate percentages for each choice
                // Cap at 100% to prevent invalid percentages
                const statsWithPercentages = legalStats.rows.map(stat => {
                    const weight = parseFloat(stat.total_weight) || 0;
                    const percentage = totalPossibleWeight > 0 
                        ? Math.min(((weight / totalPossibleWeight) * 100), 100).toFixed(2)
                        : 0;
                    return {
                        choice: stat.choice,
                        total_weight: weight,
                        voter_count: parseInt(stat.voter_count) || 0,
                        percentage: parseFloat(percentage)
                    };
                });

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
                const votingOsbbId = voting.osbb_id || userOSBBId;
                const totalUsersQuery = votingOsbbId
                    ? `SELECT COUNT(DISTINCT u.id) as count 
                       FROM users u
                       JOIN apartments a ON u.apartment_id = a.id
                       WHERE a.osbb_id = $1 AND u.role IN ('owner', 'tenant')`
                    : `SELECT COUNT(DISTINCT u.id) as count 
                       FROM users u
                       JOIN apartments a ON u.apartment_id = a.id
                       WHERE u.role IN ('owner', 'tenant')`;
                const totalUsersResult = await db.query(
                    totalUsersQuery,
                    votingOsbbId ? [votingOsbbId] : []
                );
                
                const totalPossible = parseInt(totalUsersResult.rows[0]?.count) || 1;
                const totalVoted = simpleStats.rows.reduce((sum, s) => sum + parseInt(s.count || 0), 0);
                
                // Calculate percentages
                // Cap at 100% to prevent invalid percentages
                const statsWithPercentages = simpleStats.rows.map(stat => {
                    const count = parseInt(stat.count) || 0;
                    const percentage = totalPossible > 0 
                        ? Math.min(((count / totalPossible) * 100), 100).toFixed(2)
                        : 0;
                    return {
                        choice: stat.choice,
                        count: count,
                        percentage: parseFloat(percentage)
                    };
                });
                
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
            // Check if osbb_id column exists in votings table
            const columnCheck = await db.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'votings' AND column_name = 'osbb_id'
            `);
            const hasOsbbId = columnCheck.rows.length > 0;
            
            let result;
            if (hasOsbbId) {
                result = await db.query(
                    'INSERT INTO votings (title, description, type, start_date, end_date, status, created_by, osbb_id) VALUES ($1, $2, $3, $4, $5, \'active\', $6, $7) RETURNING *',
                    [title, description, type, start_date, end_date, created_by, adminOSBBId]
                );
            } else {
                result = await db.query(
                    'INSERT INTO votings (title, description, type, start_date, end_date, status, created_by) VALUES ($1, $2, $3, $4, $5, \'active\', $6) RETURNING *',
                    [title, description, type, start_date, end_date, created_by]
                );
            }
            
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

    console.log('Vote request received:', { voting_id: id, user_id, choice });

    if (!['for', 'against', 'abstain'].includes(choice)) {
        return res.status(400).json({ error: 'Invalid choice' });
    }

    try {
        console.log('Step 1: Getting user OSBB ID...');
        // Get user's OSBB ID - check both apartment_id (for residents) and osbb_id (for admins)
        let userOSBBId = null;
        const userResult = await db.query(
            'SELECT apartment_id, osbb_id, role FROM users WHERE id = $1',
            [user_id]
        );
        console.log('User query result:', userResult.rows[0]);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            
            // For admins, use osbb_id directly
            if (user.role === 'admin' && user.osbb_id) {
                userOSBBId = user.osbb_id;
                console.log('Admin OSBB ID from user table:', userOSBBId);
            } 
            // For residents, get osbb_id from apartment
            else if (user.apartment_id) {
                console.log('Getting OSBB from apartment:', user.apartment_id);
                const aptResult = await db.query(
                    'SELECT osbb_id FROM apartments WHERE id = $1',
                    [user.apartment_id]
                );
                if (aptResult.rows.length > 0) {
                    userOSBBId = aptResult.rows[0].osbb_id;
                    console.log('OSBB ID from apartment:', userOSBBId);
                }
            }
            
            // Fallback: Try to get OSBB ID for admin from service
            if (!userOSBBId && user.role === 'admin') {
                console.log('Trying getAdminOSBBId service...');
                const { getAdminOSBBId } = require('../services/osbbService');
                userOSBBId = await getAdminOSBBId(user_id);
                console.log('OSBB ID from service:', userOSBBId);
            }
        }
        
        console.log('Step 2: Checking osbb_id column existence...');
        // First check if osbb_id column exists
        let hasOsbbId = false;
        try {
            const columnCheck = await db.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'votings' AND column_name = 'osbb_id'
            `);
            hasOsbbId = columnCheck.rows.length > 0;
            console.log('osbb_id column exists:', hasOsbbId);
        } catch (colErr) {
            console.error('Error checking osbb_id column:', colErr);
            hasOsbbId = false;
        }
        
        console.log('Step 3: Checking voting status...');
        // 1. Check Voting Status and OSBB - only select osbb_id if column exists
        const votingQuery = hasOsbbId 
            ? 'SELECT status, osbb_id FROM votings WHERE id = $1'
            : 'SELECT status FROM votings WHERE id = $1';
        const votingResult = await db.query(votingQuery, [id]);
        
        if (votingResult.rows.length === 0) {
            console.log('Voting not found:', id);
            return res.status(404).json({ error: 'Not found' });
        }
        
        const voting = votingResult.rows[0];
        const votingOsbbId = hasOsbbId ? (voting.osbb_id || null) : null;
        console.log('Voting found:', { status: voting.status, osbb_id: votingOsbbId });
        
        console.log('Step 4: Validating OSBB match...');
        // Only enforce OSBB check if both voting and user have OSBB IDs
        // For backward compatibility: if voting has no osbb_id, allow voting
        if (hasOsbbId && votingOsbbId !== null && votingOsbbId !== undefined) {
            if (userOSBBId) {
                // User has OSBB - must match voting's OSBB
                if (votingOsbbId !== userOSBBId) {
                    console.log('OSBB mismatch:', { voting_osbb: votingOsbbId, user_osbb: userOSBBId });
                    return res.status(403).json({ 
                        error: 'Voting does not belong to your OSBB' 
                    });
                }
                console.log('OSBB match confirmed');
            } else {
                // Voting has OSBB but user doesn't - reject
                console.log('User has no OSBB but voting requires one');
                return res.status(403).json({ 
                    error: 'You are not associated with an OSBB. Please contact administrator.' 
                });
            }
        } else {
            console.log('Skipping OSBB check (legacy voting or no osbb_id column)');
        }
        // If voting has no osbb_id (legacy), allow voting regardless of user's OSBB status
        
        console.log('Step 5: Checking voting status...');
        if (voting.status !== 'active') {
            console.log('Voting is not active:', voting.status);
            return res.status(400).json({ error: 'Voting is closed' });
        }

        console.log('Step 6: Checking for duplicate vote...');
        // 2. Check Duplicate Vote
        const voteCheck = await db.query('SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2', [id, user_id]);
        if (voteCheck.rows.length > 0) {
            console.log('User already voted');
            return res.status(400).json({ error: 'Already voted' });
        }
        console.log('No duplicate vote found');

        // 3. Record Vote
        try {
            const insertResult = await db.query(
                'INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3) RETURNING id',
                [id, user_id, choice]
            );
            console.log('Vote recorded successfully:', insertResult.rows[0]);
        } catch (dbErr) {
            console.error('Database error in vote endpoint:', {
                code: dbErr.code,
                message: dbErr.message,
                detail: dbErr.detail,
                constraint: dbErr.constraint,
                voting_id: id,
                user_id: user_id,
                choice: choice
            });
            
            // Handle database constraint errors
            if (dbErr.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'You have already voted in this voting' });
            }
            if (dbErr.code === '23503') { // Foreign key violation
                return res.status(400).json({ 
                    error: 'Invalid voting or user',
                    details: process.env.NODE_ENV === 'development' ? dbErr.detail : undefined
                });
            }
            // Re-throw to be caught by outer catch
            throw dbErr;
        }

        console.log('Vote recorded successfully for voting:', id, 'user:', user_id, 'choice:', choice);
        res.json({ message: 'Vote recorded' });

    } catch (err) {
        console.error('=== VOTE ENDPOINT ERROR ===');
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Error detail:', err.detail);
        console.error('Error constraint:', err.constraint);
        console.error('Error stack:', err.stack);
        console.error('Request params:', { voting_id: id, user_id, choice });
        console.error('==========================');
        
        // Return detailed error in development, generic in production
        const errorResponse = {
            error: 'Server error while recording vote',
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                code: err.code,
                constraint: err.constraint
            })
        };
        
        res.status(500).json(errorResponse);
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

// DELETE /api/votings/:id (Admin Only)
// Delete voting - allowed even if votes have been cast (for cleanup/admin purposes)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
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
        
        // Check if any votes have been cast (for warning/info, not blocking)
        const voteCount = await db.query('SELECT COUNT(*) as count FROM votes WHERE voting_id = $1', [id]);
        const hasVotes = parseInt(voteCount.rows[0].count) > 0;
        
        if (hasVotes) {
            // Delete all votes first (CASCADE should handle this, but explicit is safer)
            await db.query('DELETE FROM votes WHERE voting_id = $1', [id]);
        }
        
        // Delete voting
        await db.query('DELETE FROM votings WHERE id = $1', [id]);
        
        res.json({ 
            message: 'Voting deleted successfully',
            votes_deleted: hasVotes ? parseInt(voteCount.rows[0].count) : 0
        });
    } catch (err) {
        console.error('Error deleting voting:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
