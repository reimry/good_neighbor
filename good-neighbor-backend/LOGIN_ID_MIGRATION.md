# Login ID Migration - Architectural Separation

**Date**: January 2026  
**Purpose**: Separate authentication methods for regular users vs superadmins at the architecture level

## Problem

The database schema was changed to require `login_id` for all users, breaking regular users who use phone numbers for login. This change was only intended for superadmin users.

## Solution

### Architectural Separation

- **Regular Users** (residents, admins): Login with **phone** or **email** (no `login_id`)
- **SuperAdmin Users**: Login with **login_id** only (no phone/email)

### Database Changes

1. `login_id` column is now **nullable** (only superadmins have it)
2. Regular users have `phone` and optionally `email`
3. SuperAdmin users have `login_id` and `osbb_id = NULL`

### Migration Steps

1. **Run the migration script**:
   ```bash
   psql -U postgres -d good_neighbor_db -f src/db/fix-login-id-migration.sql
   ```

   This will:
   - Make `login_id` nullable
   - Set `login_id = phone` for existing regular users (backward compatibility)
   - Add constraint: superadmins MUST have `login_id`
   - Add indexes on `phone` and `email` columns

2. **Verify migration**:
   ```bash
   node dev-scripts/check-users.js
   ```

### Authentication Flow

#### Regular Users (Frontend: `good-neighbor-frontend`)
- Login page accepts: **phone** or **email**
- Backend detects phone pattern (`+380XXXXXXXXX`) or email pattern (`@`)
- Queries `users` table by `phone` or `email` column

#### SuperAdmin Users (Frontend: `good-neighbor-internal-panel`)
- Login page accepts: **login_id**
- Backend queries `users` table by `login_id` column
- Must have `role = 'super_admin'` and `osbb_id = NULL`

### Backward Compatibility

The login route supports backward compatibility:
- If `login_id` parameter looks like a phone (`+380...`) → checks `phone` column
- If `login_id` parameter looks like an email (`@`) → checks `email` column
- Otherwise → checks `login_id` column (superadmin)

This allows existing frontend code to continue working while migrating to the new architecture.

### Creating Users

#### Regular Users (via activation)
```javascript
// Uses phone, no login_id
INSERT INTO users (phone, password_hash, full_name, role, apartment_id, osbb_id)
VALUES ($1, $2, $3, $4, $5, $6)
```

#### SuperAdmin Users
```bash
node dev-scripts/create-super-admin.js <login_id> <password> [full_name]
```

```javascript
// Uses login_id, no phone/email
INSERT INTO users (login_id, password_hash, full_name, role, osbb_id)
VALUES ($1, $2, $3, 'super_admin', NULL)
```

### Files Changed

1. **Database Schema**:
   - `src/db/schema.sql` - `login_id` is nullable
   - `src/db/fix-login-id-migration.sql` - Migration script

2. **Backend**:
   - `src/routes/auth.js` - Updated login route to support both methods

3. **Frontend**:
   - `good-neighbor-frontend/src/pages/LoginPage.jsx` - Changed to phone/email input
   - `good-neighbor-frontend/src/contexts/AuthContext.jsx` - Updated login function
   - `good-neighbor-internal-panel` - No changes (already uses login_id)

### Testing

1. **Test regular user login**:
   - Use phone: `+380123456789`
   - Use email: `user@example.com`

2. **Test superadmin login**:
   - Use login_id: `admin123`

3. **Verify constraints**:
   - Superadmin without `login_id` should fail
   - Regular user with `login_id` is allowed (backward compat)

### Notes

- Regular users can still have `login_id` set (for backward compatibility), but it's not required
- The constraint ensures superadmins MUST have `login_id`
- Phone and email columns are indexed for faster lookups
- All authentication is logged in the audit system
