# Good Neighbor - Internal Panel

SuperAdmin panel for managing and monitoring the entire Good Neighbor ecosystem.

## Features

- **OSBB Registration Moderation**: Review and approve/reject OSBB registration requests
- **Ecosystem Analytics**: View global statistics (OSBBs, users, votings, bills)
- **Audit Log Explorer**: Browse and filter audit logs with advanced search capabilities
- **PDF Protocol Viewer**: Safe viewing of uploaded registration protocols

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:5174`

## Authentication

Only users with `role = 'super_admin'` can access this panel. Super admins must have `osbb_id = NULL` to bypass tenant isolation.

To create a super admin user, use the backend script:
```bash
cd ../good-neighbor-backend
node dev-scripts/create-super-admin.js <phone> <password> [full_name]
```

Example:
```bash
node dev-scripts/create-super-admin.js +380123456789 admin123 "Super Admin"
```

## API Endpoints

All internal API endpoints are prefixed with `/api/internal/` and require super_admin authentication:

- `GET /api/internal/dashboard/stats` - Get global ecosystem statistics
- `GET /api/internal/registrations` - List OSBB registration requests
- `GET /api/internal/registrations/:id` - Get registration details
- `GET /api/internal/registrations/:id/protocol` - Download PDF protocol
- `PATCH /api/internal/registrations/:id/approve` - Approve registration
- `PATCH /api/internal/registrations/:id/reject` - Reject registration
- `GET /api/internal/audit-logs` - Get audit logs with filters
- `GET /api/internal/audit-logs/stats` - Get audit log statistics

## Security

- All routes require `super_admin` role
- Super admins have `osbb_id = NULL` (global access)
- Sensitive data (passwords, tokens) are never logged or returned
- All actions are logged in the audit system

