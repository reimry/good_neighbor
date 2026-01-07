/**
 * Test password verification for a specific user
 * Usage: node dev-scripts/test-password.js <phone> <password>
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const argon2 = require('argon2');
const db = require('../src/db/connection');

async function testPassword() {
  const phone = process.argv[2];
  const password = process.argv[3];

  if (!phone || !password) {
    console.log('Usage: node dev-scripts/test-password.js <phone> <password>');
    process.exit(1);
  }

  try {
    console.log(`🔍 Testing password for user: ${phone}\n`);

    // Get user
    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`✅ User found: ${user.full_name} (${user.role})`);
    console.log(`   Hash: ${user.password_hash.substring(0, 20)}...`);
    console.log(`   Hash length: ${user.password_hash.length} characters\n`);

    // Detect hash type
    const hash = user.password_hash;
    let hashType = 'unknown';
    
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      hashType = 'bcrypt';
    } else if (hash.startsWith('$argon2')) {
      hashType = 'argon2';
    }

    console.log(`🔑 Hash type detected: ${hashType}\n`);

    // Test verification
    if (hashType === 'bcrypt') {
      console.log('Testing with bcrypt...');
      const isValid = await bcrypt.compare(password, hash);
      console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else if (hashType === 'argon2') {
      console.log('Testing with Argon2...');
      const isValid = await argon2.verify(hash, password);
      console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      console.log('Testing with both methods...');
      let isValid = false;
      
      try {
        isValid = await argon2.verify(hash, password);
        console.log(`Argon2: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      } catch (err) {
        console.log(`Argon2: ❌ ERROR - ${err.message}`);
        try {
          isValid = await bcrypt.compare(password, hash);
          console.log(`Bcrypt: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        } catch (bcryptErr) {
          console.log(`Bcrypt: ❌ ERROR - ${bcryptErr.message}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testPassword();


