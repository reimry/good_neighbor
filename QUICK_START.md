# QUICK START

This file contains the minimal commands a developer needs to get the project running locally after cloning.

Requirements
- Node.js 18+ (LTS recommended)
- npm (bundled with Node)
- PostgreSQL (create a local DB and user or use Docker)

1) Clone repository
```bash
git clone https://github.com/reimry/good_neighbor.git
cd good_neighbor
```

2) Backend (API)
```bash
cd good-neighbor-backend
cp .env.example .env    # Edit .env if you need custom values
npm install
# Create the PostgreSQL database (example with local postgres)
createdb -U postgres good_neighbor_db
# Run DB schema (executes schema.sql)
node src/db/init-db.js

# Start backend in dev mode
npm run dev
# Backend runs by default on http://localhost:3000
```

3) Frontend (Main App)
```bash
cd ../good-neighbor-frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173 (see terminal)
```

4) Internal Panel (SuperAdmin)
```bash
cd ../good-neighbor-internal-panel
npm install
npm run dev
# Internal panel runs on http://localhost:5174
```

5) Useful dev scripts (backend)
- `node dev-scripts/create-admin.js` - Create an admin user.
- `node dev-scripts/create-super-admin.js` - Create super admin for internal panel.
- `node dev-scripts/seed-votings.js` - Insert test voting data.
- `node dev-scripts/check-users.js` - List users and invitation codes.

Notes & Tips
- Do not commit `.env` files or runtime uploads (`good-neighbor-backend/uploads/`)
- `.env.example` contains the minimal variables required for the backend
- If using Docker for PostgreSQL: ensure DB credentials match `.env`
- Lockfiles (`package-lock.json`) should be committed to ensure consistent installs

If you want, open an issue or send a pull request with any missing steps you used during your setup so we can keep this guide up-to-date.