# SuperAdmin Panel & Audit Logging System - Implementation Summary

## Overview

This document describes the implementation of the Internal Operations System (SuperAdmin Panel) and global Audit Logging System for the Good Neighbor platform.

## Components Implemented

### 1. Database Schema (`audit-logging-schema.sql`)

**Audit Logs Table:**
- `id` - Primary key
- `actor_id` - User who performed the action (nullable for system actions)
- `osbb_id` - OSBB context (nullable for super_admin actions)
- `action_type` - Type of action (e.g., 'login_success', 'approve_registration')
- `entity_type` - Type of entity affected (e.g., 'user', 'voting')
- `entity_id` - ID of affected entity
- `old_data` - Previous state (JSONB, for updates)
- `new_data` - New state (JSONB, for creates/updates)
- `metadata` - Additional data (IP, user-agent, etc.)
- `created_at` - Timestamp

**Indexes:**
- `idx_audit_actor` - Fast queries by actor
- `idx_audit_osbb` - Fast queries by OSBB
- `idx_audit_action` - Fast queries by action type
- `idx_audit_entity` - Fast queries by entity type/ID
- `idx_audit_created` - Fast queries by date (descending)

**Role Updates:**
- Added `super_admin` role to users table constraint
- Ensured super_admin users have `osbb_id = NULL`

### 2. Audit Logging Service (`loggerService.js`)

**Features:**
- Asynchronous logging (non-blocking)
- Automatic data sanitization (removes passwords, tokens, secrets)
- Request metadata extraction (IP, user-agent, timestamp)
- Specialized loggers for different action types:
  - `logAuth` - Authentication events (login success/failure, activation)
  - `logModeration` - Moderation actions (approve/reject registrations)
  - `logVoting` - Voting operations (create, close)
  - `logSuperAdmin` - Super admin actions

**Security:**
- Sensitive fields are automatically redacted before logging
- Never throws errors (audit logging should never break main flow)

### 3. Backend Integration

**Authentication Routes (`auth.js`):**
- Logs successful logins
- Logs failed login attempts (with reason)
- Logs account activations
- JWT tokens now include `osbb_id` for proper role checks

**Admin Routes (`admin.js`):**
- Logs registration approvals
- Logs registration rejections

**Voting Routes (`votings.js`):**
- Logs voting creation
- Logs voting closure

**Middleware (`authMiddleware.js`):**
- Added `requireSuperAdmin()` middleware
- Verifies super_admin has `osbb_id = NULL`

### 4. Internal API Routes (`internal.js`)

All routes require `super_admin` authentication and are prefixed with `/api/internal/`:

**Dashboard:**
- `GET /api/internal/dashboard/stats` - Global ecosystem statistics

**OSBB Registration Management:**
- `GET /api/internal/registrations` - List registration requests (with filters)
- `GET /api/internal/registrations/:id` - Get registration details
- `GET /api/internal/registrations/:id/protocol` - Download PDF protocol (safe file serving)
- `PATCH /api/internal/registrations/:id/approve` - Approve registration
- `PATCH /api/internal/registrations/:id/reject` - Reject registration

**Audit Logs:**
- `GET /api/internal/audit-logs` - Get audit logs with advanced filters
- `GET /api/internal/audit-logs/stats` - Get audit log statistics

**Security Features:**
- All routes protected by `requireSuperAdmin()` middleware
- Safe file serving (prevents directory traversal)
- All actions logged in audit system
- Sensitive data never returned in responses

### 5. Frontend Application (`good-neighbor-internal-panel`)

**Technology Stack:**
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios

**Pages:**
1. **LoginPage** - Super admin authentication
2. **DashboardPage** - Global statistics and recent activity
3. **RegistrationsPage** - OSBB registration moderation with:
   - Filter by status (pending/approved/rejected)
   - Detail view modal
   - PDF protocol viewer
   - Approve/Reject actions
4. **AuditLogsPage** - Audit log explorer with:
   - Advanced filters (actor, OSBB, action type, entity type, date range)
   - JSON diff viewer (old_data vs new_data)
   - Detailed log view modal

**Components:**
- `PrivateRoute` - Route protection (super_admin only)
- `AuthContext` - Authentication state management

**Security:**
- Only `super_admin` role can access
- Automatic logout on 401/403 responses
- Token stored in localStorage

## Setup Instructions

### 1. Database Migration

**Important**: Run schemas in the correct order to avoid foreign key constraint errors:

```bash
cd good-neighbor-backend/src/db

# Run in this order:
psql -U your_user -d your_database -f schema.sql
psql -U your_user -d your_database -f osbb-registration-schema.sql
psql -U your_user -d your_database -f security-enhancements.sql
psql -U your_user -d your_database -f bills-schema.sql
psql -U your_user -d your_database -f audit-logging-schema.sql
```

**Note**: The `security-enhancements.sql` script automatically:
- Cleans up invalid `osbb_id` references in existing data
- Creates a placeholder OSBB if needed for migration
- Safely adds foreign key constraints after data cleanup

If you encounter foreign key errors, the script will handle them automatically.

### 2. Create Super Admin User

```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

Example:
```bash
node dev-scripts/create-super-admin.js +380123456789 admin123 "Super Admin"
```

**Important:** Super admin users must have:
- `role = 'super_admin'`
- `osbb_id = NULL`

### 3. Install Frontend Dependencies

```bash
cd good-neighbor-internal-panel
npm install
```

### 4. Start Development Servers

**Backend:**
```bash
cd good-neighbor-backend
npm start
```

**Internal Panel:**
```bash
cd good-neighbor-internal-panel
npm run dev
```

The internal panel will run on `http://localhost:5174`

## Security Considerations

1. **Role-Based Access Control:**
   - All internal routes require `super_admin` role
   - Super admins must have `osbb_id = NULL` (verified in middleware)

2. **Data Sanitization:**
   - Passwords, tokens, and secrets are never logged
   - Sensitive fields are redacted before storage

3. **File Security:**
   - PDF protocol serving uses `path.basename()` to prevent directory traversal
   - File existence verified before serving

4. **Audit Trail:**
   - All critical actions are logged
   - Super admin actions are explicitly marked
   - Failed login attempts are tracked

5. **Token Security:**
   - JWT tokens include `osbb_id` for proper authorization
   - Tokens expire after 24 hours

## API Usage Examples

### Get Dashboard Stats
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/internal/dashboard/stats
```

### List Pending Registrations
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/internal/registrations?status=pending
```

### Approve Registration
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/internal/registrations/1/approve
```

### Get Audit Logs
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/internal/audit-logs?action_type=login_success&start_date=2024-01-01"
```

## Testing Checklist

### Database Setup
- [ ] Run all schema migrations in correct order
- [ ] Verify `audit_logs` table exists
- [ ] Verify `osbb_organizations` table exists
- [ ] Verify `super_admin` role is supported in users table

### Super Admin Setup
- [ ] Create super admin user using `create-super-admin.js`
- [ ] Verify super admin has `osbb_id = NULL`
- [ ] Login to internal panel successfully

### Internal Panel Features
- [ ] View dashboard statistics (OSBBs, users, votings, bills)
- [ ] List OSBB registration requests (all statuses)
- [ ] View registration details
- [ ] Download PDF protocol (safe file serving)
- [ ] Approve a registration request
- [ ] Reject a registration request
- [ ] View audit logs
- [ ] Filter audit logs by actor, OSBB, action type, date range
- [ ] View audit log details with JSON diff
- [ ] Verify all actions are logged in audit system

### Security Verification
- [ ] Non-super-admin users cannot access internal routes
- [ ] Super admin actions bypass tenant isolation
- [ ] Sensitive data (passwords) not logged in audit logs
- [ ] File serving prevents directory traversal

## Known Limitations

1. **PDF Viewer:** Currently opens in new tab. Could be enhanced with embedded viewer.
2. **Pagination:** Audit logs and registrations use limit/offset. Could be enhanced with cursor-based pagination.
3. **Real-time Updates:** Dashboard stats are not real-time. Could be enhanced with WebSocket updates.

## Future Enhancements

1. **Advanced Analytics:**
   - Time-series charts for activity trends
   - User behavior analysis
   - OSBB growth metrics

2. **Enhanced Moderation:**
   - Bulk approve/reject actions
   - Comment system for rejections
   - Email notifications

3. **Audit Log Enhancements:**
   - Export to CSV/PDF
   - Advanced search with full-text
   - Alert system for suspicious activities

4. **User Management:**
   - Super admin user management
   - Role assignment interface
   - Activity monitoring per user

