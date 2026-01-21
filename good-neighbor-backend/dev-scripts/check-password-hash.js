/**
 * Check password_hash for users
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function checkPasswordHash() {
  try {
    const result = await db.query(
      'SELECT id, login_id, full_name, role, password_hash IS NOT NULL as has_password, LENGTH(password_hash) as hash_length FROM users ORDER BY id'
    );

    console.log('\n🔍 Password Hash Status:\n');
    result.rows.forEach((user) => {
      console.log(`${user.id}. ${user.full_name || 'Unknown'} (${user.role})`);
      console.log(`   Login ID: ${user.login_id || 'N/A'}`);
      console.log(`   Has Password: ${user.has_password ? '✓ YES' : '✗ NO'}`);
      if (user.has_password) {
        console.log(`   Hash Length: ${user.hash_length} characters`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkPasswordHash();
