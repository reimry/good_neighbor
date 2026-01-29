/**
 * Diagnostic Script for Voting Issues
 * Checks database structure and attempts to identify voting problems
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function diagnoseVoting() {
  try {
    console.log('\n🔍 Diagnosing Voting Issues...\n');

    // 1. Check if votes table exists
    console.log('1. Checking votes table existence...');
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'votes'
      );
    `);
    console.log('   Votes table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ Votes table does not exist!');
      return;
    }

    // 2. Check votes table structure
    console.log('\n2. Checking votes table structure...');
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'votes'
      ORDER BY ordinal_position;
    `);
    console.log('   Columns:');
    columns.rows.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. Check constraints
    console.log('\n3. Checking constraints...');
    const constraints = await db.query(`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'votes';
    `);
    console.log('   Constraints:');
    constraints.rows.forEach(con => {
      console.log(`     - ${con.constraint_name} (${con.constraint_type})`);
      if (con.foreign_table_name) {
        console.log(`       References: ${con.foreign_table_name}.${con.foreign_column_name}`);
      }
    });

    // 4. Check voting_id 8
    console.log('\n4. Checking voting with id 8...');
    const voting = await db.query('SELECT * FROM votings WHERE id = $1', [8]);
    if (voting.rows.length === 0) {
      console.log('   ❌ Voting with id 8 does not exist!');
    } else {
      console.log('   ✅ Voting found:');
      console.log(`     - Title: ${voting.rows[0].title}`);
      console.log(`     - Status: ${voting.rows[0].status}`);
      console.log(`     - OSBB ID: ${voting.rows[0].osbb_id || 'NULL'}`);
      console.log(`     - Type: ${voting.rows[0].type}`);
    }

    // 5. Check existing votes for voting_id 8
    console.log('\n5. Checking existing votes for voting_id 8...');
    const existingVotes = await db.query(
      'SELECT * FROM votes WHERE voting_id = $1',
      [8]
    );
    console.log(`   Found ${existingVotes.rows.length} existing votes`);
    if (existingVotes.rows.length > 0) {
      existingVotes.rows.forEach((vote, idx) => {
        console.log(`     Vote ${idx + 1}: user_id=${vote.user_id}, choice=${vote.choice}`);
      });
    }

    // 6. Get a test user (first user with apartment_id)
    console.log('\n6. Finding test user...');
    const testUser = await db.query(`
      SELECT id, phone, full_name, role, apartment_id, osbb_id 
      FROM users 
      WHERE apartment_id IS NOT NULL 
      LIMIT 1
    `);
    
    if (testUser.rows.length === 0) {
      console.log('   ❌ No users with apartment_id found!');
      return;
    }
    
    const userId = testUser.rows[0].id;
    console.log(`   ✅ Test user found: ID=${userId}, Name=${testUser.rows[0].full_name}, Role=${testUser.rows[0].role}`);
    console.log(`     - Apartment ID: ${testUser.rows[0].apartment_id}`);
    console.log(`     - OSBB ID: ${testUser.rows[0].osbb_id || 'NULL'}`);

    // 7. Check if user already voted
    console.log('\n7. Checking if test user already voted...');
    const userVote = await db.query(
      'SELECT * FROM votes WHERE voting_id = $1 AND user_id = $2',
      [8, userId]
    );
    if (userVote.rows.length > 0) {
      console.log(`   ⚠️  User ${userId} already voted: ${userVote.rows[0].choice}`);
      console.log('   Trying with a different user...');
      
      // Try another user
      const anotherUser = await db.query(`
        SELECT id, phone, full_name, role, apartment_id, osbb_id 
        FROM users 
        WHERE apartment_id IS NOT NULL AND id != $1
        LIMIT 1
      `, [userId]);
      
      if (anotherUser.rows.length > 0) {
        const altUserId = anotherUser.rows[0].id;
        const altUserVote = await db.query(
          'SELECT * FROM votes WHERE voting_id = $1 AND user_id = $2',
          [8, altUserId]
        );
        if (altUserVote.rows.length === 0) {
          console.log(`   ✅ Using alternative user: ID=${altUserId}`);
          // Use alternative user for test
          const testUserId = altUserId;
          await testVoteInsert(8, testUserId, 'for');
        } else {
          console.log(`   ⚠️  Alternative user also voted`);
          console.log('   Testing with current user anyway (should fail with unique constraint)...');
          await testVoteInsert(8, userId, 'against');
        }
      } else {
        console.log('   No alternative user found, testing insert anyway...');
        await testVoteInsert(8, userId, 'against');
      }
    } else {
      // 8. Try to insert a test vote
      console.log('\n8. Attempting test vote insert...');
      await testVoteInsert(8, userId, 'for');
    }

    // 9. Check data types
    console.log('\n9. Checking data type compatibility...');
    const votingIdType = await db.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'votes' AND column_name = 'voting_id'
    `);
    const userIdType = await db.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'votes' AND column_name = 'user_id'
    `);
    const choiceType = await db.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'votes' AND column_name = 'choice'
    `);
    
    console.log(`   voting_id type: ${votingIdType.rows[0].data_type}`);
    console.log(`   user_id type: ${userIdType.rows[0].data_type}`);
    console.log(`   choice type: ${choiceType.rows[0].data_type} (max length: ${choiceType.rows[0].character_maximum_length})`);

    console.log('\n✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.pool.end();
  }
}

async function testVoteInsert(votingId, userId, choice) {
  try {
    console.log(`   Attempting INSERT: voting_id=${votingId}, user_id=${userId}, choice='${choice}'`);
    
    const result = await db.query(
      'INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3) RETURNING id',
      [votingId, userId, choice]
    );
    
    console.log(`   ✅ INSERT successful! Vote ID: ${result.rows[0].id}`);
    
    // Clean up test vote
    await db.query('DELETE FROM votes WHERE id = $1', [result.rows[0].id]);
    console.log('   ✅ Test vote cleaned up');
    
  } catch (error) {
    console.error(`   ❌ INSERT failed!`);
    console.error(`   Error code: ${error.code}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error detail: ${error.detail}`);
    console.error(`   Error constraint: ${error.constraint}`);
    console.error(`   Error table: ${error.table}`);
    console.error(`   Error column: ${error.column}`);
    
    if (error.code === '23505') {
      console.error('   → This is a UNIQUE constraint violation (duplicate vote)');
    } else if (error.code === '23503') {
      console.error('   → This is a FOREIGN KEY constraint violation');
      console.error('   → Check if voting_id or user_id exists in referenced tables');
    } else if (error.code === '23514') {
      console.error('   → This is a CHECK constraint violation');
      console.error('   → Check if choice is one of: for, against, abstain');
    }
  }
}

diagnoseVoting();
