/**
 * Script to create an admin user directly in the database
 * Usage: node dev-scripts/create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/db/connection');

async function createAdmin() {
  try {
    console.log('🔍 Checking existing users...\n');
    
    // Check existing users
    const usersResult = await db.query('SELECT id, phone, email, full_name, role FROM users ORDER BY created_at');
    
    if (usersResult.rows.length > 0) {
      console.log('📋 Existing users:');
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.role})`);
        console.log(`      Phone: ${user.phone || 'N/A'}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   No users found in database.\n');
    }

    // Check invitation codes
    const codesResult = await db.query(`
      SELECT code, role, is_used, created_at 
      FROM invitation_codes 
      ORDER BY created_at DESC
    `);
    
    if (codesResult.rows.length > 0) {
      console.log('🔑 Invitation codes:');
      codesResult.rows.forEach((code, index) => {
        const status = code.is_used ? '❌ USED' : '✅ AVAILABLE';
        console.log(`   ${index + 1}. ${code.code} (${code.role}) - ${status}`);
      });
      console.log('');
    }

    // Prompt for admin creation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Do you want to create a new admin user? (y/n): ', async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        readline.close();
        await db.end();
        process.exit(0);
      }

      readline.question('Phone number (+380XXXXXXXXX): ', async (phone) => {
        readline.question('Email (optional): ', async (email) => {
          readline.question('Full Name: ', async (fullName) => {
            readline.question('Password (min 6 chars): ', async (password) => {
              if (password.length < 6) {
                console.log('❌ Password must be at least 6 characters');
                readline.close();
                await db.end();
                process.exit(1);
              }

              try {
                // Check if phone already exists
                const phoneCheck = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
                if (phoneCheck.rows.length > 0) {
                  console.log('❌ User with this phone already exists');
                  readline.close();
                  await db.end();
                  process.exit(1);
                }

                // Check if email already exists (if provided)
                if (email) {
                  const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
                  if (emailCheck.rows.length > 0) {
                    console.log('❌ User with this email already exists');
                    readline.close();
                    await db.end();
                    process.exit(1);
                  }
                }

                // Hash password
                const passwordHash = await bcrypt.hash(password, 10);

                // Get or create ADMIN apartment
                let adminAptResult = await db.query("SELECT id FROM apartments WHERE number = 'ADMIN'");
                let adminAptId = null;
                
                if (adminAptResult.rows.length === 0) {
                  const aptResult = await db.query(
                    "INSERT INTO apartments (number, area, balance) VALUES ('ADMIN', 0, 0) RETURNING id"
                  );
                  adminAptId = aptResult.rows[0].id;
                } else {
                  adminAptId = adminAptResult.rows[0].id;
                }

                // Create admin user
                const insertQuery = email
                  ? `INSERT INTO users (phone, email, password_hash, full_name, role, apartment_id)
                     VALUES ($1, $2, $3, $4, 'admin', $5) RETURNING id, phone, email, full_name, role`
                  : `INSERT INTO users (phone, password_hash, full_name, role, apartment_id)
                     VALUES ($1, $2, $3, 'admin', $4) RETURNING id, phone, email, full_name, role`;

                const params = email
                  ? [phone, email, passwordHash, fullName, adminAptId]
                  : [phone, passwordHash, fullName, adminAptId];

                const userResult = await db.query(insertQuery, params);
                const newUser = userResult.rows[0];

                console.log('\n✅ Admin user created successfully!');
                console.log('\n📝 Login credentials:');
                console.log(`   Phone/Email: ${phone}${email ? ` or ${email}` : ''}`);
                console.log(`   Password: ${password}`);
                console.log(`   Role: ${newUser.role}`);
                console.log(`   Name: ${newUser.full_name}`);
                console.log('\n💡 You can now login at /login');

              } catch (err) {
                console.error('❌ Error creating admin:', err.message);
              }

              readline.close();
              process.exit(0);
            });
          });
        });
      });
    });
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createAdmin();

