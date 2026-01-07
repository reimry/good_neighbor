/**
 * Script to create a super_admin user
 * Usage: node dev-scripts/create-super-admin.js <phone> <password> <full_name>
 */

require('dotenv').config();
const db = require('../src/db/connection');
const argon2 = require('argon2');

async function createSuperAdmin() {
  const phone = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Super Administrator';

  if (!phone || !password) {
    console.error('Usage: node create-super-admin.js <phone> <password> [full_name]');
    console.error('Example: node create-super-admin.js +380123456789 admin123 "Super Admin"');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existingUser.rows.length > 0) {
      console.error(`User with phone ${phone} already exists!`);
      process.exit(1);
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

    // Create super_admin user (osbb_id must be NULL)
    const result = await db.query(
      `INSERT INTO users (phone, password_hash, full_name, role, osbb_id)
       VALUES ($1, $2, $3, 'super_admin', NULL)
       RETURNING id, phone, full_name, role`,
      [phone, passwordHash, fullName]
    );

    const user = result.rows[0];
    console.log('✅ Super admin created successfully!');
    console.log(`ID: ${user.id}`);
    console.log(`Phone: ${user.phone}`);
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

