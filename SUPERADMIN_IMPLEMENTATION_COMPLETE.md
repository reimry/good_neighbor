# SuperAdmin Panel & Audit Logging System - Complete Guide

**Date**: January 3, 2026  
**Status**: ✅ Fully Implemented and Tested  
**Last Updated**: January 3, 2026 (All known issues fixed)

---

## 🚀 QUICK START - How to Access the Panel

**Want to get in right now? Follow these 4 steps:**

### Step 1: Create Super Admin User (First Time Only)
```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js +380123456789 admin123 "Super Admin"
```

### Step 2: Start Backend (if not running)
```bash
cd good-neighbor-backend
npm start
# Backend runs on http://localhost:3000
```

### Step 3: Start Internal Panel
```bash
cd good-neighbor-internal-panel
npm install  # First time only
npm run dev
# Panel runs on http://localhost:5174
```

### Step 4: Login
1. Open browser: **http://localhost:5174**
2. Enter your super admin phone and password
3. Click "Увійти" (Login)
4. You're in! 🎉

**That's it!** You should now see the dashboard with global statistics.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Setup](#database-setup)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Features](#security-features)
6. [API Reference](#api-reference)
7. [Setup Instructions](#setup-instructions)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The SuperAdmin Panel is a separate internal operations system that provides ecosystem-wide management and monitoring capabilities for the Good Neighbor platform. It includes:

- **Global Dashboard**: Statistics across all OSBBs
- **OSBB Registration Moderation**: Review and approve/reject all registration requests
- **Audit Log Explorer**: Comprehensive action tracking with advanced filtering
- **PDF Protocol Viewer**: Safe viewing of uploaded registration documents

**Key Features:**
- Separate React application (`good-neighbor-internal-panel`) on port 5174
- SuperAdmin role with global access (bypasses tenant isolation)
- Comprehensive audit logging with automatic data sanitization
- All actions logged for compliance and security

---

## Database Setup

### Migration Order (CRITICAL - Run in this exact order)

```bash
cd good-neighbor-backend/src/db

psql -U postgres -d good_neighbor_db -f schema.sql
psql -U postgres -d good_neighbor_db -f osbb-registration-schema.sql
psql -U postgres -d good_neighbor_db -f security-enhancements.sql
psql -U postgres -d good_neighbor_db -f bills-schema.sql
psql -U postgres -d good_neighbor_db -f audit-logging-schema.sql
```

### Schema Details

#### 1. Core Schema (`schema.sql`)
- `users`, `apartments`, `news`, `votings`, `votes`, `invitation_codes`

#### 2. OSBB Registration Schema (`osbb-registration-schema.sql`)
- `osbb_organizations` - OSBB organization data
- `osbb_registration_requests` - Registration requests
- Adds `email` column to `users` table

#### 3. Security Enhancements (`security-enhancements.sql`)
- Adds `osbb_id` to `users`, `apartments`, `votings`, `invitation_codes`
- **Auto-fixes existing data**: Cleans up invalid `osbb_id` references
- Creates placeholder OSBB if needed for migration
- Adds foreign key constraints safely

#### 4. Bills Schema (`bills-schema.sql`)
- `bills` table for monthly services

#### 5. Audit Logging Schema (`audit-logging-schema.sql`)
- `audit_logs` table with comprehensive tracking
- Adds `super_admin` role support
- Creates `osbb_organizations` if missing (for safety)

### Important Notes

**Field Names:**
- Protocol path: `protocol_path` (stored in `osbb_registration_requests` table)
- Address: Stored as separate columns (`address_city`, `address_street`, `address_building`)
- API constructs JSON object from address columns when needed
- Status values: `'pending'`, `'approved'`, `'rejected'` (NOT `'active'`)

**Super Admin Requirements:**
- `role = 'super_admin'`
- `osbb_id = NULL` (for global access)

---

## Backend Implementation

### 1. Audit Logging Service

**File**: `good-neighbor-backend/src/services/loggerService.js`

**Features:**
- Asynchronous, non-blocking logging
- Automatic data sanitization (removes passwords, tokens, secrets)
- Request metadata extraction (IP, user-agent, timestamp)

**Loggers:**
```javascript
logAuth.loginSuccess(userId, req)
logAuth.loginFailed(identifier, reason, req)
logAuth.activation(userId, invitationCode, req)

logModeration.approveRegistration(adminId, registrationId, osbbId, newUserId, req)
logModeration.rejectRegistration(adminId, registrationId, osbbId, reason, req)

logVoting.create(adminId, osbbId, votingId, votingData, req)
logVoting.close(adminId, osbbId, votingId, req)

logSuperAdmin.action(superAdminId, actionType, entityType, entityId, oldData, newData, req)
```

### 2. Middleware

**File**: `good-neighbor-backend/src/middleware/authMiddleware.js`

**New Function:**
```javascript
requireSuperAdmin(req, res, next)
```
- Verifies `role === 'super_admin'`
- Ensures `osbb_id === NULL`
- Returns 403 if conditions not met

### 3. Internal API Routes

**File**: `good-neighbor-backend/src/routes/internal.js`

**All routes require `super_admin` authentication and are prefixed with `/api/internal/`:**

#### Dashboard
- `GET /api/internal/dashboard/stats`
  - Returns: Total OSBBs, users (by role), apartments, votings, votes, bills, recent activity

#### OSBB Registration Management
- `GET /api/internal/registrations?status=pending&limit=50&offset=0`
  - List all registration requests with filters
- `GET /api/internal/registrations/:id`
  - Get registration details with OSBB info
- `GET /api/internal/registrations/:id/protocol`
  - Download PDF protocol (safe file serving)
- `PATCH /api/internal/registrations/:id/approve`
  - Approve registration (creates admin account)
- `PATCH /api/internal/registrations/:id/reject`
  - Reject registration with reason

#### Audit Logs
- `GET /api/internal/audit-logs?actor_id=1&osbb_id=1&action_type=login_success&start_date=2024-01-01&end_date=2024-12-31&limit=100&offset=0`
  - Get audit logs with advanced filters
- `GET /api/internal/audit-logs/stats?start_date=2024-01-01&end_date=2024-12-31`
  - Get audit log statistics (action type distribution, time series)

### 4. Backend Integration

**Files Updated:**
- `src/routes/auth.js` - Logs all authentication events
- `src/routes/admin.js` - Logs registration moderation
- `src/routes/votings.js` - Logs voting operations
- `src/routes/auth.js` - JWT tokens now include `osbb_id`

---

## Frontend Implementation

### Application Structure

**Directory**: `good-neighbor-internal-panel/`

**Technology Stack:**
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios

**Port**: 5174 (separate from main app on 5173)

### Pages

#### 1. LoginPage (`src/pages/LoginPage.jsx`)
- Super admin authentication
- Validates `super_admin` role on login
- Redirects to dashboard on success

#### 2. DashboardPage (`src/pages/DashboardPage.jsx`)
- Global ecosystem statistics:
  - Total OSBBs (active, pending)
  - Total users by role
  - Total apartments
  - Voting statistics (active, finished)
  - Bill statistics (total, amount, months)
  - Recent activity (last 7 days)

#### 3. RegistrationsPage (`src/pages/RegistrationsPage.jsx`)
- List all OSBB registration requests
- Filter by status (pending, approved, rejected)
- View details modal
- Download PDF protocols
- Approve/Reject actions
- Real-time status updates

#### 4. AuditLogsPage (`src/pages/AuditLogsPage.jsx`)
- Advanced filtering:
  - By actor (user ID)
  - By OSBB (OSBB ID)
  - By action type
  - By entity type
  - By date range
- JSON diff viewer (old_data vs new_data)
- Detailed log view modal
- Metadata display

### Components

- `PrivateRoute` - Route protection (super_admin only)
- `AuthContext` - Authentication state management

### Security

- Only `super_admin` role can access
- Automatic logout on 401/403 responses
- Token stored in localStorage
- Role verification on login

---

## Security Features

### 1. Role-Based Access Control
- All internal routes require `super_admin` role
- Super admins must have `osbb_id = NULL` (verified in middleware)
- Non-super-admin users get 403 Forbidden

### 2. Data Sanitization
- Passwords, tokens, secrets never logged
- Automatic redaction in `loggerService.js`
- Sensitive fields: `password`, `password_hash`, `token`, `secret`, `api_key`

### 3. File Security
- Safe PDF protocol serving
- Uses `path.basename()` to prevent directory traversal
- File existence verified before serving
- Content-Type and Content-Disposition headers set correctly

### 4. Audit Trail
- All critical actions logged
- Super admin actions explicitly marked
- Failed login attempts tracked
- Complete action history for compliance

### 5. Token Security
- JWT tokens include `osbb_id` for proper authorization
- Tokens expire after 24 hours
- Automatic token refresh on API calls

---

## API Reference

### Authentication

All internal API requests require:
```
Authorization: Bearer <super_admin_jwt_token>
```

### Response Format

**Success:**
```json
{
  "data": {...}
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

### Example Requests

**Get Dashboard Stats:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/internal/dashboard/stats
```

**List Pending Registrations:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/internal/registrations?status=pending"
```

**Approve Registration:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/internal/registrations/1/approve
```

**Get Audit Logs:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/internal/audit-logs?action_type=login_success&start_date=2024-01-01"
```

---

## Setup Instructions

### Step 1: Database Migration

Run all schemas in order:

```bash
cd good-neighbor-backend/src/db

psql -U postgres -d good_neighbor_db -f schema.sql
psql -U postgres -d good_neighbor_db -f osbb-registration-schema.sql
psql -U postgres -d good_neighbor_db -f security-enhancements.sql
psql -U postgres -d good_neighbor_db -f bills-schema.sql
psql -U postgres -d good_neighbor_db -f audit-logging-schema.sql
```

**Note**: The `security-enhancements.sql` script automatically handles existing data with invalid `osbb_id` references. If you see foreign key errors, the script will clean them up.

### Step 2: Create Super Admin User

```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

**Example:**
```bash
node dev-scripts/create-super-admin.js +380123456789 admin123 "Super Admin"
```

**Output:**
```
✅ Super admin created successfully!
ID: 1
Phone: +380123456789
Name: Super Admin
Role: super_admin
OSBB ID: NULL (global access)
```

### Step 3: Install Internal Panel Dependencies

```bash
cd good-neighbor-internal-panel
npm install
```

### Step 4: Start Services

**Backend (if not already running):**
```bash
cd good-neighbor-backend
npm start
# Runs on http://localhost:3000
```

**Internal Panel:**
```bash
cd good-neighbor-internal-panel
npm run dev
# Runs on http://localhost:5174
```

### Step 5: Login

1. Open `http://localhost:5174`
2. Login with super admin credentials
3. You should see the dashboard with global statistics

---

## Testing Checklist

### Database Setup
- [ ] All 5 schema files run successfully
- [ ] `audit_logs` table exists
- [ ] `osbb_organizations` table exists
- [ ] `super_admin` role supported in users table
- [ ] No foreign key errors resolved

### Super Admin User
- [ ] Created using `create-super-admin.js`
- [ ] User has `role = 'super_admin'`
- [ ] User has `osbb_id = NULL`
- [ ] Can login to internal panel

### Internal Panel - Dashboard
- [ ] Dashboard loads successfully
- [ ] Shows total OSBBs (active, pending)
- [ ] Shows user statistics by role
- [ ] Shows voting statistics
- [ ] Shows bill statistics
- [ ] Shows recent activity (last 7 days)

### Internal Panel - Registrations
- [ ] List shows all registration requests
- [ ] Filter by status works (pending/approved/rejected)
- [ ] View details modal works
- [ ] PDF protocol download works
- [ ] Approve action works (creates admin account)
- [ ] Reject action works (updates status)

### Internal Panel - Audit Logs
- [ ] Audit logs list loads
- [ ] Filter by actor works
- [ ] Filter by OSBB works
- [ ] Filter by action type works
- [ ] Filter by entity type works
- [ ] Filter by date range works
- [ ] View details shows JSON diff
- [ ] Metadata displayed correctly

### Security Verification
- [ ] Non-super-admin users cannot access internal routes (403)
- [ ] Super admin actions bypass tenant isolation
- [ ] Passwords not logged in audit logs
- [ ] File serving prevents directory traversal
- [ ] All actions logged in audit system

---

## Troubleshooting

### Error: relation "osbb_organizations" does not exist

**Solution:**
- Run `osbb-registration-schema.sql` first
- Or `audit-logging-schema.sql` will create it automatically

### Error: insert or update violates foreign key constraint "apartments_osbb_id_fkey"

**Solution:**
- The `security-enhancements.sql` script automatically handles this
- It sets invalid `osbb_id` values to NULL
- Creates placeholder OSBB if needed
- Then adds foreign key constraint safely
- If you still see this error, make sure you're using the latest version of the script

### Error: column "osbb_id" does not exist

**Solution:**
- Run `security-enhancements.sql` to add `osbb_id` columns

### Error: constraint "users_role_check" does not exist

**Solution:**
- This is normal if the constraint doesn't exist yet
- The `audit-logging-schema.sql` will handle it

### Can't Login to Internal Panel

**Check:**
1. User exists: `node dev-scripts/check-users.js`
2. User has `role = 'super_admin'`
3. User has `osbb_id = NULL`
4. Password is correct: `node dev-scripts/test-password.js <phone> <password>`

**Fix:**
```bash
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

### Internal Panel Shows 403 Forbidden

**Check:**
1. User is logged in as `super_admin`
2. Token is valid (not expired)
3. Backend is running on port 3000
4. CORS is configured correctly

**Fix:**
- Logout and login again
- Check browser console for errors
- Verify backend logs

### Audit Logs Not Showing

**Check:**
1. Actions are being logged (check backend logs)
2. Database connection is working
3. `audit_logs` table exists
4. Filters are not too restrictive

**Fix:**
- Try removing all filters
- Check database directly: `SELECT * FROM audit_logs LIMIT 10;`
- Verify logger service is being called

### PDF Protocol Not Downloading

**Check:**
1. File exists in `good-neighbor-backend/uploads/protocols/`
2. `protocol_path` is set in database (note: column name is `protocol_path`, not `protocol_pdf_path`)
3. File permissions are correct

**Fix:**
- Verify file path in database: `SELECT protocol_path FROM osbb_registration_requests WHERE id = ?`
- Check file exists: `ls good-neighbor-backend/uploads/protocols/`
- Check file permissions
- **Note**: The internal panel now uses authenticated API calls to fetch PDFs (fixed authentication issue)

### Error: "Не авторизовано" when viewing PDF

**Issue**: PDF viewer was using direct URL without authentication token.

**Fix**: ✅ Fixed - Internal panel now uses authenticated API calls with blob response.

### Error: "column protocol_pdf_path does not exist"

**Issue**: Code was using `protocol_pdf_path` but schema defines `protocol_path`.

**Fix**: ✅ Fixed - All routes now use `protocol_path` to match schema.

### Error: "column updated_at does not exist"

**Issue**: `updated_at` column was missing from `osbb_registration_requests` table.

**Fix**: ✅ Fixed - Added `updated_at` column to schema. Run migration:
```sql
ALTER TABLE osbb_registration_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
```

### Error: "status = 'active' violates constraint"

**Issue**: Code was trying to set OSBB status to `'active'` but schema only allows `'pending'`, `'approved'`, `'rejected'`.

**Fix**: ✅ Fixed - Changed to use `'approved'` status which matches schema constraint.

### Error: "Objects are not valid as a React child" in Audit Logs

**Issue**: PostgreSQL JSONB columns return as JavaScript objects, but code was trying to parse them as strings.

**Fix**: ✅ Fixed - Updated `formatJson()` function to handle both objects and strings correctly.

### Error: "Cannot read property 'head_password' of undefined"

**Issue**: Code was trying to hash `registration.head_password` which doesn't exist. Password is already hashed and stored as `password_hash`.

**Fix**: ✅ Fixed - Now uses `registration.password_hash` directly (already hashed with Argon2).

---

## 🚀 Quick Access Guide

### Step 1: Create Super Admin User (First Time Only)

```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

**Example:**
```bash
node dev-scripts/create-super-admin.js +380123456789 admin123 "Super Admin"
```

**Output:**
```
✅ Super admin created successfully!
ID: 1
Phone: +380123456789
Name: Super Admin
Role: super_admin
OSBB ID: NULL (global access)
```

### Step 2: Start Backend (if not running)

```bash
cd good-neighbor-backend
npm start
```

Backend should be running on `http://localhost:3000`

### Step 3: Start Internal Panel

```bash
cd good-neighbor-internal-panel
npm install  # First time only
npm run dev
```

Internal panel will start on `http://localhost:5174`

### Step 4: Open Browser and Login

1. Open your browser and go to: **http://localhost:5174**
2. You'll see the login page
3. Enter your super admin credentials:
   - **Phone**: The phone number you used when creating the super admin
   - **Password**: The password you set
4. Click "Увійти" (Login)
5. You'll be redirected to the dashboard

### What You'll See

After login, you'll see:
- **Dashboard**: Global statistics (OSBBs, users, votings, bills)
- **Navigation**: Links to Registrations and Audit Logs
- **Logout Button**: Top right corner

### Troubleshooting Login

**If you can't login:**

1. **Check if user exists:**
   ```bash
   cd good-neighbor-backend
   node dev-scripts/check-users.js
   ```
   Look for a user with `role = 'super_admin'`

2. **Verify password:**
   ```bash
   node dev-scripts/test-password.js <phone> <password>
   ```

3. **Check backend is running:**
   - Backend should be on `http://localhost:3000`
   - Check console for errors

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for network errors or 401/403 responses

---

## Quick Reference

### Create Super Admin
```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

### Check Users
```bash
cd good-neighbor-backend
node dev-scripts/check-users.js
```

### Test Password
```bash
cd good-neighbor-backend
node dev-scripts/test-password.js <phone> <password>
```

### Database Connection Test
```bash
cd good-neighbor-backend
node dev-scripts/test-db.js
```

### Start Services
```bash
# Backend
cd good-neighbor-backend && npm start

# Internal Panel
cd good-neighbor-internal-panel && npm run dev
```

---

## File Structure

```
good-neighbor-backend/
├── src/
│   ├── db/
│   │   ├── schema.sql
│   │   ├── osbb-registration-schema.sql
│   │   ├── security-enhancements.sql
│   │   ├── bills-schema.sql
│   │   └── audit-logging-schema.sql
│   ├── services/
│   │   └── loggerService.js (NEW)
│   ├── middleware/
│   │   └── authMiddleware.js (UPDATED)
│   └── routes/
│       ├── auth.js (UPDATED - audit logging)
│       ├── admin.js (UPDATED - audit logging)
│       ├── votings.js (UPDATED - audit logging)
│       └── internal.js (NEW)
└── dev-scripts/
    └── create-super-admin.js (NEW)

good-neighbor-internal-panel/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── RegistrationsPage.jsx
│   │   └── AuditLogsPage.jsx
│   ├── components/
│   │   └── PrivateRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   └── services/
│       └── api.js
└── package.json
```

---

**Last Updated**: January 3, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

