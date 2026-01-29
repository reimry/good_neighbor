/**
 * Test Vote API Flow
 * Simulates the exact API call to identify the issue
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function testVoteAPI() {
  try {
    console.log('\n🧪 Testing Vote API Flow...\n');

    // Get voting 8 details
    const voting = await db.query('SELECT * FROM votings WHERE id = $1', [8]);
    if (voting.rows.length === 0) {
      console.log('❌ Voting 8 not found');
      return;
    }
    console.log('Voting 8:', {
      id: voting.rows[0].id,
      status: voting.rows[0].status,
      osbb_id: voting.rows[0].osbb_id
    });

    // Get all users and test each one
    const users = await db.query(`
      SELECT id, phone, full_name, role, apartment_id, osbb_id 
      FROM users 
      ORDER BY id
      LIMIT 10
    `);

    console.log(`\nTesting with ${users.rows.length} users:\n`);

    for (const user of users.rows) {
      console.log(`\n--- Testing with User ID ${user.id} (${user.full_name}, ${user.role}) ---`);
      
      let userOSBBId = null;
      
      // Simulate the exact logic from the API
      if (user.role === 'admin' && user.osbb_id) {
        userOSBBId = user.osbb_id;
        console.log(`  Admin OSBB from user table: ${userOSBBId}`);
      } else if (user.apartment_id) {
        const aptResult = await db.query(
          'SELECT osbb_id FROM apartments WHERE id = $1',
          [user.apartment_id]
        );
        if (aptResult.rows.length > 0) {
          userOSBBId = aptResult.rows[0].osbb_id;
          console.log(`  OSBB from apartment ${user.apartment_id}: ${userOSBBId}`);
        }
      }
      
      if (!userOSBBId && user.role === 'admin') {
        try {
          const { getAdminOSBBId } = require('../src/services/osbbService');
          userOSBBId = await getAdminOSBBId(user.id);
          console.log(`  OSBB from service: ${userOSBBId}`);
        } catch (err) {
          console.log(`  ⚠️  Error getting OSBB from service: ${err.message}`);
        }
      }

      // Check if osbb_id column exists
      const columnCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'votings' AND column_name = 'osbb_id'
      `);
      const hasOsbbId = columnCheck.rows.length > 0;
      console.log(`  osbb_id column exists: ${hasOsbbId}`);

      // Check OSBB match
      if (hasOsbbId && voting.rows[0].osbb_id) {
        if (userOSBBId) {
          if (voting.rows[0].osbb_id !== userOSBBId) {
            console.log(`  ❌ OSBB mismatch: voting=${voting.rows[0].osbb_id}, user=${userOSBBId}`);
            continue;
          }
        } else {
          console.log(`  ❌ User has no OSBB but voting requires one`);
          continue;
        }
      } else {
        console.log(`  ✅ OSBB check passed (legacy voting or no osbb_id column)`);
      }

      // Check status
      if (voting.rows[0].status !== 'active') {
        console.log(`  ❌ Voting is not active: ${voting.rows[0].status}`);
        continue;
      }
      console.log(`  ✅ Voting is active`);

      // Check duplicate
      const voteCheck = await db.query(
        'SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2',
        [8, user.id]
      );
      if (voteCheck.rows.length > 0) {
        console.log(`  ⚠️  User already voted`);
        continue;
      }
      console.log(`  ✅ No duplicate vote`);

      // Try insert
      try {
        const result = await db.query(
          'INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3) RETURNING id',
          [8, user.id, 'for']
        );
        console.log(`  ✅ INSERT successful! Vote ID: ${result.rows[0].id}`);
        
        // Clean up
        await db.query('DELETE FROM votes WHERE id = $1', [result.rows[0].id]);
        console.log(`  ✅ Test vote cleaned up`);
      } catch (err) {
        console.log(`  ❌ INSERT failed!`);
        console.log(`     Error: ${err.message}`);
        console.log(`     Code: ${err.code}`);
        console.log(`     Detail: ${err.detail}`);
      }
    }

    console.log('\n✅ Test complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.pool.end();
  }
}

testVoteAPI();
