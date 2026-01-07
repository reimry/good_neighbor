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
        // First, try to get from users.osbb_id (direct link)
        const userResult = await db.query(
            'SELECT osbb_id FROM users WHERE id = $1 AND role = $2',
            [userId, 'admin']
        );
        
        if (userResult.rows.length > 0 && userResult.rows[0].osbb_id) {
            return userResult.rows[0].osbb_id;
        }
        
        // Fallback: Get from registration request
        const regResult = await db.query(
            `SELECT osbb_id FROM osbb_registration_requests 
             WHERE user_id = $1 AND status = 'approved'`,
            [userId]
        );
        
        if (regResult.rows.length > 0) {
            return regResult.rows[0].osbb_id;
        }
        
        return null;
    } catch (err) {
        console.error('Error getting admin OSBB ID:', err);
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
        const adminOSBBId = await getAdminOSBBId(adminUserId);
        
        if (!adminOSBBId) {
            return [];
        }
        
        const result = await db.query(
            'SELECT * FROM apartments WHERE osbb_id = $1 ORDER BY number',
            [adminOSBBId]
        );
        
        return result.rows;
    } catch (err) {
        console.error('Error getting OSBB apartments:', err);
        return [];
    }
}

module.exports = {
    getAdminOSBBId,
    verifyApartmentBelongsToOSBB,
    verifyVotingBelongsToOSBB,
    getOSBBApartments
};

