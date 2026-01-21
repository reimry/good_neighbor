Good Neighbor - Project Context & Handoff
Date: January 3, 2026 Status: MVP Complete + OSBB Registration + SuperAdmin Panel

📌 Project Overview
"Good Neighbor" is an OSBB (Homeowners Association) management platform.

Backend: Node.js, Express, PostgreSQL (Raw SQL queries).
Frontend: React (Vite), Tailwind CSS (v3.4), Axios.
Database: PostgreSQL (good_neighbor_db).

✅ Accomplished Features

Phase 1-4: Core MVP (Completed)
- Authentication & Activation:
  - Users activate accounts using Invitation Codes (e.g., OWNER101).
  - JWT-based auth with PrivateRoute protection.
  - Roles: admin, resident (owner, tenant), super_admin.
  - **Regular users**: Login with phone or email
  - **SuperAdmins**: Login with login_id
  - Dual password hashing support: bcrypt (legacy) and Argon2 (new registrations).

- Dashboard:
  - Balance Widget: Shows real-time financial status (Green = Paid, Red = Debt).
  - Top News: Quick view of latest announcements.
  - Apartment Info: Number and Area sq.m.

- News System:
  - Paginated list of news (/news).
  - NewsCard UI component.
  - Admin can create and delete news.

- Voting System (Core Feature):
  - Active Votings: Users can vote "For", "Against", or "Abstain".
  - Finished Votings: Visual progress bars of results.
  - Logic: Supports simple (1 person = 1 vote) and legal (weighted by apartment area).
  - Admin can create votings with start/end dates.

Phase 5: Admin Panel (Completed)
- AdminDashboard: Main admin panel with navigation cards.
- CreateNewsPage: Form for admins to post news.
- CreateVotingPage: Form for admins to create votings.
- AdminApartmentsPage: Manage apartments and generate invitation codes.
- RoleGuard component: Protects admin routes.

Phase 6: User Features (Completed)
- ProfilePage: Users can update phone numbers and passwords.
- ServicesPage: View monthly bills breakdown by service type (rent, water, electricity, etc.).
- Bills table: Tracks monthly services per apartment.

Phase 7: OSBB Registration System (Completed - Cybersecurity Project Feature)
- Mock Registry Services:
  - EDR (Unified State Register) mock API for OSBB verification.
  - DRRP (State Register of Real Property Rights) mock API for property ownership.
- Registration Flow:
  - Step 1: Verify EDRPOU → Get OSBB data from mock EDR.
  - Step 2: Verify Head identity (RNOKPP + Full Name) → Check against EDR authorized_person.
  - Step 3: Submit registration with PDF protocol upload.
  - Status: PENDING → Admin approval required.
- Admin Registration Management:
  - AdminRegistrationsPage: Review, approve, or reject OSBB registration requests.
  - Download PDF protocols.
  - On approval: Creates admin account automatically with Argon2-hashed password.
- Security:
  - Argon2id password hashing (64MB memory, 3 iterations, 4 parallelism).
  - RBAC: All admin routes protected.
  - Server-side validation only (mock data not modifiable by client).

Phase 8: SuperAdmin Panel & Audit Logging System (Completed - Updated January 2026)
- Internal Management System:
  - **Integrated into main frontend** at `/internal/*` routes (port 5173)
  - Separate authentication context (`InternalAuthContext`) with `internal_token` storage
  - SuperAdmin role with global access (osbb_id = NULL)
  - Ecosystem-wide management and monitoring
  - **Note**: Old separate panel (`good-neighbor-internal-panel`) exists but is deprecated
- Audit Logging:
  - Comprehensive audit trail for all critical actions
  - Automatic data sanitization (passwords, tokens never logged)
  - Tracks: logins, registrations, voting operations, super admin actions
  - Advanced filtering and search capabilities
- SuperAdmin Features:
  - Global Dashboard (`/internal/dashboard`): Statistics across all OSBBs
  - Database Management (`/internal/database`): Full CRUD for users, organizations, apartments
  - OSBB Registration Moderation (`/internal/registrations`): Review and approve/reject requests
  - Audit Log Explorer (`/internal/audit-logs`): Filter by actor, OSBB, action type, date range
  - PDF Protocol Viewer: Safe viewing of uploaded registration documents
- Authentication:
  - SuperAdmins use `login_id` (not phone/email) for login
  - Regular users use phone/email for login
  - Architectural separation: `login_id` nullable (only superadmins have it)
- Security:
  - All internal routes require `super_admin` role
  - Super admins bypass tenant isolation (osbb_id = NULL)
  - All actions logged in audit system
  - Safe file serving (directory traversal prevention)

🎨 Design System
- Color Palette (Updated):
  - Primary: Dark Forest Green (#1B5E37) - Main brand color.
  - Accent: Vibrant Lime Green (#8DC63F) - Success states, positive indicators.
  - Warning: Bright Orange (#E67E22) - Warnings, debt indicators.
  - Neutral: Grey scale (#F9FBF9 to #2D3436) - Backgrounds and text.
  - White: #FFFFFF - Card backgrounds.
  - See: `good-neighbor-frontend/THEME_COLORS.md` for full documentation.
- Fonts: Inter (Body) and Montserrat (Headings).
- Responsive UI with Logo component.

🛠️ Environment & Setup
Credentials (Local):
- DB User: postgres
- DB Password: admin (check .env file)
- Invitation Codes: 
  - ADMIN001 (Admin) - May be used
  - OWNER101 (Resident) - Available

Running the Project:
- Backend:
  ```bash
  cd good-neighbor-backend
  npm start
  # Runs on http://localhost:3000
  ```
- Frontend (Main App):
  ```bash
  cd good-neighbor-frontend
  npm run dev
  # Runs on http://5173
  ```
- Internal Panel (SuperAdmin):
  ```bash
  cd good-neighbor-internal-panel
  npm install  # First time only
  npm run dev
  # Runs on http://localhost:5174
  ```

Repository & Gitignore (Important):
- A new `QUICK_START.md` is available at repository root with step-by-step setup commands (DB init, env, and how to run services).
- Keep secret files and runtime uploads out of Git:
  - **Do not commit**: `.env`, `.env.*`, `good-neighbor-backend/uploads/`, `node_modules/`, and any local editor config.
  - **Commit**: `.env.example` (shows required environment variables), `package-lock.json`/`yarn.lock` (lockfiles), and all code and SQL migration files.
- If you move or add sample files used in local development, add them to `.gitignore` to avoid leaking secrets or large assets.

(See `QUICK_START.md` for precise install commands and environment variable guidance.)

Dev Scripts (good-neighbor-backend/dev-scripts/):
- `test-db.js`: Debug database connection.
- `check-users.js`: List all users and invitation codes.
- `check-superadmin.js`: Check superadmin users and their login_id status.
- `fix-superadmin.js`: Check and diagnose superadmin user issues.
- `verify-setup.js`: **NEW** - Comprehensive setup verification.
- `seed-test-data.js`: **NEW** - Comprehensive test data seeding (OSBBs, users, apartments, news, votings).
- `create-admin.js`: Interactive script to create admin user.
- `create-super-admin.js`: Create super admin user (for internal system).
- `test-password.js`: Test password verification for a user.
- `seed-votings.js`: Add test voting data (can use seed-test-data.js instead).
- `simulate-billing.js`: Simulate monthly bill generation.

⚠️ Key Technical Notes
- Tailwind Version: v3.4.17. Do NOT upgrade to v4 without migrating config.
- Database Config: Uses individual .env vars (DB_USER, DB_PASSWORD, etc.) instead of DATABASE_URL.
- Security: JWT_SECRET is in .env.
- Password Hashing: 
  - Legacy users: bcrypt (hashes start with $2a$, $2b$, $2y$).
  - New registrations: Argon2id (hashes start with $argon2).
  - Login route automatically detects hash format and uses correct verification.
- File Uploads: PDF protocols stored in `good-neighbor-backend/uploads/protocols/`.
- Authentication Architecture:
  - **Regular users**: Use phone/email for login, `login_id` is NULL
  - **SuperAdmins**: Use `login_id` for login, phone/email is NULL
  - `login_id` column is nullable (only superadmins require it)
  - Migration: `fix-login-id-migration.sql` applied

📊 Database Schema
Core Tables:
- users (with email column and osbb_id for OSBB context)
- apartments (with osbb_id for tenant isolation)
- news
- votings (with osbb_id for OSBB-specific votings)
- votes
- invitation_codes (with osbb_id and used_at timestamp)
- bills (monthly services)

OSBB Registration Tables:
- osbb_organizations (EDRPOU, address, authorized_person, status)
- osbb_registration_requests (Head info, PDF path, status)

Audit & Security Tables:
- audit_logs (comprehensive action logging with actor, OSBB, entity tracking)

Migration Files (Run in Order):
1. `src/db/schema.sql` - Core schema
2. `src/db/osbb-registration-schema.sql` - OSBB registration tables
3. `src/db/security-enhancements.sql` - OSBB context (osbb_id columns)
4. `src/db/bills-schema.sql` - Bills table
5. `src/db/audit-logging-schema.sql` - Audit logs and super_admin role

See: `good-neighbor-backend/DATABASE_SETUP.md` for detailed setup instructions.

🔐 API Endpoints

Authentication:
- POST /api/auth/login - Login (supports phone or email)
- POST /api/auth/activate - Activate account with invitation code

Dashboard:
- GET /api/dashboard - Get user dashboard data

News:
- GET /api/news?page=1&limit=10 - List news
- POST /api/news - Create news (admin only)
- DELETE /api/news/:id - Delete news (admin only)

Votings:
- GET /api/votings - List all votings
- GET /api/votings/:id - Get voting details
- POST /api/votings - Create voting (admin only)
- POST /api/votings/:id/vote - Cast vote
- PATCH /api/votings/:id/close - Close voting (admin only)

Profile:
- GET /api/profile - Get current user profile
- PATCH /api/profile/phone - Update phone number
- PATCH /api/profile/password - Change password

Services:
- GET /api/services - Get all bills grouped by month
- GET /api/services/:month - Get bills for specific month

Admin:
- GET /api/admin/apartments - List apartments with status
- POST /api/admin/invitations/generate - Generate invitation code
- GET /api/admin/invitations - List all invitation codes
- GET /api/admin/registrations - List registration requests (OSBB-scoped)
- GET /api/admin/registrations/:id - Get registration details
- GET /api/admin/registrations/:id/protocol - Download PDF
- PATCH /api/admin/registrations/:id/approve - Approve registration
- PATCH /api/admin/registrations/:id/reject - Reject registration
- POST /api/admin/billing/generate - Generate bills for a month

Internal (SuperAdmin Only):
- GET /api/internal/dashboard/stats - Global ecosystem statistics
- GET /api/internal/registrations - List all registration requests (global)
- GET /api/internal/registrations/:id - Get registration details
- GET /api/internal/registrations/:id/protocol - Download PDF protocol
- PATCH /api/internal/registrations/:id/approve - Approve registration
- PATCH /api/internal/registrations/:id/reject - Reject registration
- GET /api/internal/audit-logs - Get audit logs with filters
- GET /api/internal/audit-logs/stats - Get audit log statistics

Database Administration (SuperAdmin Only):
- GET /api/internal/db/users - List users with filters and pagination
- GET /api/internal/db/users/:id - Get user details
- PATCH /api/internal/db/users/:id - Update user
- DELETE /api/internal/db/users/:id - Delete user
- GET /api/internal/db/organizations - List OSBB organizations
- GET /api/internal/db/organizations/:id - Get organization details
- PATCH /api/internal/db/organizations/:id - Update organization
- GET /api/internal/db/apartments - List apartments with filters

OSBB Registration:
- POST /api/register/verify-edrpou - Verify EDRPOU (Step 1)
- POST /api/register/verify-head - Verify Head identity (Step 2)
- POST /api/register/submit - Submit registration with PDF (Step 3)

🎭 Frontend Routes

**Main Application** (Port 5173):

Public:
- /login - Login page (phone/email for regular users)
- /activate - Activate account with invitation code
- /register-osbb - OSBB Head registration (3-step form)

Protected (All Users):
- /dashboard - User dashboard
- /news - News list
- /votings - Votings list
- /services - Services and payments
- /profile - User profile (update phone/password)

Admin Only:
- /admin - Admin dashboard
- /admin/news/create - Create news
- /admin/votings/create - Create voting
- /admin/apartments - Manage apartments
- /admin/registrations - Manage OSBB registrations (OSBB-scoped)

**Internal Management System** (Port 5173, `/internal/*` routes):

SuperAdmin Only:
- /internal/login - SuperAdmin login (login_id)
- /internal/dashboard - Global ecosystem dashboard
- /internal/database - Database management (users, organizations, apartments)
- /internal/registrations - Global OSBB registration moderation
- /internal/audit-logs - Audit log explorer with advanced filters

**Note**: Old separate internal panel (`good-neighbor-internal-panel` on port 5174) exists but is deprecated. All functionality is now integrated into main app.

🧪 Mock Registry Data (For Testing)

EDR Test EDRPOU Codes:
- `12345678` - ОСББ "СОНЯЧНИЙ" (Київ)
  - Authorized Person: Петренко Іван Олександрович
  - RNOKPP: 1234567890
- `87654321` - ОСББ "МІЙ ДІМ" (Львів)
  - Authorized Person: Коваленко Марія Василівна
  - RNOKPP: 9876543210
- `11111111` - ОСББ "ЗЕЛЕНИЙ КВАРТАЛ" (Одеса)
  - Authorized Person: Сидоренко Олексій Петрович

See: `good-neighbor-backend/src/services/mockRegistry.js` for full mock data.

🐛 Known Issues & Fixes

Password Verification (FIXED):
- Issue: Login route tried Argon2 first, causing errors with bcrypt hashes.
- Fix: Hash format detection added - automatically uses correct verification method.
- Status: ✅ Fixed in auth.js

Color Theme (UPDATED):
- Issue: Old blue/teal theme didn't match design.
- Fix: Updated to green/orange palette from color_palette.png.
- Status: ✅ Complete - See THEME_COLORS.md

SuperAdmin Panel Issues (FIXED - January 3, 2026):
- PDF Protocol Authentication: Fixed "Не авторизовано" error. Changed to authenticated API calls.
- Database Column Names: Fixed `protocol_pdf_path` vs `protocol_path` inconsistency.
- Missing Updated At: Added `updated_at` column with migration script.
- OSBB Status Constraint: Fixed `'active'` vs `'approved'` status mismatch.
- Password Hash Usage: Fixed approval route to use existing `password_hash`.
- Audit Log JSON: Fixed React rendering error for JSONB objects.
- Status: ✅ All fixed - See CHANGELOG.md for details

📚 Documentation Files

- `ADMIN_SETUP.md` - Guide for creating/administering admin users
- `README-REGISTRATION.md` - OSBB registration system documentation
- `THEME_COLORS.md` - Color palette documentation
- `COLOR_MIGRATION.md` - Guide for migrating old colors to new theme
- `DATABASE_SETUP.md` - Database schema setup and migration guide
- `SUPERADMIN_IMPLEMENTATION_COMPLETE.md` - Complete SuperAdmin panel guide (⭐ **START HERE**)
- `IMPLEMENTATION_SUMMARY.md` - Security and billing enhancements summary
- `ARCHITECTURE.md` - Complete application flow and data architecture
- `OSBB_REGISTRATION_PDF_GUIDE.md` - PDF upload testing guide
- `CHANGELOG.md` - Detailed change history and bug fixes

🚀 Next Steps (Roadmap)

Completed:
- ✅ Admin Panel (all features)
- ✅ Profile Page
- ✅ Services/Payments
- ✅ OSBB Registration System
- ✅ Color Theme Update
- ✅ Password Verification Fix
- ✅ Admin Invitation System (OSBB-scoped)
- ✅ Advanced Voting Security (immutability, OSBB isolation)
- ✅ Billing Engine (monthly bill generation)
- ✅ SuperAdmin Panel & Audit Logging System
- ✅ Internal Management System (integrated into main app)
- ✅ Database Administration Interface
- ✅ Authentication Architecture Separation (login_id for superadmins)
- ✅ Test Data Seeding Script

Current Status (January 2026):
- ✅ Internal system routes working (`/internal/*`)
- ✅ Database management interface functional
- ✅ Test data seeding available
- ⚠️ Need to populate database with test data
- ⚠️ Old internal-panel directory can be archived

Future Enhancements:
- Payment History: Track payment transactions
- PDF Export: Export bills and voting protocols
- Notifications: Email/SMS alerts for important events
- Mobile App: React Native version
- Advanced Reporting: Financial reports, voting analytics
- Multi-language Support: Ukrainian/English toggle

🔧 Troubleshooting

Can't Login as Admin:
1. Run: `node dev-scripts/check-users.js` to see existing users
2. Run: `node dev-scripts/create-admin.js` to create new admin
3. See: `ADMIN_SETUP.md` for detailed guide

Password Not Working:
1. Check hash format: `node dev-scripts/test-password.js <phone> <password>`
2. Verify user exists: `node dev-scripts/check-users.js`
3. Password verification now auto-detects hash format (bcrypt/Argon2)

Database Issues:
1. Check connection: `node dev-scripts/test-db.js`
2. Verify .env file has correct credentials
3. Run migrations in order (see `DATABASE_SETUP.md`):
   - schema.sql
   - osbb-registration-schema.sql
   - security-enhancements.sql
   - bills-schema.sql
   - audit-logging-schema.sql
4. If foreign key errors occur, the security-enhancements.sql script will automatically clean up invalid references

Color Theme Not Applied:
1. Check `tailwind.config.js` has new color palette
2. Run: `npm run dev` to rebuild Tailwind
3. See: `COLOR_MIGRATION.md` for migration guide

---

**Last Updated**: January 2026  
**Status**: Production Ready (MVP + OSBB Registration + Internal Management System)  
**Version**: 1.1.0  
**All Known Issues**: ✅ Fixed

**Recent Updates (January 2026)**:
- ✅ Integrated Internal Management System into main frontend (`/internal/*` routes)
- ✅ Created Database Administration interface (users, organizations, apartments CRUD)
- ✅ Fixed authentication architecture (login_id for superadmins, phone/email for regular users)
- ✅ Added comprehensive test data seeding script
- ✅ Fixed database queries to handle missing email column gracefully
- ✅ Created RegistrationsPage and AuditLogsPage for internal system
- ✅ Fixed apartments query GROUP BY clause
- ✅ Updated API routes for database management

**Previous Fixes (January 3, 2026)**:
- ✅ PDF protocol authentication in internal panel
- ✅ Database column name consistency (`protocol_path`)
- ✅ Missing `updated_at` column added
- ✅ OSBB status constraint fixed (`'approved'` instead of `'active'`)
- ✅ Password hash usage in approval route
- ✅ Audit log JSON rendering

See `CHANGELOG.md` for detailed change history.
