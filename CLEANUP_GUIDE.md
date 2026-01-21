# Project Cleanup Guide

## Files to Review/Remove

### 1. Duplicate Internal Panel
**Location**: `good-neighbor-internal-panel/`

**Status**: This is the OLD separate internal panel application. We've now integrated everything into the main frontend at `/internal/*` routes.

**Action**: 
- ✅ **Keep for now** - May contain useful code
- ⚠️ **Note**: All functionality is now in `good-neighbor-frontend/src/pages/internal/`
- Consider removing after confirming everything works in main app

### 2. Temporary/Test Files
**Location**: `good-neighbor-backend/dev-scripts/`

**Files to keep**:
- ✅ `check-users.js` - Useful utility
- ✅ `check-superadmin.js` - Useful utility
- ✅ `create-admin.js` - Useful utility
- ✅ `create-super-admin.js` - Essential
- ✅ `test-db.js` - Useful for debugging
- ✅ `seed-test-data.js` - **NEW** - Comprehensive test data
- ✅ `verify-setup.js` - **NEW** - Setup verification

**Files to review**:
- ⚠️ `brute-force-db.js` - Review if still needed
- ⚠️ `create-test-pdf.js` - Review if still needed
- ⚠️ `debug-env.js` - Review if still needed
- ⚠️ `fix-superadmin.js` - Can be merged into check-superadmin.js
- ⚠️ `seed-votings.js` - Can be merged into seed-test-data.js
- ⚠️ `simulate-billing.js` - Review if still needed
- ⚠️ `test-password.js` - Review if still needed

### 3. Migration Files
**Location**: `good-neighbor-backend/src/db/`

**Keep**:
- ✅ `schema.sql` - Core schema
- ✅ `osbb-registration-schema.sql` - OSBB registration
- ✅ `security-enhancements.sql` - Security features
- ✅ `bills-schema.sql` - Bills table
- ✅ `audit-logging-schema.sql` - Audit logs
- ✅ `run-all-schemas.sql` - Run all schemas
- ✅ `fix-login-id-migration.sql` - **NEW** - Login ID fix
- ✅ `fix-email-index.sql` - **NEW** - Email index fix

**Review**:
- ⚠️ `add-updated-at-column.sql` - Check if already applied

### 4. Documentation Files
**Root directory**:

**Keep**:
- ✅ `handoff_context.md` - **NEEDS UPDATE**
- ✅ `README.md` - Main readme
- ✅ `QUICK_START.md` - Setup guide
- ✅ `ARCHITECTURE.md` - Architecture docs
- ✅ `CHANGELOG.md` - Change history

**Review**:
- ⚠️ `prd.txt` - Product requirements (may be outdated)
- ⚠️ `APPLICATION_DESIGN_BLUEPRINT.md` - May be outdated
- ⚠️ `IMPLEMENTATION_SUMMARY.md` - May be outdated
- ⚠️ `SUPERADMIN_IMPLEMENTATION_COMPLETE.md` - May be outdated
- ⚠️ `SUPERADMIN_PANEL_IMPLEMENTATION.md` - May be outdated
- ⚠️ `OSBB_REGISTRATION_PDF_GUIDE.md` - Keep if still relevant
- ⚠️ `QUICK_START_SECURITY.md` - Keep if still relevant
- ⚠️ `COLOR_MIGRATION.md` - Keep if still relevant
- ⚠️ `THEME_COLORS.md` - Keep if still relevant

**New**:
- ✅ `INTERNAL_SYSTEM_SETUP.md` - **NEW** - Internal system guide
- ✅ `MIGRATION_COMPLETE.md` - **NEW** - Migration status
- ✅ `CLEANUP_GUIDE.md` - **NEW** - This file

## Recommended Cleanup Actions

1. **Consolidate dev scripts** - Merge similar scripts
2. **Archive old docs** - Move outdated docs to `docs/archive/`
3. **Remove duplicate panel** - After confirming main app works
4. **Update handoff** - Reflect current state

## Next Steps

1. Run test data seeding: `node dev-scripts/seed-test-data.js`
2. Test internal system thoroughly
3. Archive outdated documentation
4. Update handoff_context.md
