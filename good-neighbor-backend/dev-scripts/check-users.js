/**
 * Quick script to check existing users in the database
 * Usage: node dev-scripts/check-users.js
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function checkUsers() {
  try {
    console.log('🔍 Checking database for users...\n');
    
    // Check users (email might not exist yet)
    const usersResult = await db.query(`
      SELECT id, phone, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    // Try to get email if column exists
    let usersWithEmail = usersResult.rows;
    try {
      const usersWithEmailResult = await db.query(`
        SELECT id, phone, email, full_name, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `);
      usersWithEmail = usersWithEmailResult.rows;
    } catch (e) {
      // Email column doesn't exist, use basic query
    }
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database.');
      console.log('\n💡 To create an admin user, run:');
      console.log('   node dev-scripts/create-admin.js');
      console.log('\n   Or use invitation code ADMIN001 at /activate');
    } else {
      console.log(`✅ Found ${usersResult.rows.length} user(s):\n`);
      usersWithEmail.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        if (user.email !== undefined) {
          console.log(`   Email: ${user.email || 'N/A'}`);
        }
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log('');
      });
      
      const admins = usersWithEmail.filter(u => u.role === 'admin');
      if (admins.length === 0) {
        console.log('⚠️  No admin users found!');
        console.log('\n💡 To create an admin user, run:');
        console.log('   node dev-scripts/create-admin.js');
      } else {
        console.log(`✅ Found ${admins.length} admin user(s).`);
        console.log('\n💡 To login, use the phone/email and password you set when creating the account.');
        console.log('   (Passwords are hashed, so we cannot show them here)');
      }
    }

    // Check invitation codes
    console.log('\n---\n');
    const codesResult = await db.query(`
      SELECT code, role, is_used, created_at 
      FROM invitation_codes 
      ORDER BY created_at DESC
    `);
    
    if (codesResult.rows.length > 0) {
      console.log('🔑 Invitation codes:');
      codesResult.rows.forEach((code) => {
        const status = code.is_used ? '❌ USED' : '✅ AVAILABLE';
        console.log(`   ${code.code} (${code.role}) - ${status}`);
      });
      console.log('\n💡 Available codes can be used at /activate to create new users');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkUsers();

