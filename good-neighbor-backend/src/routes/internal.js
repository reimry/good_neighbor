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
const argon2 = require('argon2');

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
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as active_count,
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

/**
 * ============================================
 * DATABASE ADMINISTRATION ROUTES
 * ============================================
 * These routes provide full CRUD access to database entities
 * for superadmins to manage the ecosystem
 */

/**
 * GET /api/internal/db/users
 * List all users with filters and pagination
 */
router.get('/db/users', async (req, res) => {
    try {
        const { role, osbb_id, search, limit = 50, offset = 0, superadmins_only } = req.query;
        
        // Check if email column exists
        const emailCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        `);
        const hasEmail = emailCheck.rows.length > 0;
        
        let query = `
            SELECT 
                u.id,
                u.login_id,
                u.phone,
                ${hasEmail ? 'u.email,' : 'NULL as email,'}
                u.full_name,
                u.role,
                u.apartment_id,
                u.osbb_id,
                u.password_hash,
                u.created_at,
                a.number as apartment_number,
                a.area as apartment_area,
                o.full_name as osbb_name
            FROM users u
            LEFT JOIN apartments a ON u.apartment_id = a.id
            LEFT JOIN osbb_organizations o ON u.osbb_id = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (role) {
            paramCount++;
            query += ` AND u.role = $${paramCount}`;
            params.push(role);
        }
        
        if (superadmins_only === 'true') {
            // Only show superadmins
            query += ` AND u.role = 'super_admin'`;
        } else if (osbb_id) {
            paramCount++;
            query += ` AND u.osbb_id = $${paramCount} AND u.role != 'super_admin'`;
            params.push(parseInt(osbb_id));
        } else {
            // When not filtering by OSBB, exclude superadmins from regular users list
            // (they will be shown in a separate tab)
            query += ` AND u.role != 'super_admin'`;
        }
        
        if (search) {
            paramCount++;
            if (hasEmail) {
                query += ` AND (
                    u.full_name ILIKE $${paramCount} OR 
                    u.phone ILIKE $${paramCount} OR 
                    u.email ILIKE $${paramCount} OR
                    u.login_id ILIKE $${paramCount}
                )`;
            } else {
                query += ` AND (
                    u.full_name ILIKE $${paramCount} OR 
                    u.phone ILIKE $${paramCount} OR
                    u.login_id ILIKE $${paramCount}
                )`;
            }
            params.push(`%${search}%`);
        }
        
        // Sort by role hierarchy when filtering by OSBB, otherwise by created_at
        if (superadmins_only === 'true') {
            query += ` ORDER BY u.created_at DESC`;
        } else if (osbb_id) {
            // Role hierarchy: admin > owner > tenant
            query += ` ORDER BY 
                CASE u.role 
                    WHEN 'admin' THEN 1
                    WHEN 'owner' THEN 2
                    WHEN 'tenant' THEN 3
                    ELSE 4
                END ASC,
                u.full_name ASC`;
        } else {
            query += ` ORDER BY u.created_at DESC`;
        }
        
        query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM users u
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;
        
        if (role) {
            countParamCount++;
            countQuery += ` AND u.role = $${countParamCount}`;
            countParams.push(role);
        }
        if (superadmins_only === 'true') {
            countQuery += ` AND u.role = 'super_admin'`;
        } else if (osbb_id) {
            countParamCount++;
            countQuery += ` AND u.osbb_id = $${countParamCount} AND u.role != 'super_admin'`;
            countParams.push(parseInt(osbb_id));
        } else {
            // Exclude superadmins from count when not filtering by OSBB
            countQuery += ` AND u.role != 'super_admin'`;
        }
        if (search) {
            countParamCount++;
            if (hasEmail) {
                countQuery += ` AND (
                    u.full_name ILIKE $${countParamCount} OR 
                    u.phone ILIKE $${countParamCount} OR 
                    u.email ILIKE $${countParamCount} OR
                    u.login_id ILIKE $${countParamCount}
                )`;
            } else {
                countQuery += ` AND (
                    u.full_name ILIKE $${countParamCount} OR 
                    u.phone ILIKE $${countParamCount} OR
                    u.login_id ILIKE $${countParamCount}
                )`;
            }
            countParams.push(`%${search}%`);
        }
        
        const countResult = await db.query(countQuery, countParams);
        
        await logSuperAdmin.action(
            req.user.id,
            'view_users',
            'user',
            null,
            null,
            { filters: req.query },
            req
        );
        
        res.json({
            users: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Помилка отримання користувачів' });
    }
});

/**
 * GET /api/internal/db/users/:id
 * Get user details
 */
router.get('/db/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT 
                u.*,
                a.number as apartment_number,
                a.area as apartment_area,
                a.balance as apartment_balance,
                o.full_name as osbb_name,
                o.edrpou as osbb_edrpou
            FROM users u
            LEFT JOIN apartments a ON u.apartment_id = a.id
            LEFT JOIN osbb_organizations o ON u.osbb_id = o.id
            WHERE u.id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Помилка отримання користувача' });
    }
});

/**
 * PATCH /api/internal/db/users/:id
 * Update user information
 */
router.patch('/db/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, email, role, apartment_id, osbb_id } = req.body;
        
        // Get current user data for audit log
        const currentUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }
        
        const oldData = currentUser.rows[0];
        
        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 0;
        
        if (full_name !== undefined) {
            paramCount++;
            updates.push(`full_name = $${paramCount}`);
            params.push(full_name);
        }
        if (phone !== undefined) {
            // Validate phone format if provided
            if (phone && !/^\+380\d{9}$/.test(phone)) {
                return res.status(400).json({ error: 'Телефон має бути у форматі +380XXXXXXXXX' });
            }
            // Check for duplicate phone
            if (phone) {
                const duplicateCheck = await db.query(
                    'SELECT id FROM users WHERE phone = $1 AND id != $2',
                    [phone, id]
                );
                if (duplicateCheck.rows.length > 0) {
                    return res.status(400).json({ error: 'Користувач з таким телефоном вже існує' });
                }
            }
            paramCount++;
            updates.push(`phone = $${paramCount}`);
            params.push(phone);
        }
        if (email !== undefined) {
            // Validate email format if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ error: 'Невірний формат email' });
            }
            // Check for duplicate email
            if (email) {
                const duplicateCheck = await db.query(
                    'SELECT id FROM users WHERE email = $1 AND id != $2',
                    [email, id]
                );
                if (duplicateCheck.rows.length > 0) {
                    return res.status(400).json({ error: 'Користувач з таким email вже існує' });
                }
            }
            paramCount++;
            updates.push(`email = $${paramCount}`);
            params.push(email);
        }
        if (role !== undefined) {
            // Validate role
            if (!['admin', 'owner', 'tenant', 'super_admin'].includes(role)) {
                return res.status(400).json({ error: 'Невірна роль' });
            }
            paramCount++;
            updates.push(`role = $${paramCount}`);
            params.push(role);
        }
        if (apartment_id !== undefined) {
            paramCount++;
            updates.push(`apartment_id = $${paramCount}`);
            params.push(apartment_id);
        }
        if (osbb_id !== undefined) {
            // Super admins must have osbb_id = NULL
            if (role === 'super_admin' && osbb_id !== null) {
                return res.status(400).json({ error: 'Супер-адміністратор не може мати OSBB' });
            }
            paramCount++;
            updates.push(`osbb_id = $${paramCount}`);
            params.push(osbb_id);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Немає даних для оновлення' });
        }
        
        paramCount++;
        updates.push(`updated_at = NOW()`);
        params.push(id);
        
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await db.query(query, params);
        
        const newData = result.rows[0];
        
        // Log the update
        await logSuperAdmin.action(
            req.user.id,
            'update_user',
            'user',
            id,
            { full_name: oldData.full_name, role: oldData.role, phone: oldData.phone, email: oldData.email },
            { full_name: newData.full_name, role: newData.role, phone: newData.phone, email: newData.email },
            req
        );
        
        // Don't return password_hash
        delete newData.password_hash;
        
        res.json(newData);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Помилка оновлення користувача' });
    }
});

/**
 * PATCH /api/internal/db/users/:id/password
 * Reset user password (SuperAdmin only)
 */
router.patch('/db/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: 'Пароль має бути мінімум 6 символів' });
        }
        
        // Get current user data
        const currentUser = await db.query('SELECT id, full_name, role FROM users WHERE id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }
        
        const user = currentUser.rows[0];
        
        // Hash new password with Argon2
        const passwordHash = await argon2.hash(new_password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        });
        
        // Update password
        await db.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, id]
        );
        
        // Log the password reset
        await logSuperAdmin.action(
            req.user.id,
            'reset_user_password',
            'user',
            id,
            { user_name: user.full_name, user_role: user.role },
            { password_reset: true },
            req
        );
        
        res.json({ 
            message: 'Пароль успішно змінено',
            success: true
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Помилка зміни пароля' });
    }
});

/**
 * DELETE /api/internal/db/users/:id
 * Delete user (soft delete or hard delete)
 */
router.delete('/db/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user data for audit log
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }
        
        const user = userResult.rows[0];
        
        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Не можна видалити власний акаунт' });
        }
        
        // Delete user
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        
        // Log the deletion
        await logSuperAdmin.action(
            req.user.id,
            'delete_user',
            'user',
            id,
            { full_name: user.full_name, role: user.role },
            null,
            req
        );
        
        res.json({ message: 'Користувача видалено успішно' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Помилка видалення користувача' });
    }
});

/**
 * GET /api/internal/db/organizations
 * List all OSBB organizations
 */
router.get('/db/organizations', async (req, res) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                o.*,
                COUNT(DISTINCT u.id) as user_count,
                COUNT(DISTINCT a.id) as apartment_count
            FROM osbb_organizations o
            LEFT JOIN users u ON u.osbb_id = o.id
            LEFT JOIN apartments a ON a.osbb_id = o.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (status) {
            paramCount++;
            query += ` AND o.status = $${paramCount}`;
            params.push(status);
        }
        
        if (search) {
            paramCount++;
            query += ` AND (
                o.full_name ILIKE $${paramCount} OR 
                o.edrpou ILIKE $${paramCount} OR
                o.authorized_person ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
        }
        
        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM osbb_organizations WHERE 1=1`;
        const countParams = [];
        let countParamCount = 0;
        
        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }
        if (search) {
            countParamCount++;
            countQuery += ` AND (
                full_name ILIKE $${countParamCount} OR 
                edrpou ILIKE $${countParamCount} OR
                authorized_person ILIKE $${countParamCount}
            )`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await db.query(countQuery, countParams);
        
        await logSuperAdmin.action(
            req.user.id,
            'view_organizations',
            'osbb_organization',
            null,
            null,
            { filters: req.query },
            req
        );
        
        res.json({
            organizations: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Помилка отримання організацій' });
    }
});

/**
 * GET /api/internal/db/organizations/:id
 * Get organization details
 */
router.get('/db/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if votings table has osbb_id column
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'votings' AND column_name = 'osbb_id'
        `);
        const votingsHasOsbb = columnCheck.rows.length > 0;
        
        let query;
        if (votingsHasOsbb) {
            query = `
                SELECT 
                    o.*,
                    COUNT(DISTINCT u.id) as user_count,
                    COUNT(DISTINCT a.id) as apartment_count,
                    COUNT(DISTINCT v.id) as voting_count
                FROM osbb_organizations o
                LEFT JOIN users u ON u.osbb_id = o.id
                LEFT JOIN apartments a ON a.osbb_id = o.id
                LEFT JOIN votings v ON v.osbb_id = o.id
                WHERE o.id = $1
                GROUP BY o.id
            `;
        } else {
            query = `
                SELECT 
                    o.*,
                    COUNT(DISTINCT u.id) as user_count,
                    COUNT(DISTINCT a.id) as apartment_count,
                    0 as voting_count
                FROM osbb_organizations o
                LEFT JOIN users u ON u.osbb_id = o.id
                LEFT JOIN apartments a ON a.osbb_id = o.id
                WHERE o.id = $1
                GROUP BY o.id
            `;
        }
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Організацію не знайдено' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Помилка отримання організації' });
    }
});

/**
 * PATCH /api/internal/db/organizations/:id
 * Update organization
 */
router.patch('/db/organizations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, edrpou, address_city, address_street, address_building, authorized_person, status } = req.body;
        
        // Get current data
        const currentOrg = await db.query('SELECT * FROM osbb_organizations WHERE id = $1', [id]);
        if (currentOrg.rows.length === 0) {
            return res.status(404).json({ error: 'Організацію не знайдено' });
        }
        
        const oldData = currentOrg.rows[0];
        
        // Build update query
        const updates = [];
        const params = [];
        let paramCount = 0;
        
        if (full_name !== undefined) {
            paramCount++;
            updates.push(`full_name = $${paramCount}`);
            params.push(full_name);
        }
        if (edrpou !== undefined) {
            // Validate EDRPOU format (8 digits)
            if (!/^\d{8}$/.test(edrpou)) {
                return res.status(400).json({ error: 'ЄДРПОУ має містити 8 цифр' });
            }
            // Check for duplicate EDRPOU
            const duplicateCheck = await db.query(
                'SELECT id FROM osbb_organizations WHERE edrpou = $1 AND id != $2',
                [edrpou, id]
            );
            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Організація з таким ЄДРПОУ вже існує' });
            }
            paramCount++;
            updates.push(`edrpou = $${paramCount}`);
            params.push(edrpou);
        }
        if (address_city !== undefined) {
            paramCount++;
            updates.push(`address_city = $${paramCount}`);
            params.push(address_city);
        }
        if (address_street !== undefined) {
            paramCount++;
            updates.push(`address_street = $${paramCount}`);
            params.push(address_street);
        }
        if (address_building !== undefined) {
            paramCount++;
            updates.push(`address_building = $${paramCount}`);
            params.push(address_building);
        }
        if (authorized_person !== undefined) {
            paramCount++;
            updates.push(`authorized_person = $${paramCount}`);
            params.push(authorized_person);
        }
        if (status !== undefined) {
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Невірний статус' });
            }
            paramCount++;
            updates.push(`status = $${paramCount}`);
            params.push(status);
            if (status === 'approved') {
                paramCount++;
                updates.push(`approved_at = NOW()`);
                paramCount++;
                updates.push(`approved_by = $${paramCount}`);
                params.push(req.user.id);
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Немає даних для оновлення' });
        }
        
        paramCount++;
        params.push(id);
        
        const query = `UPDATE osbb_organizations SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await db.query(query, params);
        
        const newData = result.rows[0];
        
        // Log the update
        await logSuperAdmin.action(
            req.user.id,
            'update_organization',
            'osbb_organization',
            id,
            { full_name: oldData.full_name, status: oldData.status },
            { full_name: newData.full_name, status: newData.status },
            req
        );
        
        res.json(newData);
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Помилка оновлення організації' });
    }
});

/**
 * GET /api/internal/db/apartments
 * List all apartments
 */
router.get('/db/apartments', async (req, res) => {
    try {
        const { osbb_id, search, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                a.id,
                a.number,
                a.area,
                a.balance,
                a.osbb_id,
                a.created_at,
                o.full_name as osbb_name,
                COUNT(DISTINCT u.id) as resident_count
            FROM apartments a
            LEFT JOIN osbb_organizations o ON a.osbb_id = o.id
            LEFT JOIN users u ON u.apartment_id = a.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (osbb_id) {
            paramCount++;
            query += ` AND a.osbb_id = $${paramCount}`;
            params.push(parseInt(osbb_id));
        }
        
        if (search) {
            paramCount++;
            query += ` AND (
                a.number ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
        }
        
        query += ` GROUP BY a.id, a.number, a.area, a.balance, a.osbb_id, a.created_at, o.full_name ORDER BY a.number ASC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM apartments WHERE 1=1`;
        const countParams = [];
        let countParamCount = 0;
        
        if (osbb_id) {
            countParamCount++;
            countQuery += ` AND osbb_id = $${countParamCount}`;
            countParams.push(parseInt(osbb_id));
        }
        if (search) {
            countParamCount++;
            countQuery += ` AND number ILIKE $${countParamCount}`;
            countParams.push(`%${search}%`);
        }
        
        const countResult = await db.query(countQuery, countParams);
        
        res.json({
            apartments: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching apartments:', error);
        res.status(500).json({ error: 'Помилка отримання квартир' });
    }
});

module.exports = router;

