-- Complete Database Schema Setup
-- Run this file to set up the entire database schema in the correct order

-- 1. Core schema (users, apartments, news, votings, votes, invitation_codes)
\i schema.sql

-- 2. OSBB Registration schema (osbb_organizations, osbb_registration_requests)
\i osbb-registration-schema.sql

-- 3. Security enhancements (osbb_id in users, invitation_codes)
\i security-enhancements.sql

-- 4. Bills schema
\i bills-schema.sql

-- 5. Audit logging schema (audit_logs, super_admin role)
\i audit-logging-schema.sql

-- Note: If using psql command line, you may need to run these individually:
-- psql -U your_user -d your_database -f schema.sql
-- psql -U your_user -d your_database -f osbb-registration-schema.sql
-- psql -U your_user -d your_database -f security-enhancements.sql
-- psql -U your_user -d your_database -f bills-schema.sql
-- psql -U your_user -d your_database -f audit-logging-schema.sql

