# OSBB Head Registration System

## Overview
This system implements a secure registration flow for Heads of OSBB (Association of co-owners) with mock EDR and DRRP registry verification.

## Setup Instructions

### 1. Install Dependencies
```bash
cd good-neighbor-backend
npm install argon2 multer
```

### 2. Database Migration
Run the OSBB registration schema:
```bash
# Connect to PostgreSQL and run:
psql -U postgres -d good_neighbor_db -f src/db/osbb-registration-schema.sql
```

Or manually execute the SQL from `src/db/osbb-registration-schema.sql`

### 3. Create Uploads Directory
```bash
mkdir -p good-neighbor-backend/uploads/protocols
```

## Security Features

### Password Hashing
- Uses **Argon2id** (memory-hard, resistant to GPU attacks)
- Parameters: 64MB memory, 3 iterations, 4 parallelism
- More secure than bcrypt for cybersecurity projects

### RBAC (Role-Based Access Control)
- Registration requests require admin approval
- Only approved registrations create admin accounts
- All admin routes protected with `requireRole('admin')`

### Data Security
- Mock registry data is server-side only (not modifiable by client)
- PDF files stored securely with unique filenames
- All inputs validated server-side with express-validator

## Mock Registry Data

### EDR (Unified State Register) - Test EDRPOU Codes:
- `12345678` - ОСББ "СОНЯЧНИЙ" (Київ)
- `87654321` - ОСББ "МІЙ ДІМ" (Львів)
- `11111111` - ОСББ "ЗЕЛЕНИЙ КВАРТАЛ" (Одеса)

### DRRP (Property Rights Register) - Test RNOKPP:
- `1234567890` - Петренко Іван Олександрович (for EDRPOU 12345678)
- `9876543210` - Коваленко Марія Василівна (for EDRPOU 87654321)

## Registration Workflow

1. **Step 1: EDRPOU Verification**
   - User enters 8-digit EDRPOU
   - System calls Mock EDR API
   - Pre-fills OSBB name and address

2. **Step 2: Head Identity Verification**
   - User enters RNOKPP (10 digits) and Full Name
   - System verifies against EDR `authorized_person`
   - System checks DRRP for property ownership
   - Calculates voting weight (total property area)

3. **Step 3: Account Creation & Submission**
   - User provides email, phone, password
   - User uploads Protocol PDF (max 5MB)
   - Password hashed with Argon2
   - Registration request created (status: PENDING)

4. **Admin Approval**
   - Admin reviews registration request
   - Admin downloads and reviews PDF protocol
   - Admin approves → Creates admin user account
   - Admin rejects → Stores rejection reason

## API Endpoints

### Public Registration Routes
- `POST /api/register/verify-edrpou` - Verify EDRPOU
- `POST /api/register/verify-head` - Verify Head identity
- `POST /api/register/submit` - Submit registration (with PDF upload)

### Admin Routes (Protected)
- `GET /api/admin/registrations` - List all registration requests
- `GET /api/admin/registrations/:id` - Get registration details
- `GET /api/admin/registrations/:id/protocol` - Download PDF protocol
- `PATCH /api/admin/registrations/:id/approve` - Approve registration
- `PATCH /api/admin/registrations/:id/reject` - Reject registration

## Frontend Routes

- `/register-osbb` - Registration page (public)
- `/admin/registrations` - Admin registration management (admin only)

## Testing the Registration Flow

1. Go to `/register-osbb`
2. Enter EDRPOU: `12345678`
3. Verify Head:
   - RNOKPP: `1234567890`
   - Full Name: `Петренко Іван Олександрович`
4. Fill account details and upload PDF
5. Submit registration
6. Login as admin and go to `/admin/registrations`
7. Review and approve/reject the request

## Notes

- Mock registry data is in `src/services/mockRegistry.js`
- PDF files stored in `uploads/protocols/`
- Email field added to users table (supports email login)
- All validation is server-side for security


