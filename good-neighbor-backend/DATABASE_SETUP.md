# Database Setup Guide

## Schema Migration Order

The database schemas must be run in the following order to avoid foreign key constraint errors:

### 1. Core Schema (`schema.sql`)
Creates the base tables:
- `users`
- `apartments`
- `news`
- `votings`
- `votes`
- `invitation_codes`

### 2. OSBB Registration Schema (`osbb-registration-schema.sql`)
Creates OSBB-related tables:
- `osbb_organizations` (required by audit logs)
- `osbb_registration_requests`
- Adds `email` column to `users` table

### 3. Security Enhancements (`security-enhancements.sql`)
Adds OSBB context:
- Adds `osbb_id` to `users` table
- Adds `osbb_id` to `invitation_codes` table

### 4. Bills Schema (`bills-schema.sql`)
Creates billing tables:
- `bills`

### 5. Audit Logging Schema (`audit-logging-schema.sql`)
Creates audit system:
- `audit_logs` (references `osbb_organizations`)
- Adds `super_admin` role support
- **Note:** This schema will create `osbb_organizations` if it doesn't exist, but it's recommended to run `osbb-registration-schema.sql` first.

## Quick Setup

Run all schemas in order:

```bash
cd good-neighbor-backend/src/db

# Using psql
psql -U your_user -d your_database -f schema.sql
psql -U your_user -d your_database -f osbb-registration-schema.sql
psql -U your_user -d your_database -f security-enhancements.sql
psql -U your_user -d your_database -f bills-schema.sql
psql -U your_user -d your_database -f audit-logging-schema.sql
```

**Note**: The `security-enhancements.sql` script has been updated to automatically handle existing data:
- Cleans up invalid `osbb_id` references (sets to NULL if OSBB doesn't exist)
- Creates a placeholder OSBB (id=1) if apartments reference it
- Safely adds foreign key constraints after data cleanup

If you see foreign key errors, the script will handle them automatically.

## Important Notes

### Field Name Consistency

- **Protocol Path:** The `osbb_registration_requests` table uses `protocol_path` (not `protocol_pdf_path`)
- **Address:** The `osbb_organizations` table stores address as separate columns:
  - `address_city`
  - `address_street`
  - `address_building`
  - The API constructs a JSON object from these columns when needed
- **Status Values:** `osbb_organizations.status` only allows: `'pending'`, `'approved'`, `'rejected'` (NOT `'active'`)
- **Updated At:** `osbb_registration_requests` table has `updated_at` column (added in migration)

### Super Admin Users

Super admin users must have:
- `role = 'super_admin'`
- `osbb_id = NULL` (for global access)

Create a super admin:
```bash
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

## Troubleshooting

### Error: relation "osbb_organizations" does not exist

**Solution:** Run `osbb-registration-schema.sql` first, or the `audit-logging-schema.sql` will create it automatically.

### Error: column "osbb_id" does not exist

**Solution:** Run `security-enhancements.sql` to add `osbb_id` columns.

### Error: constraint "users_role_check" does not exist

**Solution:** This is normal if the constraint doesn't exist yet. The `audit-logging-schema.sql` will handle it.

### Error: insert or update violates foreign key constraint "apartments_osbb_id_fkey"

**Solution:** The `security-enhancements.sql` script now automatically handles this:
- Sets invalid `osbb_id` values to NULL
- Creates a placeholder OSBB if needed
- Then adds the foreign key constraint safely

If you still see this error, it means the script hasn't been updated. Make sure you're using the latest version.

### Error: column "updated_at" does not exist

**Solution:** Run the migration to add the column:
```bash
psql -U postgres -d good_neighbor_db -f src/db/add-updated-at-column.sql
```

Or manually:
```sql
ALTER TABLE osbb_registration_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
```

### Error: status = 'active' violates constraint "osbb_organizations_status_check"

**Solution:** The schema only allows `'pending'`, `'approved'`, or `'rejected'`. Use `'approved'` instead of `'active'`. This has been fixed in the code.

