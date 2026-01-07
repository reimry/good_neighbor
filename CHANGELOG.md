# Changelog - Good Neighbor Platform

## [Unreleased] - January 3, 2026

### Fixed
- **PDF Protocol Authentication**: Fixed "Не авторизовано" error when viewing PDFs in internal panel. Changed from direct URL to authenticated API call with blob response.
- **Database Column Names**: Fixed inconsistency between `protocol_pdf_path` and `protocol_path`. All code now uses `protocol_path` to match schema.
- **Missing Updated At Column**: Added `updated_at` column to `osbb_registration_requests` table with migration script.
- **OSBB Status Constraint**: Fixed error when setting status to `'active'`. Changed to use `'approved'` which matches schema constraint.
- **Password Hash Usage**: Fixed approval route trying to hash non-existent `head_password`. Now uses existing `password_hash` directly.
- **Audit Log JSON Rendering**: Fixed React error when rendering JSONB objects. Updated `formatJson()` to handle both objects and strings.

### Changed
- Internal panel PDF viewer now uses authenticated API calls instead of direct URLs
- All protocol path references standardized to `protocol_path`
- OSBB approval now sets status to `'approved'` instead of `'active'`
- Registration approval now properly tracks `reviewed_at`, `reviewed_by`, and `user_id`

### Added
- Migration script: `add-updated-at-column.sql` for adding `updated_at` column
- Sample PDF creation script: `create-test-pdf.js` for testing OSBB registration
- Documentation: `OSBB_REGISTRATION_PDF_GUIDE.md` for PDF upload testing

---

## [1.0.0] - January 2-3, 2026

### Added
- **SuperAdmin Panel & Audit Logging System**
  - Complete internal operations system
  - Global dashboard with ecosystem statistics
  - OSBB registration moderation (global)
  - Audit log explorer with advanced filtering
  - PDF protocol viewer
  - Comprehensive audit logging service

- **Database Enhancements**
  - `audit_logs` table with comprehensive tracking
  - `super_admin` role support
  - `updated_at` column for registration requests
  - Automatic data cleanup in security enhancements

- **Security Features**
  - SuperAdmin role with global access (osbb_id = NULL)
  - All actions logged in audit system
  - Automatic data sanitization (passwords never logged)
  - Safe file serving (directory traversal prevention)

### Changed
- JWT tokens now include `osbb_id` for proper role checks
- All internal routes require `super_admin` authentication
- Audit logging integrated into auth, moderation, and voting routes

---

## Previous Versions

See `IMPLEMENTATION_SUMMARY.md` and `handoff_context.md` for earlier changes.

