/**
 * Audit Logging Service
 * Asynchronously logs all critical actions for security and compliance
 */

const db = require('../db/connection');

/**
 * Sanitize data to remove sensitive information before logging
 * @param {Object} data - Data object to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    // Recursively sanitize nested objects
    for (const key in sanitized) {
        if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    }
    
    return sanitized;
}

/**
 * Create an audit log entry
 * @param {Object} logData - Log entry data
 * @param {number|null} logData.actor_id - User ID who performed the action
 * @param {number|null} logData.osbb_id - OSBB ID (null for super_admin actions)
 * @param {string} logData.action_type - Type of action (e.g., 'login', 'approve_registration')
 * @param {string|null} logData.entity_type - Type of entity affected
 * @param {number|null} logData.entity_id - ID of entity affected
 * @param {Object|null} logData.old_data - Previous state (for updates)
 * @param {Object|null} logData.new_data - New state (for creates/updates)
 * @param {Object|null} logData.metadata - Additional metadata (IP, user-agent, etc.)
 * @returns {Promise<void>}
 */
async function logAction(logData) {
    try {
        const {
            actor_id = null,
            osbb_id = null,
            action_type,
            entity_type = null,
            entity_id = null,
            old_data = null,
            new_data = null,
            metadata = null
        } = logData;
        
        // Sanitize sensitive data
        const sanitizedOldData = old_data ? sanitizeData(old_data) : null;
        const sanitizedNewData = new_data ? sanitizeData(new_data) : null;
        
        // Insert audit log asynchronously (don't block the main operation)
        db.query(
            `INSERT INTO audit_logs 
             (actor_id, osbb_id, action_type, entity_type, entity_id, old_data, new_data, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                actor_id,
                osbb_id,
                action_type,
                entity_type,
                entity_id,
                sanitizedOldData ? JSON.stringify(sanitizedOldData) : null,
                sanitizedNewData ? JSON.stringify(sanitizedNewData) : null,
                metadata ? JSON.stringify(metadata) : null
            ]
        ).catch(err => {
            // Log errors but don't throw (audit logging should never break main flow)
            console.error('Failed to create audit log:', err);
        });
    } catch (err) {
        // Never throw - audit logging is non-critical
        console.error('Error in audit logging:', err);
    }
}

/**
 * Extract metadata from Express request
 * @param {Object} req - Express request object
 * @returns {Object} Metadata object
 */
function extractRequestMetadata(req) {
    return {
        ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
    };
}

/**
 * Log authentication events
 */
const logAuth = {
    loginSuccess: async (userId, req) => {
        await logAction({
            actor_id: userId,
            action_type: 'login_success',
            entity_type: 'user',
            entity_id: userId,
            metadata: extractRequestMetadata(req)
        });
    },
    
    loginFailed: async (identifier, reason, req) => {
        await logAction({
            actor_id: null,
            action_type: 'login_failed',
            entity_type: 'user',
            metadata: {
                ...extractRequestMetadata(req),
                identifier: identifier, // phone/email (not sensitive)
                reason: reason
            }
        });
    },
    
    activation: async (userId, invitationCode, req) => {
        await logAction({
            actor_id: userId,
            action_type: 'account_activation',
            entity_type: 'user',
            entity_id: userId,
            metadata: {
                ...extractRequestMetadata(req),
                invitation_code: invitationCode
            }
        });
    }
};

/**
 * Log moderation events
 */
const logModeration = {
    approveRegistration: async (adminId, registrationId, osbbId, newUserId, req) => {
        await logAction({
            actor_id: adminId,
            osbb_id: osbbId,
            action_type: 'approve_registration',
            entity_type: 'osbb_registration',
            entity_id: registrationId,
            new_data: {
                registration_id: registrationId,
                user_id: newUserId,
                status: 'approved'
            },
            metadata: extractRequestMetadata(req)
        });
    },
    
    rejectRegistration: async (adminId, registrationId, osbbId, reason, req) => {
        await logAction({
            actor_id: adminId,
            osbb_id: osbbId,
            action_type: 'reject_registration',
            entity_type: 'osbb_registration',
            entity_id: registrationId,
            new_data: {
                registration_id: registrationId,
                status: 'rejected',
                rejection_reason: reason
            },
            metadata: extractRequestMetadata(req)
        });
    }
};

/**
 * Log voting events
 */
const logVoting = {
    create: async (adminId, osbbId, votingId, votingData, req) => {
        await logAction({
            actor_id: adminId,
            osbb_id: osbbId,
            action_type: 'create_voting',
            entity_type: 'voting',
            entity_id: votingId,
            new_data: sanitizeData(votingData),
            metadata: extractRequestMetadata(req)
        });
    },
    
    close: async (adminId, osbbId, votingId, req) => {
        await logAction({
            actor_id: adminId,
            osbb_id: osbbId,
            action_type: 'close_voting',
            entity_type: 'voting',
            entity_id: votingId,
            metadata: extractRequestMetadata(req)
        });
    }
};

/**
 * Log super admin actions
 */
const logSuperAdmin = {
    action: async (superAdminId, actionType, entityType, entityId, oldData, newData, req) => {
        await logAction({
            actor_id: superAdminId,
            osbb_id: null, // Super admin actions are global
            action_type: `super_admin_${actionType}`,
            entity_type: entityType,
            entity_id: entityId,
            old_data: oldData,
            new_data: newData,
            metadata: extractRequestMetadata(req)
        });
    }
};

module.exports = {
    logAction,
    extractRequestMetadata,
    logAuth,
    logModeration,
    logVoting,
    logSuperAdmin
};

