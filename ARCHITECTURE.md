# Good Neighbor - Architecture & Data Flow Documentation

**Last Updated**: January 2, 2026  
**Purpose**: Complete technical documentation of application flow, data flow, and file/function responsibilities.

---

## 📋 Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [OSBB Registration Flow](#osbb-registration-flow)
3. [Voting System Flow](#voting-system-flow)
4. [News System Flow](#news-system-flow)
5. [User Profile Management](#user-profile-management)
6. [Services/Bills Flow](#servicesbills-flow)
7. [Admin Operations](#admin-operations)
8. [Database Schema & Relationships](#database-schema--relationships)
9. [Data Transformations](#data-transformations)
10. [Security & Validation](#security--validation)

---

## 🔐 Authentication Flow

### User Login

**Files Involved:**
- `good-neighbor-backend/src/routes/auth.js` - `POST /api/auth/login`
- `good-neighbor-backend/src/middleware/authMiddleware.js` - `authenticate()`, `generateToken()`
- `good-neighbor-frontend/src/pages/LoginPage.jsx` - Login form
- `good-neighbor-frontend/src/contexts/AuthContext.jsx` - `login()` function
- `good-neighbor-frontend/src/services/api.js` - Axios instance with interceptors

**Flow:**
1. **Frontend**: User enters phone/email + password in `LoginPage.jsx`
2. **Frontend**: `AuthContext.login()` calls `api.post('/auth/login', { phone, password })`
3. **Backend**: `auth.js` route handler receives request
4. **Backend**: Query user by phone OR email:
   ```javascript
   const isEmail = phone.includes('@');
   const query = isEmail 
     ? 'SELECT * FROM users WHERE email = $1'
     : 'SELECT * FROM users WHERE phone = $1';
   ```
5. **Backend**: Password verification (auto-detects hash format):
   - Bcrypt hash (`$2b$...`) → `bcrypt.compare()`
   - Argon2 hash (`$argon2...`) → `argon2.verify()`
6. **Backend**: Generate JWT token via `generateToken(user)`:
   ```javascript
   jwt.sign({ id, role, apartment_id, full_name }, JWT_SECRET, { expiresIn: '24h' })
   ```
7. **Backend**: Return `{ token, user: { id, role, full_name, apartment } }`
8. **Frontend**: Store token in `localStorage`, update `AuthContext`
9. **Frontend**: Redirect to `/dashboard`

**Database Operations:**
- `SELECT * FROM users WHERE phone = $1 OR email = $1`
- `SELECT number, area FROM apartments WHERE id = $1` (if apartment_id exists)

---

### Account Activation (Invitation Code)

**Files Involved:**
- `good-neighbor-backend/src/routes/auth.js` - `POST /api/auth/activate`
- `good-neighbor-frontend/src/pages/ActivatePage.jsx` - Activation form
- `good-neighbor-frontend/src/contexts/AuthContext.jsx` - `activate()` function

**Flow:**
1. **Frontend**: User enters invitation code, password, full_name, phone
2. **Backend**: Validate invitation code:
   ```sql
   SELECT * FROM invitation_codes WHERE code = $1 AND is_used = FALSE
   ```
3. **Backend**: Check if phone already exists
4. **Backend**: Hash password with bcrypt:
   ```javascript
   const hashedPassword = await bcrypt.hash(password, 10);
   ```
5. **Backend**: Create user:
   ```sql
   INSERT INTO users (phone, password_hash, full_name, role, apartment_id)
   VALUES ($1, $2, $3, $4, $5)
   ```
6. **Backend**: Mark invitation code as used:
   ```sql
   UPDATE invitation_codes SET is_used = TRUE WHERE id = $1
   ```
7. **Backend**: Generate JWT token and return
8. **Frontend**: Store token, redirect to dashboard

**Database Operations:**
- `SELECT * FROM invitation_codes WHERE code = $1 AND is_used = FALSE`
- `SELECT id FROM users WHERE phone = $1` (duplicate check)
- `INSERT INTO users (...)`
- `UPDATE invitation_codes SET is_used = TRUE WHERE id = $1`
- `SELECT number, area FROM apartments WHERE id = $1`

---

## 🏢 OSBB Registration Flow

### Step 1: EDRPOU Verification

**Files Involved:**
- `good-neighbor-backend/src/routes/register.js` - `POST /api/register/verify-edrpou`
- `good-neighbor-backend/src/services/mockRegistry.js` - `verifyEDRPOU()`
- `good-neighbor-frontend/src/pages/RegisterOSBBPage.jsx` - Step 1 form

**Flow:**
1. **Frontend**: User enters 8-digit EDRPOU
2. **Backend**: Validate format (8 digits)
3. **Backend**: Check if OSBB already registered:
   ```sql
   SELECT id, status FROM osbb_organizations WHERE edrpou = $1
   ```
4. **Backend**: Call Mock EDR API:
   ```javascript
   const osbbData = verifyEDRPOU(edrpou);
   // Returns: { edrpou, full_name, address, authorized_person, status }
   ```
5. **Backend**: Store/update OSBB in database (status: 'pending'):
   ```sql
   INSERT INTO osbb_organizations (edrpou, full_name, address_city, ...)
   VALUES ($1, $2, $3, ...)
   ```
6. **Backend**: Return OSBB data to frontend
7. **Frontend**: Display OSBB info, proceed to Step 2

**Database Operations:**
- `SELECT id, status FROM osbb_organizations WHERE edrpou = $1`
- `INSERT INTO osbb_organizations (...)` or `UPDATE osbb_organizations SET ...`

**Mock Data Source:**
- `mockRegistry.js` - `mockEDRDatabase` object with test EDRPOU codes

---

### Step 2: Head Identity Verification

**Files Involved:**
- `good-neighbor-backend/src/routes/register.js` - `POST /api/register/verify-head`
- `good-neighbor-backend/src/services/mockRegistry.js` - `verifyHeadIdentity()`, `verifyPropertyOwnership()`
- `good-neighbor-frontend/src/pages/RegisterOSBBPage.jsx` - Step 2 form

**Flow:**
1. **Frontend**: User enters RNOKPP (10 digits) + Full Name
2. **Backend**: Verify OSBB exists in database
3. **Backend**: Call Mock Registry:
   ```javascript
   const verification = verifyHeadIdentity(edrpou, rnokpp, fullName);
   // Checks:
   // 1. EDR authorized_person matches fullName
   // 2. DRRP has properties for this RNOKPP + EDRPOU
   // 3. Calculates total voting weight (sum of property areas)
   ```
4. **Backend**: Return verification result:
   ```json
   {
     "verified": true,
     "osbb_data": {...},
     "properties": [...],
     "total_voting_weight": 1250.5
   }
   ```
5. **Frontend**: Display verification success, proceed to Step 3

**Database Operations:**
- `SELECT id FROM osbb_organizations WHERE edrpou = $1`

**Mock Data Source:**
- `mockRegistry.js` - `mockEDRDatabase` and `mockDRRPDatabase` objects

---

### Step 3: Registration Submission

**Files Involved:**
- `good-neighbor-backend/src/routes/register.js` - `POST /api/register/submit`
- `good-neighbor-backend/src/routes/register.js` - Multer file upload config
- `good-neighbor-frontend/src/pages/RegisterOSBBPage.jsx` - Step 3 form

**Flow:**
1. **Frontend**: User fills form (email, phone, password, confirm_password)
2. **Frontend**: User uploads PDF protocol file
3. **Backend**: Multer middleware saves PDF:
   - Destination: `uploads/protocols/`
   - Filename: `{timestamp}-{edrpou}-{rnokpp}.pdf`
4. **Backend**: Validate all inputs (express-validator)
5. **Backend**: Re-verify identity (security check)
6. **Backend**: Check for duplicate email/phone
7. **Backend**: Hash password with Argon2:
   ```javascript
   const passwordHash = await argon2.hash(password, {
     type: argon2.argon2id,
     memoryCost: 65536,
     timeCost: 3,
     parallelism: 4
   });
   ```
8. **Backend**: Create registration request:
   ```sql
   INSERT INTO osbb_registration_requests 
   (osbb_id, edrpou, head_rnokpp, head_full_name, head_email, 
    head_phone, protocol_pdf_path, status, password_hash)
   VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
   ```
9. **Backend**: Return success message
10. **Frontend**: Show success, redirect to login after 3 seconds

**Database Operations:**
- `SELECT id FROM osbb_organizations WHERE edrpou = $1`
- `SELECT id FROM users WHERE email = $1 OR phone = $2` (duplicate check)
- `SELECT id FROM osbb_registration_requests WHERE ... AND status = 'pending'`
- `INSERT INTO osbb_registration_requests (...)`

**File Storage:**
- PDF saved to: `good-neighbor-backend/uploads/protocols/{filename}.pdf`
- Path stored in DB: `protocols/{filename}.pdf`

---

### Admin Approval Flow

**Files Involved:**
- `good-neighbor-backend/src/routes/admin.js` - `PATCH /api/admin/registrations/:id/approve`
- `good-neighbor-frontend/src/pages/AdminRegistrationsPage.jsx` - Admin UI

**Flow:**
1. **Frontend**: Admin clicks "Approve" on registration request
2. **Backend**: Get registration request:
   ```sql
   SELECT * FROM osbb_registration_requests WHERE id = $1 AND status = 'pending'
   ```
3. **Backend**: Check for duplicate email/phone
4. **Backend**: Start database transaction
5. **Backend**: Create admin user account:
   ```sql
   INSERT INTO users (phone, email, password_hash, full_name, role, apartment_id)
   VALUES ($1, $2, $3, $4, 'admin', NULL)
   ```
   - Uses stored `password_hash` from registration request (already Argon2-hashed)
6. **Backend**: Update registration request:
   ```sql
   UPDATE osbb_registration_requests 
   SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1, user_id = $2
   WHERE id = $3
   ```
7. **Backend**: Update OSBB organization:
   ```sql
   UPDATE osbb_organizations 
   SET status = 'approved', approved_at = NOW(), approved_by = $1
   WHERE id = $2
   ```
8. **Backend**: Commit transaction
9. **Backend**: Return success with `user_id`
10. **Frontend**: Refresh registration list

**Database Operations:**
- `SELECT * FROM osbb_registration_requests WHERE id = $1 AND status = 'pending'`
- `SELECT id FROM users WHERE email = $1 OR phone = $2` (duplicate check)
- `BEGIN` transaction
- `INSERT INTO users (...)`
- `UPDATE osbb_registration_requests SET ...`
- `UPDATE osbb_organizations SET ...`
- `COMMIT` transaction

---

## 🗳️ Voting System Flow

### Creating a Voting (Admin)

**Files Involved:**
- `good-neighbor-backend/src/routes/votings.js` - `POST /api/votings`
- `good-neighbor-frontend/src/pages/CreateVotingPage.jsx` - Create form
- `good-neighbor-backend/src/middleware/authMiddleware.js` - `requireRole('admin')`

**Flow:**
1. **Frontend**: Admin fills form (title, description, type, start_date, end_date)
2. **Backend**: Validate inputs (express-validator)
3. **Backend**: Check admin role (`requireRole('admin')`)
4. **Backend**: Validate dates (end_date > start_date, start_date >= today)
5. **Backend**: Create voting:
   ```sql
   INSERT INTO votings (title, description, type, start_date, end_date, status, created_by)
   VALUES ($1, $2, $3, $4, $5, 'active', $6)
   ```
6. **Backend**: Return created voting
7. **Frontend**: Redirect to votings list

**Database Operations:**
- `INSERT INTO votings (...)`

---

### Casting a Vote

**Files Involved:**
- `good-neighbor-backend/src/routes/votings.js` - `POST /api/votings/:id/vote`
- `good-neighbor-frontend/src/components/VotingCard.jsx` - Vote buttons
- `good-neighbor-frontend/src/pages/VotingsListPage.jsx` - Voting list

**Flow:**
1. **Frontend**: User clicks "For", "Against", or "Abstain"
2. **Backend**: Check voting status:
   ```sql
   SELECT status FROM votings WHERE id = $1
   ```
   - Must be 'active'
3. **Backend**: Check if user already voted:
   ```sql
   SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2
   ```
4. **Backend**: Record vote:
   ```sql
   INSERT INTO votes (voting_id, user_id, choice)
   VALUES ($1, $2, $3)
   ```
5. **Backend**: Return success
6. **Frontend**: Refresh voting list to show updated state

**Database Operations:**
- `SELECT status FROM votings WHERE id = $1`
- `SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2`
- `INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3)`

---

### Viewing Voting Results

**Files Involved:**
- `good-neighbor-backend/src/routes/votings.js` - `GET /api/votings/:id`
- `good-neighbor-frontend/src/components/VotingCard.jsx` - Results display

**Flow:**
1. **Frontend**: Request voting details
2. **Backend**: Get voting:
   ```sql
   SELECT * FROM votings WHERE id = $1
   ```
3. **Backend**: Check if user voted:
   ```sql
   SELECT choice FROM votes WHERE voting_id = $1 AND user_id = $2
   ```
4. **Backend**: If status = 'finished', calculate results:
   
   **For 'legal' type (weighted by area):**
   ```sql
   SELECT v.choice, SUM(a.area) as total_weight
   FROM votes v
   JOIN users u ON v.user_id = u.id
   JOIN apartments a ON u.apartment_id = a.id
   WHERE v.voting_id = $1
   GROUP BY v.choice
   ```
   
   **For 'simple' type (headcount):**
   ```sql
   SELECT choice, COUNT(*) as count
   FROM votes
   WHERE voting_id = $1
   GROUP BY choice
   ```
5. **Backend**: Return voting with results
6. **Frontend**: Display results with progress bars

**Database Operations:**
- `SELECT * FROM votings WHERE id = $1`
- `SELECT choice FROM votes WHERE voting_id = $1 AND user_id = $2`
- `SELECT v.choice, SUM(a.area) ...` (legal) or `SELECT choice, COUNT(*) ...` (simple)
- `SELECT SUM(area) as total FROM apartments` (for legal percentage calculation)

---

## 📰 News System Flow

### Creating News (Admin)

**Files Involved:**
- `good-neighbor-backend/src/routes/news.js` - `POST /api/news`
- `good-neighbor-frontend/src/pages/CreateNewsPage.jsx` - Create form

**Flow:**
1. **Frontend**: Admin fills form (title, content, is_important)
2. **Backend**: Validate inputs
3. **Backend**: Check admin role
4. **Backend**: Create news:
   ```sql
   INSERT INTO news (title, content, is_important, author_id)
   VALUES ($1, $2, $3, $4)
   ```
5. **Backend**: Return created news
6. **Frontend**: Redirect to news list

**Database Operations:**
- `INSERT INTO news (title, content, is_important, author_id) VALUES ($1, $2, $3, $4)`

---

### Listing News

**Files Involved:**
- `good-neighbor-backend/src/routes/news.js` - `GET /api/news`
- `good-neighbor-frontend/src/pages/NewsListPage.jsx` - News list
- `good-neighbor-frontend/src/components/NewsCard.jsx` - News card component

**Flow:**
1. **Frontend**: Request news with pagination (`?page=1&limit=10`)
2. **Backend**: Get total count:
   ```sql
   SELECT COUNT(*) FROM news
   ```
3. **Backend**: Get paginated news:
   ```sql
   SELECT * FROM news 
   ORDER BY created_at DESC 
   LIMIT $1 OFFSET $2
   ```
4. **Backend**: Return `{ news: [...], total, page, pages }`
5. **Frontend**: Display news cards with pagination

**Database Operations:**
- `SELECT COUNT(*) FROM news`
- `SELECT * FROM news ORDER BY created_at DESC LIMIT $1 OFFSET $2`

---

## 👤 User Profile Management

### Updating Phone Number

**Files Involved:**
- `good-neighbor-backend/src/routes/profile.js` - `PATCH /api/profile/phone`
- `good-neighbor-frontend/src/pages/ProfilePage.jsx` - Profile form

**Flow:**
1. **Frontend**: User enters new phone number
2. **Backend**: Validate format (`+380XXXXXXXXX`)
3. **Backend**: Check if phone already taken:
   ```sql
   SELECT id FROM users WHERE phone = $1 AND id != $2
   ```
4. **Backend**: Update phone:
   ```sql
   UPDATE users SET phone = $1 WHERE id = $2
   ```
5. **Backend**: Return updated user
6. **Frontend**: Update localStorage and display success

**Database Operations:**
- `SELECT id FROM users WHERE phone = $1 AND id != $2`
- `UPDATE users SET phone = $1 WHERE id = $2`

---

### Changing Password

**Files Involved:**
- `good-neighbor-backend/src/routes/profile.js` - `PATCH /api/profile/password`
- `good-neighbor-frontend/src/pages/ProfilePage.jsx` - Password form

**Flow:**
1. **Frontend**: User enters current password + new password
2. **Backend**: Get current password hash:
   ```sql
   SELECT password_hash FROM users WHERE id = $1
   ```
3. **Backend**: Verify current password (detects hash format, uses bcrypt or Argon2)
4. **Backend**: Hash new password with bcrypt:
   ```javascript
   const hashedPassword = await bcrypt.hash(new_password, 10);
   ```
5. **Backend**: Update password:
   ```sql
   UPDATE users SET password_hash = $1 WHERE id = $2
   ```
6. **Backend**: Return success
7. **Frontend**: Clear form, show success message

**Database Operations:**
- `SELECT password_hash FROM users WHERE id = $1`
- `UPDATE users SET password_hash = $1 WHERE id = $2`

---

## 💰 Services/Bills Flow

### Viewing Bills

**Files Involved:**
- `good-neighbor-backend/src/routes/services.js` - `GET /api/services`
- `good-neighbor-frontend/src/pages/ServicesPage.jsx` - Bills display

**Flow:**
1. **Frontend**: Request services data
2. **Backend**: Get user's apartment_id:
   ```sql
   SELECT apartment_id FROM users WHERE id = $1
   ```
3. **Backend**: Get all bills for apartment:
   ```sql
   SELECT * FROM bills 
   WHERE apartment_id = $1 
   ORDER BY month DESC, service_type ASC
   ```
4. **Backend**: Group bills by month and calculate totals
5. **Backend**: Get apartment balance:
   ```sql
   SELECT balance FROM apartments WHERE id = $1
   ```
6. **Backend**: Return `{ apartment_id, balance, months: [...] }`
7. **Frontend**: Display bills grouped by month with month selector

**Database Operations:**
- `SELECT apartment_id FROM users WHERE id = $1`
- `SELECT * FROM bills WHERE apartment_id = $1 ORDER BY month DESC`
- `SELECT balance FROM apartments WHERE id = $1`

---

## 🔧 Admin Operations

### Generating Invitation Codes

**Files Involved:**
- `good-neighbor-backend/src/routes/admin.js` - `POST /api/admin/invitations/generate`
- `good-neighbor-frontend/src/pages/AdminApartmentsPage.jsx` - Generate button

**Flow:**
1. **Frontend**: Admin clicks "Generate Code" for apartment
2. **Backend**: Check admin role
3. **Backend**: Verify apartment exists
4. **Backend**: Generate unique 8-character code:
   ```javascript
   code = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);
   ```
5. **Backend**: Check uniqueness, regenerate if needed
6. **Backend**: Create invitation code:
   ```sql
   INSERT INTO invitation_codes (code, apartment_id, role)
   VALUES ($1, $2, $3)
   ```
7. **Backend**: Return code
8. **Frontend**: Display code to admin

**Database Operations:**
- `SELECT number FROM apartments WHERE id = $1`
- `SELECT id FROM invitation_codes WHERE code = $1` (uniqueness check)
- `INSERT INTO invitation_codes (code, apartment_id, role) VALUES ($1, $2, $3)`

---

## 🗄️ Database Schema & Relationships

### Core Tables

**users**
- `id` (PK) → Referenced by: news.author_id, votings.created_by, votes.user_id
- `apartment_id` (FK) → References: apartments.id
- `phone` (UNIQUE)
- `email` (UNIQUE, nullable)
- `password_hash` (bcrypt or Argon2 format)
- `role` ('admin', 'owner', 'tenant')

**apartments**
- `id` (PK) → Referenced by: users.apartment_id, invitation_codes.apartment_id, bills.apartment_id
- `number` (e.g., "42", "15A")
- `area` (DECIMAL, used for voting weight calculation)
- `balance` (DECIMAL, can be negative for debt)

**news**
- `id` (PK)
- `author_id` (FK) → References: users.id
- `title`, `content`, `is_important`, `created_at`

**votings**
- `id` (PK) → Referenced by: votes.voting_id
- `created_by` (FK) → References: users.id
- `type` ('simple' or 'legal')
- `status` ('draft', 'active', 'finished')
- `start_date`, `end_date`

**votes**
- `id` (PK)
- `voting_id` (FK) → References: votings.id
- `user_id` (FK) → References: users.id
- `choice` ('for', 'against', 'abstain')
- UNIQUE constraint on (voting_id, user_id)

**invitation_codes**
- `id` (PK)
- `apartment_id` (FK) → References: apartments.id
- `code` (UNIQUE, 8 characters)
- `role` ('admin', 'owner', 'tenant')
- `is_used` (BOOLEAN)

**bills**
- `id` (PK)
- `apartment_id` (FK) → References: apartments.id
- `month` (DATE, first day of month)
- `service_type` ('rent', 'water', 'electricity', etc.)
- `amount` (DECIMAL)
- UNIQUE constraint on (apartment_id, month, service_type)

### OSBB Registration Tables

**osbb_organizations**
- `id` (PK) → Referenced by: osbb_registration_requests.osbb_id
- `edrpou` (UNIQUE, 8 digits)
- `full_name`, `address_city`, `address_street`, `address_building`
- `authorized_person` (Head's name from EDR)
- `status` ('pending', 'approved', 'rejected')
- `approved_by` (FK) → References: users.id

**osbb_registration_requests**
- `id` (PK)
- `osbb_id` (FK) → References: osbb_organizations.id
- `head_rnokpp`, `head_full_name`, `head_email`, `head_phone`
- `protocol_pdf_path` (relative path to PDF file)
- `password_hash` (Argon2 hash, stored until approval)
- `status` ('pending', 'approved', 'rejected')
- `user_id` (FK, nullable) → References: users.id (set when approved)
- `reviewed_by` (FK) → References: users.id

---

## 🔄 Data Transformations

### Password Hashing

**Bcrypt (Legacy Users):**
- Function: `bcrypt.hash(password, 10)`
- Format: `$2b$10$...` (60 characters)
- Used for: Account activation, profile password changes

**Argon2id (New Registrations):**
- Function: `argon2.hash(password, { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 })`
- Format: `$argon2id$v=19$m=65536,t=3,p=4$...`
- Used for: OSBB Head registrations

**Verification:**
- Auto-detects format by prefix
- Bcrypt: `hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')`
- Argon2: `hash.startsWith('$argon2')`

---

### JWT Token Generation

**Function:** `generateToken(user)` in `auth.js`

**Payload:**
```javascript
{
  id: user.id,
  role: user.role,
  apartment_id: user.apartment_id,
  full_name: user.full_name
}
```

**Token:**
- Algorithm: HS256
- Secret: `process.env.JWT_SECRET`
- Expiration: 24 hours
- Stored in: `localStorage.getItem('token')`

**Usage:**
- Sent in header: `Authorization: Bearer {token}`
- Verified by: `authMiddleware.authenticate()`

---

### Voting Results Calculation

**Simple Type (Headcount):**
```sql
SELECT choice, COUNT(*) as count
FROM votes
WHERE voting_id = $1
GROUP BY choice
```

**Legal Type (Weighted by Area):**
```sql
SELECT v.choice, SUM(a.area) as total_weight
FROM votes v
JOIN users u ON v.user_id = u.id
JOIN apartments a ON u.apartment_id = a.id
WHERE v.voting_id = $1
GROUP BY v.choice
```

**Percentage Calculation:**
- Simple: `(count / total_users) * 100`
- Legal: `(total_weight / total_apartment_area) * 100`

---

## 🔒 Security & Validation

### Authentication Middleware

**File:** `good-neighbor-backend/src/middleware/authMiddleware.js`

**Functions:**
- `authenticate(req, res, next)`:
  1. Extract token from `Authorization: Bearer {token}` header
  2. Verify token with `jwt.verify(token, JWT_SECRET)`
  3. Attach decoded user to `req.user`
  4. Call `next()` or return 401

- `requireRole(...roles)`:
  1. Check `req.user.role` is in allowed roles
  2. Return 403 if not authorized
  3. Call `next()` if authorized

---

### Input Validation

**Library:** `express-validator`

**Examples:**
- Phone: `body('phone').matches(/^\+380\d{9}$/)`
- Email: `body('email').isEmail()`
- EDRPOU: `body('edrpou').matches(/^\d{8}$/)`
- RNOKPP: `body('head_rnokpp').matches(/^\d{10}$/)`
- Password: `body('password').isLength({ min: 6 })` or `min: 8` for registrations

**Validation Flow:**
1. Define rules in route handler
2. Run `validationResult(req)`
3. Return 400 with errors if validation fails
4. Proceed if valid

---

### File Upload Security

**Library:** `multer`

**Configuration:**
- Destination: `uploads/protocols/`
- File filter: Only PDF files (`application/pdf`)
- Size limit: 5MB
- Filename: `{timestamp}-{edrpou}-{rnokpp}.pdf`

**Storage:**
- Files stored server-side only
- Path stored in database (relative path)
- Not directly accessible via URL (admin download only)

---

## 📝 Key Functions Reference

### Backend Functions

**Authentication:**
- `generateToken(user)` - Creates JWT token
- `authenticate()` - Verifies JWT token
- `requireRole(...roles)` - Checks user role

**Mock Registry:**
- `verifyEDRPOU(edrpou)` - Returns OSBB data from mock EDR
- `verifyPropertyOwnership(edrpou, rnokpp)` - Returns properties from mock DRRP
- `verifyHeadIdentity(edrpou, rnokpp, fullName)` - Verifies Head against EDR

**Password:**
- `bcrypt.hash(password, 10)` - Hash with bcrypt
- `bcrypt.compare(password, hash)` - Verify bcrypt hash
- `argon2.hash(password, options)` - Hash with Argon2
- `argon2.verify(hash, password)` - Verify Argon2 hash

### Frontend Functions

**AuthContext:**
- `login(phone, password)` - Login user
- `activate(data)` - Activate account
- `logout()` - Clear auth data

**API Service:**
- Axios instance with baseURL: `http://localhost:3000/api`
- Request interceptor: Adds `Authorization: Bearer {token}` header
- Token from: `localStorage.getItem('token')`

---

## 🔗 Data Flow Diagrams

### Login Flow
```
User Input → LoginPage → AuthContext.login() → api.post('/auth/login')
  → auth.js route → Query DB → Verify Password → Generate JWT
  → Return {token, user} → Store in localStorage → Update AuthContext
  → Redirect to /dashboard
```

### OSBB Registration Flow
```
Step 1: EDRPOU → verify-edrpou → mockRegistry.verifyEDRPOU()
  → Store OSBB → Return data → Display OSBB info

Step 2: RNOKPP + Name → verify-head → mockRegistry.verifyHeadIdentity()
  → Check EDR match → Check DRRP properties → Return verification

Step 3: Form + PDF → submit → Multer upload → Argon2 hash password
  → Store registration_request (status: pending) → Return success

Admin: Review → Approve → Create user account → Update status to approved
```

### Voting Flow
```
Admin: Create Voting → Store in votings table (status: active)

User: View Voting → Get voting + check if voted → Display vote buttons
  → User clicks vote → POST /votings/:id/vote → Check status + duplicate
  → Store vote → Return success → Refresh display

Results: Get voting → If finished, calculate results → Return with results
  → Display progress bars
```

---

**End of Architecture Documentation**

For specific implementation details, refer to the source files mentioned in each section.

