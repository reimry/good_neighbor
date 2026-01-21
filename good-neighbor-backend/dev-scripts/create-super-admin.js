/**
 * Script to create a super_admin user
 * Usage: node dev-scripts/create-super-admin.js <login_id> <password> <full_name>
 */

require('dotenv').config();
const db = require('../src/db/connection');
const argon2 = require('argon2');

async function createSuperAdmin() {
  const login_id = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Super Administrator';

  if (!login_id || !password) {
    console.error('Usage: node create-super-admin.js <login_id> <password> [full_name]');
    console.error('Example: node create-super-admin.js admin123 SecurePassword "Super Admin"');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE login_id = $1', [login_id]);
    if (existingUser.rows.length > 0) {
      console.error(`User with login_id ${login_id} already exists!`);
      process.exit(1);
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

    // Create super_admin user (osbb_id must be NULL)
    const result = await db.query(
      `INSERT INTO users (login_id, password_hash, full_name, role, osbb_id)
       VALUES ($1, $2, $3, 'super_admin', NULL)
       RETURNING id, login_id, full_name, role`,
      [login_id, passwordHash, fullName]
    );

    const user = result.rows[0];
    console.log('✅ Super admin created successfully!');
    console.log(`ID: ${user.id}`);
    console.log(`Login ID: ${user.login_id}`);
    console.log(`Name: ${user.full_name}`);
    console.log(`Role: ${user.role}`);
    console.log(`OSBB ID: NULL (global access)`);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

createSuperAdmin();

