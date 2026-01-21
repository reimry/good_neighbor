# Internal Management System

**Route**: `/internal/*`  
**Purpose**: Separate internal management system for superadmins to manage the entire Good Neighbor ecosystem

## Overview

The Internal Management System is a completely separate interface from the main application. It provides:

- **Separate Authentication**: Uses `internal_token` and `internal_user` in localStorage (separate from main app)
- **SuperAdmin Only**: Only users with `role = 'super_admin'` can access
- **Database Management**: Full CRUD access to users, organizations, and apartments
- **Ecosystem Overview**: Global statistics and monitoring

## Routes

- `/internal/login` - Login page for superadmins
- `/internal/dashboard` - Ecosystem overview dashboard
- `/internal/database` - Database management interface

## Authentication

### Login Credentials

Superadmins use `login_id` (not phone/email) for authentication:

```bash
# Create a superadmin user
cd good-neighbor-backend
node dev-scripts/create-super-admin.js <login_id> <password> [full_name]
```

Example:
```bash
node dev-scripts/create-super-admin.js admin123 SecurePassword123 "Super Administrator"
```

### Login Flow

1. Navigate to `/internal/login`
2. Enter `login_id` and `password`
3. System verifies `role = 'super_admin'`
4. Token stored in `localStorage` as `internal_token`
5. Redirects to `/internal/dashboard`

## Features

### Dashboard (`/internal/dashboard`)

- **OSBB Statistics**: Total, active, pending organizations
- **User Statistics**: Total users by role
- **Voting Statistics**: Active and finished votings
- **Bills Statistics**: Total bills and amounts
- **Recent Activity**: Last 7 days of system activity

### Database Management (`/internal/database`)

#### Users Tab
- View all users with filters (role, search)
- Edit user details (name, phone, email, role)
- Delete users (with confirmation)
- Pagination support

#### Organizations Tab
- View all OSBB organizations
- Filter by status (pending, approved, rejected)
- Edit organization details (name, EDRPOU, address, status)
- View user and apartment counts per organization

#### Apartments Tab
- View all apartments
- Search by apartment number
- View balance, area, OSBB association
- View resident count

## Security

- All routes protected by `InternalPrivateRoute` component
- Requires `super_admin` role
- Uses separate authentication context
- All actions logged in audit system
- API routes protected by `requireSuperAdmin` middleware

## API Endpoints

All internal routes use `/api/internal/*`:

- `GET /api/internal/dashboard/stats` - Ecosystem statistics
- `GET /api/internal/db/users` - List users
- `GET /api/internal/db/users/:id` - Get user details
- `PATCH /api/internal/db/users/:id` - Update user
- `DELETE /api/internal/db/users/:id` - Delete user
- `GET /api/internal/db/organizations` - List organizations
- `GET /api/internal/db/organizations/:id` - Get organization details
- `PATCH /api/internal/db/organizations/:id` - Update organization
- `GET /api/internal/db/apartments` - List apartments

## Separation from Main App

The internal system is completely separate:

- **Different Auth Context**: `InternalAuthContext` vs `AuthContext`
- **Different Storage**: `internal_token` vs `token`
- **Different Routes**: `/internal/*` vs `/dashboard`, `/admin/*`, etc.
- **Different Layout**: `InternalLayout` component with separate navigation
- **Different Purpose**: Ecosystem management vs OSBB-specific management

## Usage

1. **Access**: Navigate to `http://localhost:5173/internal/login`
2. **Login**: Use superadmin `login_id` and password
3. **Navigate**: Use the internal navigation bar
4. **Manage**: Use Database Management to view/edit/delete entities

## Troubleshooting

### Can't Login
- Verify user exists: `node dev-scripts/check-users.js`
- Verify user has `role = 'super_admin'`
- Verify user has `login_id` set (not NULL)
- Check browser console for errors

### Blank Page
- Check if user has `super_admin` role
- Verify token is stored in `localStorage` as `internal_token`
- Check browser console for authentication errors
- Ensure backend is running on port 3000

### API Errors
- Verify backend routes are registered in `index.js`
- Check `requireSuperAdmin` middleware is applied
- Verify JWT token is valid
- Check backend logs for errors
