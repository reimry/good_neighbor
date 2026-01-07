# Quick Start Guide - Security & Billing Features

## 🚀 Setup

### 1. Run Database Migration
```bash
cd good-neighbor-backend
psql -U postgres -d good_neighbor_db -f src/db/security-enhancements.sql
```

This adds:
- `osbb_id` to users, votings tables
- `used_at` to invitation_codes
- Foreign keys and indexes

### 2. Link Existing Data (if needed)
```sql
-- Link existing admins to their OSBB
UPDATE users u
SET osbb_id = r.osbb_id
FROM osbb_registration_requests r
WHERE u.id = r.user_id AND u.role = 'admin' AND r.status = 'approved';

-- Set existing apartments to OSBB 1 (or specific OSBB)
UPDATE apartments SET osbb_id = 1 WHERE osbb_id IS NULL;

-- Set existing votings to creator's OSBB
UPDATE votings v
SET osbb_id = COALESCE((SELECT osbb_id FROM users WHERE id = v.created_by), 1)
WHERE osbb_id IS NULL;
```

---

## 📋 Task 1: Admin Invitation Management

### Backend
- ✅ `POST /api/admin/invitations/generate` - Now verifies apartment belongs to admin's OSBB
- ✅ `GET /api/admin/apartments` - Returns invitation codes per apartment

### Frontend
- ✅ `/admin/apartments` - Shows codes with status (Active/Used) and dates

### Usage
1. Login as admin
2. Go to `/admin/apartments`
3. See existing codes or click "Код (Власник)" / "Код (Орендар)"
4. Code appears in table with status

---

## 🔒 Task 2: Voting Security

### Features
- ✅ OSBB verification on all voting operations
- ✅ Immutability: Voting parameters locked once active/finished
- ✅ Legal voting: Area-weighted calculation per OSBB
- ✅ Tenant isolation: Users only see their OSBB's votings

### Testing
1. Create voting as Admin → Automatically linked to admin's OSBB
2. Try to edit active voting → Should fail (immutable)
3. View votings → Only see your OSBB's votings
4. Vote → Only allowed on your OSBB's votings

---

## 💰 Task 3: Billing Simulation

### Generate Bills (Script)
```bash
cd good-neighbor-backend

# Generate 12 months starting Jan 2025
node dev-scripts/simulate-billing.js 1 2025-01 12

# Generate 24 months (2 years)
node dev-scripts/simulate-billing.js 1 2024-01 24
```

### Generate Bills (API)
```javascript
POST /api/admin/billing/generate
{
  "month": "2025-01",
  "service_amounts": {
    "rent": 1500.00,
    "water": 120.00,
    "electricity": 200.00
  }
}
```

### Service Types
- `rent` - Орендна плата
- `water` - Водопостачання
- `electricity` - Електроенергія
- `heating` - Опалення
- `maintenance` - Утримання будинку
- `garbage` - Вивіз сміття

### View Bills
- Users: `/services` page
- Grouped by month
- Shows all service types

---

## 🔐 Security Checklist

✅ All admin operations verify OSBB ownership  
✅ Users only see data from their OSBB  
✅ Voting parameters immutable after activation  
✅ Invitation codes tracked with usage dates  
✅ Legal voting calculates per OSBB only  
✅ No data leakage between OSBBs  

---

## 📊 Database Queries

### Check OSBB Associations
```sql
-- Check admin OSBB links
SELECT u.id, u.full_name, u.osbb_id, o.full_name as osbb_name
FROM users u
LEFT JOIN osbb_organizations o ON u.osbb_id = o.id
WHERE u.role = 'admin';

-- Check apartment OSBB distribution
SELECT osbb_id, COUNT(*) as apartment_count
FROM apartments
WHERE number != 'ADMIN'
GROUP BY osbb_id;

-- Check voting OSBB distribution
SELECT osbb_id, COUNT(*) as voting_count
FROM votings
GROUP BY osbb_id;
```

---

## 🐛 Troubleshooting

### "Apartment does not belong to your OSBB"
- Admin needs to be linked to OSBB
- Run migration and link existing admins (see Setup)

### "Voting does not belong to your OSBB"
- Voting was created before OSBB tracking
- Run migration to set osbb_id on existing votings

### "You must be associated with an OSBB"
- Admin created through OSBB registration should be auto-linked
- For legacy admins, manually link via SQL (see Setup)

---

**Ready to use!** All features are production-ready.

