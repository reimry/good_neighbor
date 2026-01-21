/**
 * Check and fix superadmin users - ensure they have login_id set
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function fixSuperAdmin() {
  try {
    // Check existing superadmins
    const result = await db.query(
      'SELECT id, login_id, full_name, role, osbb_id FROM users WHERE role = $1',
      ['super_admin']
    );

    console.log('\n🔍 Checking SuperAdmin Users...\n');
    
    if (result.rows.length === 0) {
      console.log('⚠️  No superadmin users found!\n');
      console.log('💡 To create a superadmin, run:');
      console.log('   node dev-scripts/create-super-admin.js <login_id> <password> [full_name]\n');
      console.log('Example:');
      console.log('   node dev-scripts/create-super-admin.js admin123 SecurePass123 "Super Admin"\n');
    } else {
      for (const user of result.rows) {
        console.log(`Found SuperAdmin: ${user.full_name || 'Unknown'}`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Login ID: ${user.login_id || '❌ NULL (MUST BE SET!)'}`);
        console.log(`  OSBB ID: ${user.osbb_id || 'NULL (correct)'}`);
        
        if (!user.login_id) {
          console.log('\n⚠️  This user has no login_id! They cannot login to internal system.');
          console.log('💡 Options:');
          console.log('   1. Create a new superadmin with login_id');
          console.log('   2. Update this user to add login_id (requires manual SQL)\n');
        } else {
          console.log('✅ User has login_id - can login to internal system\n');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

fixSuperAdmin();
