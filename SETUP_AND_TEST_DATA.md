# Setup and Test Data Guide

## Quick Setup

### 1. Run Database Migrations

```bash
cd good-neighbor-backend/src/db
psql -U postgres -d good_neighbor_db -f fix-login-id-migration.sql
```

### 2. Create SuperAdmin User

```bash
cd good-neighbor-backend
node dev-scripts/create-super-admin.js admin123 SecurePassword123 "Super Admin"
```

### 3. Seed Test Data

```bash
cd good-neighbor-backend
node dev-scripts/seed-test-data.js
```

This will create:
- 2 OSBB Organizations (approved)
- 20 Apartments (10 per OSBB)
- 12 Users (2 admins, 10 residents)
- 4 News items
- 2 Votings (1 active, 1 finished)
- 5 Invitation codes

### 4. Verify Setup

```bash
cd good-neighbor-backend
node dev-scripts/verify-setup.js
```

### 5. Start Application

**Backend:**
```bash
cd good-neighbor-backend
npm start
```

**Frontend:**
```bash
cd good-neighbor-frontend
npm run dev
```

### 6. Access Systems

- **Main App**: http://localhost:5173
  - Login: Use phone/email for regular users
  - Activate: Use invitation codes (OWNER200, OWNER201, etc.)

- **Internal System**: http://localhost:5173/internal/login
  - Login: Use login_id (admin123) and password
  - Access: Dashboard, Database Management, Registrations, Audit Logs

## Test Credentials

### SuperAdmin
- **Login ID**: `admin123`
- **Password**: (your password from create-super-admin.js)

### Regular Users (after seeding)
- **Phone**: `+380501234010` to `+380501234019`
- **Password**: `password123`
- **Roles**: Mix of admin, owner, tenant

### Invitation Codes (after seeding)
- `OWNER200`, `OWNER201`, `OWNER202`, `OWNER203`, `OWNER204`
- Use at `/activate` to create new users

## Database State After Seeding

- **OSBB Organizations**: 2 (both approved)
- **Apartments**: 20 (10 per OSBB)
- **Users**: 12 regular + 1 superadmin = 13 total
- **News**: 4 items
- **Votings**: 2 (1 active, 1 finished)
- **Invitation Codes**: 5 available

## Troubleshooting

### Database Issues
1. Run migrations in order (see `DATABASE_SETUP.md`)
2. Check email column: `psql -U postgres -d good_neighbor_db -f osbb-registration-schema.sql`
3. Verify setup: `node dev-scripts/verify-setup.js`

### Internal System Issues
1. Verify superadmin has `login_id`: `node dev-scripts/check-superadmin.js`
2. Check browser console for API errors
3. Verify backend is running on port 3000
4. Check `localStorage.internal_token` exists

### Data Display Issues
1. Run test data seeding: `node dev-scripts/seed-test-data.js`
2. Check database directly: `node dev-scripts/check-users.js`
3. Verify API responses in browser Network tab
