/**
 * Verify complete setup - check all components
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function verifySetup() {
  try {
    console.log('\n🔍 Verifying Good Neighbor Setup...\n');

    // Check superadmins
    const superadmins = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND login_id IS NOT NULL',
      ['super_admin']
    );
    console.log(`✅ SuperAdmins with login_id: ${superadmins.rows[0].count}`);

    // Check regular users
    const regularUsers = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE role != $1',
      ['super_admin']
    );
    console.log(`✅ Regular users: ${regularUsers.rows[0].count}`);

    // Check OSBB organizations
    const orgs = await db.query('SELECT COUNT(*) as count FROM osbb_organizations');
    console.log(`✅ OSBB Organizations: ${orgs.rows[0].count}`);

    // Check apartments
    const apts = await db.query('SELECT COUNT(*) as count FROM apartments');
    console.log(`✅ Apartments: ${apts.rows[0].count}`);

    // Check votings
    const votings = await db.query('SELECT COUNT(*) as count FROM votings');
    console.log(`✅ Votings: ${votings.rows[0].count}`);

    // Check invitation codes
    const codes = await db.query('SELECT COUNT(*) as count FROM invitation_codes WHERE is_used = FALSE');
    console.log(`✅ Available invitation codes: ${codes.rows[0].count}`);

    // Check login_id constraint
    const constraintCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'super_admin' AND login_id IS NULL
    `);
    if (parseInt(constraintCheck.rows[0].count) > 0) {
      console.log(`⚠️  Warning: ${constraintCheck.rows[0].count} superadmin(s) missing login_id`);
    } else {
      console.log(`✅ All superadmins have login_id set`);
    }

    console.log('\n✅ Setup verification complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Start backend: npm start');
    console.log('   2. Start frontend: cd ../good-neighbor-frontend && npm run dev');
    console.log('   3. Access internal system: http://localhost:5173/internal/login');
    console.log('   4. Login with superadmin login_id and password\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.pool.end();
  }
}

verifySetup();
