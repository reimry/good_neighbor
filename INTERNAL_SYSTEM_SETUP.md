# Internal Management System - Setup Guide

## Quick Start

### Step 1: Check Existing SuperAdmin Users

```bash
cd good-neighbor-backend
node dev-scripts/fix-superadmin.js
```

This will show you:
- If any superadmin users exist
- If they have `login_id` set (required for login)
- What needs to be fixed

### Step 2: Create a SuperAdmin User (if needed)

If no superadmin exists or they don't have `login_id`, create one:

```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <login_id> <password> [full_name]
```

**Example:**
```bash
node dev-scripts/create-super-admin.js admin123 SecurePassword123 "Super Administrator"
```

**Important:** 
- `login_id` must be unique
- Password will be hashed with Argon2
- User will have `role = 'super_admin'` and `osbb_id = NULL`

### Step 3: Start the Application

**Backend:**
```bash
cd good-neighbor-backend
npm start
# Runs on http://localhost:3000
```

**Frontend:**
```bash
cd good-neighbor-frontend
npm run dev
# Runs on http://localhost:5173
```

### Step 4: Access Internal System

1. Navigate to: **http://localhost:5173/internal/login**
2. Enter your `login_id` and `password`
3. You'll be redirected to `/internal/dashboard`

## System Architecture

### Separation from Main App

The Internal Management System is **completely separate**:

| Feature | Main App | Internal System |
|---------|----------|----------------|
| **Route Prefix** | `/dashboard`, `/admin/*` | `/internal/*` |
| **Auth Context** | `AuthContext` | `InternalAuthContext` |
| **Token Storage** | `localStorage.token` | `localStorage.internal_token` |
| **User Type** | Regular users (admin, owner, tenant) | SuperAdmin only |
| **Purpose** | OSBB-specific management | Ecosystem-wide management |

### Routes

#### Main Application Routes
- `/login` - Regular user login (phone/email)
- `/dashboard` - User dashboard
- `/admin/*` - OSBB admin panel
- `/profile` - User profile

#### Internal System Routes
- `/internal/login` - SuperAdmin login (login_id)
- `/internal/dashboard` - Ecosystem overview
- `/internal/database` - Database management

## Features

### Dashboard (`/internal/dashboard`)
- **OSBB Statistics**: Total organizations, active, pending
- **User Statistics**: Total users by role
- **Voting Statistics**: Active and finished votings
- **Bills Statistics**: Total bills and amounts
- **Recent Activity**: Last 7 days of system activity

### Database Management (`/internal/database`)

#### Users Tab
- **View**: All users with filters (role, search)
- **Edit**: User details (name, phone, email, role, apartment, OSBB)
- **Delete**: Remove users (with confirmation)
- **Pagination**: 20 items per page

#### Organizations Tab
- **View**: All OSBB organizations
- **Filter**: By status (pending, approved, rejected)
- **Edit**: Organization details (name, EDRPOU, address, status)
- **Stats**: User and apartment counts per organization

#### Apartments Tab
- **View**: All apartments
- **Search**: By apartment number
- **Info**: Balance, area, OSBB association, resident count

## Troubleshooting

### Blank Page After Login

**Possible Causes:**
1. User doesn't have `super_admin` role
2. User doesn't have `login_id` set
3. Token not stored correctly

**Solution:**
```bash
# Check user
cd good-neighbor-backend
node dev-scripts/fix-superadmin.js

# If login_id is NULL, create new superadmin
node dev-scripts/create-super-admin.js admin123 password123 "Admin"
```

### Can't Login

**Check:**
1. User exists: `node dev-scripts/check-users.js`
2. User has `role = 'super_admin'`
3. User has `login_id` set (not NULL)
4. Password is correct

**Verify in database:**
```sql
SELECT id, login_id, full_name, role, osbb_id 
FROM users 
WHERE role = 'super_admin';
```

### API Errors (401/403)

**Check:**
1. Backend is running on port 3000
2. Token is stored in `localStorage.internal_token`
3. Token is valid (not expired)
4. User has `super_admin` role

**Debug:**
- Open browser DevTools → Console
- Check Network tab for API requests
- Verify Authorization header includes token

### Database Migration Issues

If `login_id` column doesn't exist or is NOT NULL:

```bash
cd good-neighbor-backend/src/db
psql -U postgres -d good_neighbor_db -f fix-login-id-migration.sql
```

This will:
- Make `login_id` nullable
- Add constraint: superadmins MUST have `login_id`
- Add indexes for faster lookups

## Security Notes

- **SuperAdmin users** must have `osbb_id = NULL` (global access)
- **Regular users** use phone/email for login (no `login_id`)
- **All actions** are logged in audit system
- **Routes protected** by `requireSuperAdmin` middleware
- **Frontend routes** protected by `InternalPrivateRoute`

## API Endpoints

All internal routes require superadmin authentication:

```
GET    /api/internal/dashboard/stats
GET    /api/internal/db/users
GET    /api/internal/db/users/:id
PATCH  /api/internal/db/users/:id
DELETE /api/internal/db/users/:id
GET    /api/internal/db/organizations
GET    /api/internal/db/organizations/:id
PATCH  /api/internal/db/organizations/:id
GET    /api/internal/db/apartments
```

## Next Steps

1. ✅ Create superadmin user
2. ✅ Access `/internal/login`
3. ✅ Explore dashboard
4. ✅ Manage database entities
5. ✅ Review audit logs (when implemented)

For more details, see: `good-neighbor-frontend/INTERNAL_SYSTEM.md`
