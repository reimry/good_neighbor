/**
 * Reset OSBB Registration Script
 * Cleans up registration data so you can redo the registration process
 * 
 * Usage: node dev-scripts/reset-osbb-registration.js [EDRPOU]
 * Example: node dev-scripts/reset-osbb-registration.js 99999999
 */

require('dotenv').config();
const db = require('../src/db/connection');
const fs = require('fs');
const path = require('path');

async function resetOSBBRegistration() {
  try {
    const edrpou = process.argv[2] || '99999999';
    
    console.log('\n🔄 Resetting OSBB Registration...\n');
    console.log(`Target EDRPOU: ${edrpou}\n`);

    // 1. Find OSBB by EDRPOU
    const osbbResult = await db.query(
      'SELECT id, edrpou, full_name, status FROM osbb_organizations WHERE edrpou = $1',
      [edrpou]
    );

    if (osbbResult.rows.length === 0) {
      console.log('✅ No OSBB found with this EDRPOU - already clean!');
      console.log('   You can proceed with registration.\n');
      await db.pool.end();
      return;
    }

    const osbb = osbbResult.rows[0];
    console.log(`Found OSBB: ${osbb.full_name} (ID: ${osbb.id}, Status: ${osbb.status})`);

    // 2. Find registration requests
    const regRequests = await db.query(
      'SELECT id, protocol_path FROM osbb_registration_requests WHERE osbb_id = $1',
      [osbb.id]
    );

    console.log(`Found ${regRequests.rows.length} registration request(s)`);

    // 3. Delete registration requests and their PDF files
    if (regRequests.rows.length > 0) {
      for (const request of regRequests.rows) {
        // Delete PDF file if it exists
        if (request.protocol_path) {
          const pdfPath = path.join(__dirname, '../../uploads', request.protocol_path);
          try {
            if (fs.existsSync(pdfPath)) {
              fs.unlinkSync(pdfPath);
              console.log(`   ✅ Deleted PDF: ${request.protocol_path}`);
            }
          } catch (fileErr) {
            console.log(`   ⚠️  Could not delete PDF: ${fileErr.message}`);
          }
        }
      }

      // Delete registration requests
      await db.query('DELETE FROM osbb_registration_requests WHERE osbb_id = $1', [osbb.id]);
      console.log(`   ✅ Deleted ${regRequests.rows.length} registration request(s)`);
    }

    // 4. Check if OSBB has users (admins) - warn if it does
    const users = await db.query(
      'SELECT id, full_name, role FROM users WHERE osbb_id = $1',
      [osbb.id]
    );

    if (users.rows.length > 0) {
      console.log(`\n⚠️  WARNING: This OSBB has ${users.rows.length} associated user(s):`);
      users.rows.forEach(user => {
        console.log(`   - ${user.full_name} (${user.role})`);
      });
      console.log('\n   These users will NOT be deleted for safety.');
      console.log('   Only the OSBB organization and registration requests will be removed.');
      console.log('   Users will remain but will lose their osbb_id association.\n');
    }

    // 5. Check if OSBB has apartments
    const apartments = await db.query(
      'SELECT COUNT(*) as count FROM apartments WHERE osbb_id = $1',
      [osbb.id]
    );
    const aptCount = parseInt(apartments.rows[0].count);

    if (aptCount > 0) {
      console.log(`⚠️  WARNING: This OSBB has ${aptCount} apartment(s).`);
      console.log('   Apartments will NOT be deleted.');
      console.log('   They will remain but will lose their osbb_id association.\n');
    }

    // 6. Delete OSBB organization
    await db.query('DELETE FROM osbb_organizations WHERE id = $1', [osbb.id]);
    console.log(`✅ Deleted OSBB organization (ID: ${osbb.id})`);

    // 7. Update users to remove osbb_id (if they were admins)
    if (users.rows.length > 0) {
      await db.query('UPDATE users SET osbb_id = NULL WHERE osbb_id = $1', [osbb.id]);
      console.log(`✅ Removed osbb_id from ${users.rows.length} user(s)`);
    }

    // 8. Update apartments to remove osbb_id (set to NULL or default)
    if (aptCount > 0) {
      // Check if there's a default OSBB (ID 1) to reassign to
      const defaultOsbb = await db.query('SELECT id FROM osbb_organizations WHERE id = 1');
      if (defaultOsbb.rows.length > 0) {
        await db.query('UPDATE apartments SET osbb_id = 1 WHERE osbb_id = $1', [osbb.id]);
        console.log(`✅ Reassigned ${aptCount} apartment(s) to default OSBB (ID: 1)`);
      } else {
        await db.query('UPDATE apartments SET osbb_id = NULL WHERE osbb_id = $1', [osbb.id]);
        console.log(`✅ Removed osbb_id from ${aptCount} apartment(s)`);
      }
    }

    console.log('\n✅ Reset complete!');
    console.log(`   OSBB ${edrpou} has been removed and is ready for new registration.\n`);

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await db.pool.end();
  }
}

resetOSBBRegistration();
