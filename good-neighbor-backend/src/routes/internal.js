/**
 * Internal API Routes (SuperAdmin Only)
 * Provides system-wide management and monitoring capabilities
 */

const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate, requireSuperAdmin } = require('../middleware/authMiddleware');
const { logSuperAdmin } = require('../services/loggerService');
const path = require('path');
const fs = require('fs').promises;

// All internal routes require super_admin authentication
router.use(authenticate);
router.use(requireSuperAdmin);

/**
 * GET /api/internal/dashboard/stats
 * Get global ecosystem statistics
 */
router.get('/dashboard/stats', async (req, res) => {
    try {
        // Total OSBBs
        const osbbCount = await db.query(
            `SELECT COUNT(*) as count, 
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
             FROM osbb_organizations`
        );
        
        // Total users by role
        const userStats = await db.query(
            `SELECT role, COUNT(*) as count
             FROM users
             GROUP BY role`
        );
        
        // Total apartments
        const apartmentCount = await db.query('SELECT COUNT(*) as count FROM apartments');
        
        // Total votings
        const votingStats = await db.query(
            `SELECT COUNT(*) as total,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished_count
             FROM votings`
        );
        
        // Total votes cast
        const voteCount = await db.query('SELECT COUNT(*) as count FROM votes');
        
        // Total bills
        const billStats = await db.query(
            `SELECT COUNT(*) as total,
                    SUM(amount) as total_amount,
                    COUNT(DISTINCT month) as months_count
             FROM bills`
        );
        
        // Recent activity (last 7 days)
        const recentActivity = await db.query(
            `SELECT action_type, COUNT(*) as count
             FROM audit_logs
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY action_type
             ORDER BY count DESC
             LIMIT 10`
        );
        
        res.json({
            osbb: {
                total: parseInt(osbbCount.rows[0].count),
                active: parseInt(osbbCount.rows[0].active_count),
                pending: parseInt(osbbCount.rows[0].pending_count)
            },
            users: userStats.rows.reduce((acc, row) => {
                acc[row.role] = parseInt(row.count);
                return acc;
            }, {}),
            apartments: {
                total: parseInt(apartmentCount.rows[0].count)
            },
            votings: {
                total: parseInt(votingStats.rows[0].total),
                active: parseInt(votingStats.rows[0].active_count),
                finished: parseInt(votingStats.rows[0].finished_count)
            },
            votes: {
                total: parseInt(voteCount.rows[0].count)
            },
            bills: {
                total: parseInt(billStats.rows[0].total || 0),
                total_amount: parseFloat(billStats.rows[0].total_amount || 0),
                months_count: parseInt(billStats.rows[0].months_count || 0)
            },
            recent_activity: recentActivity.rows.map(row => ({
                action_type: row.action_type,
                count: parseInt(row.count)
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Помилка отримання статистики' });
    }
});

/**
 * GET /api/internal/registrations
 * List all OSBB registration requests (with filters)
 */
router.get('/registrations', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                r.id,
                r.edrpou,
                r.head_rnokpp,
                r.head_full_name,
                r.head_email,
                r.head_phone,
                r.protocol_path,
                r.status,
                r.created_at,
                r.updated_at,
                o.id as osbb_id,
                o.full_name as osbb_name,
                jsonb_build_object(
                    'city', o.address_city,
                    'street', o.address_street,
                    'building', o.address_building
                ) as address,
                o.status as osbb_status
            FROM osbb_registration_requests r
            LEFT JOIN osbb_organizations o ON r.osbb_id = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (status) {
            paramCount++;
            query += ` AND r.status = $${paramCount}`;
            params.push(status);
        }
        
        query += ` ORDER BY r.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Log super admin access
        await logSuperAdmin.action(
            req.user.id,
            'view_registrations',
            'osbb_registration',
            null,
            null,
            { status, limit, offset },
            req
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Помилка отримання заявок' });
    }
});

/**
 * GET /api/internal/registrations/:id
 * Get details of a specific registration request
 */
router.get('/registrations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT 
                r.*,
                o.id as osbb_id,
                o.full_name as osbb_name,
                jsonb_build_object(
                    'city', o.address_city,
                    'street', o.address_street,
                    'building', o.address_building
                ) as address,
                o.status as osbb_status
            FROM osbb_registration_requests r
            LEFT JOIN osbb_organizations o ON r.osbb_id = o.id
            WHERE r.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заявку не знайдено' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching registration:', error);
        res.status(500).json({ error: 'Помилка отримання заявки' });
    }
});

/**
 * GET /api/internal/registrations/:id/protocol
 * Download PDF protocol (safe file serving)
 */
router.get('/registrations/:id/protocol', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get registration request
        const regResult = await db.query(
            'SELECT protocol_path FROM osbb_registration_requests WHERE id = $1',
            [id]
        );
        
        if (regResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заявку не знайдено' });
        }
        
        const protocolPath = regResult.rows[0].protocol_path;
        if (!protocolPath) {
            return res.status(404).json({ error: 'Протокол не знайдено' });
        }
        
        // Construct safe file path (prevent directory traversal)
        const safePath = path.join(__dirname, '../../uploads/protocols', path.basename(protocolPath));
        
        // Verify file exists
        try {
            await fs.access(safePath);
        } catch {
            return res.status(404).json({ error: 'Файл протоколу не знайдено' });
        }
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="protocol_${id}.pdf"`);
        
        // Stream file
        const fileStream = require('fs').createReadStream(safePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving protocol:', error);
        res.status(500).json({ error: 'Помилка завантаження протоколу' });
    }
});

/**
 * PATCH /api/internal/registrations/:id/approve
 * Approve OSBB registration (super admin can approve any)
 */
router.patch('/registrations/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get registration request
        const regResult = await db.query(
            `SELECT * FROM osbb_registration_requests WHERE id = $1`,
            [id]
        );
        
        if (regResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заявку не знайдено' });
        }
        
        const registration = regResult.rows[0];
        
        if (registration.status !== 'pending') {
            return res.status(400).json({ error: 'Заявка вже оброблена' });
        }
        
        // Start transaction
        await db.query('BEGIN');
        
        try {
            // 1. Update OSBB organization status
            await db.query(
                `UPDATE osbb_organizations 
                 SET status = 'approved', approved_at = NOW(), approved_by = $1
                 WHERE id = $2`,
                [req.user.id, registration.osbb_id]
            );
            
            // 2. Create admin user account
            // Use the existing password_hash from registration (already hashed with Argon2)
            const userResult = await db.query(
                `INSERT INTO users (email, phone, password_hash, full_name, role, osbb_id)
                 VALUES ($1, $2, $3, $4, 'admin', $5)
                 RETURNING id`,
                [
                    registration.head_email,
                    registration.head_phone,
                    registration.password_hash, // Use the already-hashed password
                    registration.head_full_name,
                    registration.osbb_id
                ]
            );
            
            const userId = userResult.rows[0].id;
            
            // 3. Update registration request status
            await db.query(
                `UPDATE osbb_registration_requests 
                 SET status = 'approved', updated_at = NOW(), reviewed_at = NOW(), reviewed_by = $1, user_id = $2
                 WHERE id = $3`,
                [req.user.id, userId, id]
            );
            
            await db.query('COMMIT');
            
            // Log super admin approval
            await logSuperAdmin.action(
                req.user.id,
                'approve_registration',
                'osbb_registration',
                id,
                { status: 'pending' },
                { status: 'approved', user_id: userId },
                req
            );
            
            res.json({
                message: 'Registration approved successfully',
                user_id: userId
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error approving registration:', error);
        res.status(500).json({ error: 'Помилка схвалення заявки' });
    }
});

/**
 * PATCH /api/internal/registrations/:id/reject
 * Reject OSBB registration
 */
router.patch('/registrations/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        
        // Get registration request
        const regResult = await db.query(
            `SELECT * FROM osbb_registration_requests WHERE id = $1`,
            [id]
        );
        
        if (regResult.rows.length === 0) {
            return res.status(404).json({ error: 'Заявку не знайдено' });
        }
        
        const registration = regResult.rows[0];
        
        if (registration.status !== 'pending') {
            return res.status(400).json({ error: 'Заявка вже оброблена' });
        }
        
        // Update registration request status
        await db.query(
            `UPDATE osbb_registration_requests 
             SET status = 'rejected', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        
        // Update OSBB organization status
        await db.query(
            `UPDATE osbb_organizations 
             SET status = 'rejected'
             WHERE id = $1`,
            [registration.osbb_id]
        );
        
        // Log super admin rejection
        await logSuperAdmin.action(
            req.user.id,
            'reject_registration',
            'osbb_registration',
            id,
            { status: 'pending' },
            { status: 'rejected', rejection_reason: rejection_reason || 'Rejected by super admin' },
            req
        );
        
        res.json({
            message: 'Registration rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting registration:', error);
        res.status(500).json({ error: 'Помилка відхилення заявки' });
    }
});

/**
 * GET /api/internal/audit-logs
 * Get audit logs with filters
 */
router.get('/audit-logs', async (req, res) => {
    try {
        const {
            actor_id,
            osbb_id,
            action_type,
            entity_type,
            start_date,
            end_date,
            limit = 100,
            offset = 0
        } = req.query;
        
        let query = `
            SELECT 
                al.*,
                u.full_name as actor_name,
                u.role as actor_role,
                o.full_name as osbb_name
            FROM audit_logs al
            LEFT JOIN users u ON al.actor_id = u.id
            LEFT JOIN osbb_organizations o ON al.osbb_id = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (actor_id) {
            paramCount++;
            query += ` AND al.actor_id = $${paramCount}`;
            params.push(parseInt(actor_id));
        }
        
        if (osbb_id) {
            paramCount++;
            query += ` AND al.osbb_id = $${paramCount}`;
            params.push(parseInt(osbb_id));
        }
        
        if (action_type) {
            paramCount++;
            query += ` AND al.action_type = $${paramCount}`;
            params.push(action_type);
        }
        
        if (entity_type) {
            paramCount++;
            query += ` AND al.entity_type = $${paramCount}`;
            params.push(entity_type);
        }
        
        if (start_date) {
            paramCount++;
            query += ` AND al.created_at >= $${paramCount}`;
            params.push(start_date);
        }
        
        if (end_date) {
            paramCount++;
            query += ` AND al.created_at <= $${paramCount}`;
            params.push(end_date);
        }
        
        query += ` ORDER BY al.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Log super admin access to audit logs
        await logSuperAdmin.action(
            req.user.id,
            'view_audit_logs',
            'audit_log',
            null,
            null,
            { filters: req.query },
            req
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Помилка отримання журналу аудиту' });
    }
});

/**
 * GET /api/internal/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let dateFilter = '';
        const params = [];
        if (start_date && end_date) {
            dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
            params.push(start_date, end_date);
        }
        
        // Action type distribution
        const actionStats = await db.query(
            `SELECT action_type, COUNT(*) as count
             FROM audit_logs
             ${dateFilter}
             GROUP BY action_type
             ORDER BY count DESC`,
            params
        );
        
        // Entity type distribution
        const entityStats = await db.query(
            `SELECT entity_type, COUNT(*) as count
             FROM audit_logs
             ${dateFilter}
             WHERE entity_type IS NOT NULL
             GROUP BY entity_type
             ORDER BY count DESC`,
            params
        );
        
        // Activity over time (last 30 days)
        const timeSeries = await db.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
             FROM audit_logs
             WHERE created_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            []
        );
        
        res.json({
            action_types: actionStats.rows.map(row => ({
                action_type: row.action_type,
                count: parseInt(row.count)
            })),
            entity_types: entityStats.rows.map(row => ({
                entity_type: row.entity_type,
                count: parseInt(row.count)
            })),
            time_series: timeSeries.rows.map(row => ({
                date: row.date,
                count: parseInt(row.count)
            }))
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Помилка отримання статистики аудиту' });
    }
});

module.exports = router;

