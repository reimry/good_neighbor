# Admin User Setup Guide

## Problem
The system doesn't have pre-existing admin users with known passwords. Users must be created through invitation codes or directly via script.

## Solution Options

### Option 1: Check Existing Users (Recommended First Step)
Run this to see what users exist in your database:
```bash
cd good-neighbor-backend
node dev-scripts/check-users.js
```

This will show:
- All existing users (phone, email, role)
- Available invitation codes
- Whether you need to create an admin

### Option 2: Create Admin via Script (Easiest)
Create an admin user directly:
```bash
cd good-neighbor-backend
node dev-scripts/create-admin.js
```

This interactive script will:
1. Show existing users
2. Prompt you for:
   - Phone number (+380XXXXXXXXX)
   - Email (optional)
   - Full Name
   - Password (min 6 characters)
3. Create the admin user

### Option 3: Use Invitation Code
If you have an unused invitation code:

1. Go to `/activate` in your frontend
2. Enter invitation code: `ADMIN001` (if not already used)
3. Fill in your details and password
4. This creates an admin account

### Option 4: Reset Database and Use Invitation Code
If all invitation codes are used:

1. Reset the database (WARNING: Deletes all data):
   ```sql
   -- Run the schema.sql file which resets everything
   psql -U postgres -d good_neighbor_db -f src/db/schema.sql
   ```

2. This creates a fresh `ADMIN001` invitation code
3. Go to `/activate` and use code `ADMIN001`

## Quick Admin Creation (One-liner)

If you want to quickly create an admin without the interactive script, you can modify `create-admin.js` or use SQL directly:

```sql
-- First, ensure ADMIN apartment exists
INSERT INTO apartments (number, area, balance) 
VALUES ('ADMIN', 0, 0) 
ON CONFLICT DO NOTHING;

-- Create admin user (replace values)
INSERT INTO users (phone, password_hash, full_name, role, apartment_id)
VALUES (
  '+380501234567',  -- Your phone
  '$2b$10$...',     -- bcrypt hash of your password (use create-admin.js to generate)
  'Admin User',      -- Your name
  'admin',
  (SELECT id FROM apartments WHERE number = 'ADMIN')
);
```

**Note**: Generating bcrypt hashes manually is complex. Use the script instead!

## Login After Creation

Once you have an admin user:
- Go to `/login`
- Use the **phone number** (or email if you set one) as username
- Enter the password you set

## Troubleshooting

### "No users found"
- Run `node dev-scripts/create-admin.js` to create one

### "Invitation code already used"
- Use the create-admin script instead
- Or reset the database (loses all data)

### "Can't login"
- Make sure you're using the phone/email you registered with
- Passwords are case-sensitive
- Check that the user exists: `node dev-scripts/check-users.js`

### "Permission denied" errors
- Make sure the user role is 'admin' (not 'owner' or 'tenant')
- Check with: `node dev-scripts/check-users.js`


