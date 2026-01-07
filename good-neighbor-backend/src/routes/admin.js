const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { verifyApartmentBelongsToOSBB, getOSBBApartments, getAdminOSBBId } = require('../services/osbbService');
const { generateBillsForMonth } = require('../services/billingEngine');
const { logModeration, logVoting } = require('../services/loggerService');

// GET /api/admin/apartments
// List all apartments with their status (not_invited, invited, activated)
// Only shows apartments belonging to admin's OSBB
router.get('/apartments', authenticate, requireRole('admin'), async (req, res) => {
    try {
        // Get apartments for admin's OSBB only
        const osbbApartments = await getOSBBApartments(req.user.id);
        
        if (osbbApartments.length === 0) {
            return res.json({ apartments: [] });
        }
        
        const apartmentIds = osbbApartments.map(apt => apt.id);
        
        const result = await db.query(`
            SELECT 
                a.id,
                a.number,
                a.area,
                a.balance,
                u.id as user_id,
                u.full_name as owner,
                u.phone,
                u.email,
                CASE 
                    WHEN u.id IS NOT NULL THEN 'activated'
                    WHEN EXISTS (SELECT 1 FROM invitation_codes ic WHERE ic.apartment_id = a.id AND ic.is_used = false) THEN 'invited'
                    ELSE 'not_invited'
                END as status,
                (
                    SELECT json_agg(
                        json_build_object(
                            'code', ic.code,
                            'role', ic.role,
                            'is_used', ic.is_used,
                            'used_at', ic.used_at,
                            'created_at', ic.created_at
                        ) ORDER BY ic.created_at DESC
                    )
                    FROM invitation_codes ic
                    WHERE ic.apartment_id = a.id
                ) as invitation_codes
            FROM apartments a
            LEFT JOIN users u ON a.id = u.apartment_id
            WHERE a.id = ANY($1::int[]) AND a.number != 'ADMIN'
            ORDER BY a.number
        `, [apartmentIds]);
        
        res.json({ apartments: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/invitations/generate
// Generate a new invitation code for an apartment
// Verifies that apartment belongs to admin's OSBB
router.post('/invitations/generate',
    authenticate,
    requireRole('admin'),
    [
        body('apartment_id').isInt().withMessage('Apartment ID is required'),
        body('role').isIn(['owner', 'tenant']).withMessage('Role must be owner or tenant')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { apartment_id, role } = req.body;
        const adminUserId = req.user.id;

        try {
            // Verify apartment belongs to admin's OSBB
            const belongsToOSBB = await verifyApartmentBelongsToOSBB(apartment_id, adminUserId);
            if (!belongsToOSBB) {
                return res.status(403).json({ 
                    error: 'Apartment does not belong to your OSBB or you do not have an associated OSBB' 
                });
            }

            // Check if apartment exists
            const apartmentCheck = await db.query('SELECT number FROM apartments WHERE id = $1', [apartment_id]);
            if (apartmentCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Apartment not found' });
            }

            // Generate unique code (8 characters, hex)
            let code;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isUnique && attempts < maxAttempts) {
                code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
                const checkResult = await db.query('SELECT id FROM invitation_codes WHERE code = $1', [code]);
                isUnique = checkResult.rows.length === 0;
                attempts++;
            }
            
            if (!isUnique) {
                return res.status(500).json({ error: 'Failed to generate unique code' });
            }

            // Insert invitation code
            const result = await db.query(
                'INSERT INTO invitation_codes (code, apartment_id, role) VALUES ($1, $2, $3) RETURNING *',
                [code, apartment_id, role]
            );

            res.status(201).json({
                code: result.rows[0].code,
                apartment: apartmentCheck.rows[0].number,
                role: result.rows[0].role,
                created_at: result.rows[0].created_at
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// GET /api/admin/invitations
// List all invitation codes (used and unused) for admin's OSBB
router.get('/invitations', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const adminOSBBId = await getAdminOSBBId(req.user.id);
        
        if (!adminOSBBId) {
            return res.json({ invitations: [] });
        }
        
        const result = await db.query(`
            SELECT 
                ic.id,
                ic.code,
                ic.role,
                ic.is_used,
                ic.used_at,
                ic.created_at,
                a.number as apartment_number
            FROM invitation_codes ic
            JOIN apartments a ON ic.apartment_id = a.id
            WHERE a.osbb_id = $1
            ORDER BY ic.created_at DESC
        `, [adminOSBBId]);
        
        res.json({ invitations: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/registrations
// List all OSBB registration requests
router.get('/registrations', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const status = req.query.status || 'all'; // 'all', 'pending', 'approved', 'rejected'
        
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
                r.rejection_reason,
                r.created_at,
                r.reviewed_at,
                o.full_name as osbb_name,
                o.address_city,
                o.address_street,
                o.address_building,
                o.authorized_person,
                u.id as user_id,
                u.full_name as reviewer_name
            FROM osbb_registration_requests r
            JOIN osbb_organizations o ON r.osbb_id = o.id
            LEFT JOIN users u ON r.reviewed_by = u.id
        `;
        
        const params = [];
        if (status !== 'all') {
            query += ' WHERE r.status = $1';
            params.push(status);
        }
        
        query += ' ORDER BY r.created_at DESC';
        
        const result = await db.query(query, params);
        
        res.json({ registrations: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/registrations/:id
// Get details of a specific registration request
router.get('/registrations/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT 
                r.*,
                o.full_name as osbb_name,
                o.address_city,
                o.address_street,
                o.address_building,
                o.authorized_person,
                u.full_name as reviewer_name
            FROM osbb_registration_requests r
            JOIN osbb_organizations o ON r.osbb_id = o.id
            LEFT JOIN users u ON r.reviewed_by = u.id
            WHERE r.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registration request not found' });
        }
        
        res.json({ registration: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/registrations/:id/protocol
// Download the protocol PDF file
router.get('/registrations/:id/protocol', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'SELECT protocol_path FROM osbb_registration_requests WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registration request not found' });
        }
        
        const filePath = path.join(__dirname, '../../uploads', result.rows[0].protocol_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Protocol file not found' });
        }
        
        res.sendFile(filePath);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/registrations/:id/approve
// Approve a registration request and create user account
router.patch('/registrations/:id/approve',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;
            
            // Get registration request
            const regResult = await db.query(`
                SELECT * FROM osbb_registration_requests 
                WHERE id = $1 AND status = 'pending'
            `, [id]);
            
            if (regResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Registration request not found or already processed' 
                });
            }
            
            const registration = regResult.rows[0];
            
            // Check if email or phone already exists
            const existingUser = await db.query(
                'SELECT id FROM users WHERE email = $1 OR phone = $2',
                [registration.head_email, registration.head_phone]
            );
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'User with this email or phone already exists' 
                });
            }
            
            // Start transaction: Create user account and update registration
            await db.query('BEGIN');
            
            try {
                // Create user account (admin role for OSBB Head)
                const userResult = await db.query(
                    `INSERT INTO users (phone, email, password_hash, full_name, role, apartment_id, osbb_id)
                     VALUES ($1, $2, $3, $4, 'admin', NULL, $5)
                     RETURNING id`,
                    [
                        registration.head_phone,
                        registration.head_email,
                        registration.password_hash, // Already hashed with Argon2
                        registration.head_full_name,
                        registration.osbb_id
                    ]
                );
                
                const userId = userResult.rows[0].id;
                
                // Update registration request
                await db.query(
                    `UPDATE osbb_registration_requests 
                     SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1, user_id = $2
                     WHERE id = $3`,
                    [adminId, userId, id]
                );
                
                // Update OSBB organization status
                await db.query(
                    `UPDATE osbb_organizations 
                     SET status = 'approved', approved_at = NOW(), approved_by = $1
                     WHERE id = $2`,
                    [adminId, registration.osbb_id]
                );
                
                await db.query('COMMIT');
                
                // Log approval action
                await logModeration.approveRegistration(
                    adminId,
                    id,
                    registration.osbb_id,
                    userId,
                    req
                );
                
                res.json({
                    message: 'Registration approved successfully',
                    user_id: userId
                });
            } catch (err) {
                await db.query('ROLLBACK');
                throw err;
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// PATCH /api/admin/registrations/:id/reject
// Reject a registration request
router.patch('/registrations/:id/reject',
    authenticate,
    requireRole('admin'),
    [
        body('rejection_reason').optional().isString()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
            const { id } = req.params;
            const { rejection_reason } = req.body;
            const adminId = req.user.id;
            
            // Get registration request
            const regResult = await db.query(`
                SELECT * FROM osbb_registration_requests 
                WHERE id = $1 AND status = 'pending'
            `, [id]);
            
            if (regResult.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Registration request not found or already processed' 
                });
            }
            
            const registration = regResult.rows[0];
            
            // Update registration request
            await db.query(
                `UPDATE osbb_registration_requests 
                 SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW(), reviewed_by = $2
                 WHERE id = $3`,
                [rejection_reason || 'Rejected by administrator', adminId, id]
            );
            
            // Update OSBB organization status
            await db.query(
                `UPDATE osbb_organizations 
                 SET status = 'rejected'
                 WHERE id = $1`,
                [registration.osbb_id]
            );
            
            // Log rejection action
            await logModeration.rejectRegistration(
                adminId,
                id,
                registration.osbb_id,
                rejection_reason || 'Rejected by administrator',
                req
            );
            
            res.json({
                message: 'Registration rejected successfully'
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// POST /api/admin/billing/generate
// Generate bills for a specific month (Admin only)
router.post('/billing/generate',
    authenticate,
    requireRole('admin'),
    [
        body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in format YYYY-MM'),
        body('service_amounts').optional().isObject()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { month, service_amounts } = req.body;
        const adminUserId = req.user.id;

        try {
            const adminOSBBId = await getAdminOSBBId(adminUserId);
            if (!adminOSBBId) {
                return res.status(403).json({ 
                    error: 'You must be associated with an OSBB to generate bills' 
                });
            }

            const monthDate = new Date(month + '-01');
            const result = await generateBillsForMonth(adminOSBBId, monthDate, service_amounts || {});

            if (result.success) {
                res.json({
                    message: 'Bills generated successfully',
                    ...result
                });
            } else {
                res.status(400).json({
                    error: result.error || 'Failed to generate bills',
                    ...result
                });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

module.exports = router;
