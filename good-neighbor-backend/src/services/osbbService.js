/**
 * OSBB Service
 * Helper functions for OSBB-related operations and security checks
 */

const db = require('../db/connection');

/**
 * Get the OSBB ID for an admin user
 * @param {number} userId - User ID
 * @returns {Promise<number|null>} OSBB ID or null if not found
 */
async function getAdminOSBBId(userId) {
    try {
        console.log('Getting OSBB ID for admin user:', userId);
        
        // First, try to get from users.osbb_id (direct link)
        const userResult = await db.query(
            'SELECT osbb_id, role FROM users WHERE id = $1',
            [userId]
        );
        
        console.log('User query result:', userResult.rows);
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            if (user.role === 'admin' && user.osbb_id) {
                console.log('Found OSBB ID from users table:', user.osbb_id);
                return user.osbb_id;
            }
        }
        
        // Fallback: Get from registration request via user_id or email/phone match
        // Check if registration_requests has user_id column
        const user_id_column_check = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'osbb_registration_requests' AND column_name = 'user_id'
        `);
        const hasUserIdColumn = user_id_column_check.rows.length > 0;
        
        if (hasUserIdColumn) {
            // Try direct user_id match first
            const regResultById = await db.query(
                `SELECT osbb_id FROM osbb_registration_requests 
                 WHERE user_id = $1 AND status = 'approved'`,
                [userId]
            );
            
            if (regResultById.rows.length > 0) {
                console.log('Found OSBB ID from registration (user_id):', regResultById.rows[0].osbb_id);
                return regResultById.rows[0].osbb_id;
            }
        }
        
        // Fallback: Get from registration request via email/phone match
        // Check if email column exists first
        const emailColumnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        `);
        const hasEmailColumn = emailColumnCheck.rows.length > 0;
        
        // Get user's email/phone
        const userQuery = hasEmailColumn
            ? 'SELECT email, phone FROM users WHERE id = $1'
            : 'SELECT phone FROM users WHERE id = $1';
        const userInfo = await db.query(userQuery, [userId]);
        
        if (userInfo.rows.length > 0) {
            const user = userInfo.rows[0];
            const userEmail = hasEmailColumn ? (user.email || null) : null;
            const userPhone = user.phone || null;
            
            if (userEmail || userPhone) {
                const regResult = await db.query(
                    `SELECT osbb_id FROM osbb_registration_requests 
                     WHERE status = 'approved' 
                       AND (
                         ${userEmail ? '(head_email IS NOT NULL AND head_email = $1)' : 'FALSE'}
                         ${userEmail && userPhone ? ' OR ' : ''}
                         ${userPhone ? '(head_phone IS NOT NULL AND head_phone = $2)' : 'FALSE'}
                       )`,
                    [userEmail, userPhone].filter(v => v !== null)
                );
                
                if (regResult.rows.length > 0) {
                    console.log('Found OSBB ID from registration (email/phone):', regResult.rows[0].osbb_id);
                    return regResult.rows[0].osbb_id;
                }
            }
        }
        
        console.log('Registration query result:', regResult.rows);
        
        if (regResult.rows.length > 0) {
            console.log('Found OSBB ID from registration:', regResult.rows[0].osbb_id);
            return regResult.rows[0].osbb_id;
        }
        
        console.log('No OSBB ID found for admin user');
        return null;
    } catch (err) {
        console.error('Error getting admin OSBB ID:', err);
        console.error('Error stack:', err.stack);
        return null;
    }
}

/**
 * Verify that an apartment belongs to the admin's OSBB
 * @param {number} apartmentId - Apartment ID
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<boolean>} True if apartment belongs to admin's OSBB
 */
async function verifyApartmentBelongsToOSBB(apartmentId, adminUserId) {
    try {
        const adminOSBBId = await getAdminOSBBId(adminUserId);
        
        if (!adminOSBBId) {
            return false; // Admin has no OSBB
        }
        
        const result = await db.query(
            'SELECT osbb_id FROM apartments WHERE id = $1',
            [apartmentId]
        );
        
        if (result.rows.length === 0) {
            return false; // Apartment doesn't exist
        }
        
        return result.rows[0].osbb_id === adminOSBBId;
    } catch (err) {
        console.error('Error verifying apartment OSBB:', err);
        return false;
    }
}

/**
 * Verify that a voting belongs to the admin's OSBB
 * @param {number} votingId - Voting ID
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<boolean>} True if voting belongs to admin's OSBB
 */
async function verifyVotingBelongsToOSBB(votingId, adminUserId) {
    try {
        const adminOSBBId = await getAdminOSBBId(adminUserId);
        
        if (!adminOSBBId) {
            return false;
        }
        
        // Check if osbb_id column exists
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'votings' AND column_name = 'osbb_id'
        `);
        const hasOsbbId = columnCheck.rows.length > 0;
        
        if (!hasOsbbId) {
            // If column doesn't exist, allow access (legacy behavior)
            return true;
        }
        
        const result = await db.query(
            'SELECT osbb_id FROM votings WHERE id = $1',
            [votingId]
        );
        
        if (result.rows.length === 0) {
            return false;
        }
        
        return result.rows[0].osbb_id === adminOSBBId;
    } catch (err) {
        console.error('Error verifying voting OSBB:', err);
        return false;
    }
}

/**
 * Get all apartments for an admin's OSBB
 * @param {number} adminUserId - Admin user ID
 * @returns {Promise<Array>} Array of apartments
 */
async function getOSBBApartments(adminUserId) {
    try {
        console.log('Getting apartments for admin user:', adminUserId);
        const adminOSBBId = await getAdminOSBBId(adminUserId);
        console.log('Admin OSBB ID:', adminOSBBId);
        
        if (!adminOSBBId) {
            console.log('No OSBB ID found, returning empty array');
            return [];
        }
        
        const result = await db.query(
            'SELECT * FROM apartments WHERE osbb_id = $1 ORDER BY number',
            [adminOSBBId]
        );
        
        console.log('Found', result.rows.length, 'apartments');
        return result.rows;
    } catch (err) {
        console.error('Error getting OSBB apartments:', err);
        console.error('Error stack:', err.stack);
        return [];
    }
}

module.exports = {
    getAdminOSBBId,
    verifyApartmentBelongsToOSBB,
    verifyVotingBelongsToOSBB,
    getOSBBApartments
};

