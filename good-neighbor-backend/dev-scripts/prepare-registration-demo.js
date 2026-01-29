/**
 * Prepare Database for OSBB Registration Video Demo
 * Ensures the new OSBB (99999999) is not registered yet
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function prepareRegistrationDemo() {
  try {
    console.log('\n🎬 Preparing Database for OSBB Registration Video Demo...\n');

    // Check if OSBB 99999999 exists
    const existingOsbb = await db.query(
      'SELECT id, status FROM osbb_organizations WHERE edrpou = $1',
      ['99999999']
    );

    if (existingOsbb.rows.length > 0) {
      const osbb = existingOsbb.rows[0];
      console.log(`⚠️  OSBB 99999999 already exists (ID: ${osbb.id}, Status: ${osbb.status})`);
      
      if (osbb.status === 'approved') {
        console.log('   This OSBB is already approved. For video demo, you can:');
        console.log('   1. Use a different EDRPOU (e.g., 11111111)');
        console.log('   2. Delete this OSBB and its registration request');
        console.log('\n   To delete, run:');
        console.log('   DELETE FROM osbb_registration_requests WHERE osbb_id = ' + osbb.id + ';');
        console.log('   DELETE FROM osbb_organizations WHERE id = ' + osbb.id + ';');
      } else if (osbb.status === 'pending') {
        console.log('   This OSBB has a pending registration. Deleting it...');
        
        // Delete registration request if exists
        await db.query('DELETE FROM osbb_registration_requests WHERE osbb_id = $1', [osbb.id]);
        console.log('   ✅ Deleted registration request');
        
        // Delete OSBB
        await db.query('DELETE FROM osbb_organizations WHERE id = $1', [osbb.id]);
        console.log('   ✅ Deleted OSBB organization');
        console.log('\n   ✅ OSBB 99999999 is now ready for registration!');
      }
    } else {
      console.log('✅ OSBB 99999999 is not registered - ready for video demo!');
    }

    // Check registration requests
    const regRequests = await db.query(
      'SELECT id, osbb_id, status FROM osbb_registration_requests WHERE osbb_id IN (SELECT id FROM osbb_organizations WHERE edrpou = $1)',
      ['99999999']
    );
    
    if (regRequests.rows.length > 0) {
      console.log(`\n⚠️  Found ${regRequests.rows.length} registration request(s) for OSBB 99999999`);
      console.log('   These will be cleaned up automatically when OSBB is deleted');
    }

    console.log('\n📋 Registration Data Summary:');
    console.log('   EDRPOU: 99999999');
    console.log('   RNOKPP: 5555555555');
    console.log('   Full Name: Мельник Дмитро Олександрович');
    console.log('   Email: admin@novyi-budynok.ua');
    console.log('   Phone: +380501111111');
    console.log('   Password: password123');
    console.log('\n✅ Database is ready for video recording!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

prepareRegistrationDemo();
