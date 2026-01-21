/**
 * Check superadmin users in database
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function checkSuperAdmin() {
  try {
    const result = await db.query(
      'SELECT id, login_id, full_name, role, osbb_id, phone FROM users WHERE role = $1',
      ['super_admin']
    );

    console.log('\n🔍 SuperAdmin Users:\n');
    
    if (result.rows.length === 0) {
      console.log('⚠️  No superadmin users found!\n');
      console.log('💡 To create a superadmin, run:');
      console.log('   node dev-scripts/create-super-admin.js <login_id> <password> [full_name]\n');
    } else {
      result.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.full_name || 'Unknown'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Login ID: ${user.login_id || '❌ NULL (MUST BE SET!)'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   OSBB ID: ${user.osbb_id || 'NULL (correct)'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkSuperAdmin();
