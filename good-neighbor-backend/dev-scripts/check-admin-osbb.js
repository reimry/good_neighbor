/**
 * Check admin user's OSBB association and apartments
 */

require('dotenv').config();
const db = require('../src/db/connection');

async function checkAdminOSBB() {
  try {
    console.log('\n🔍 Checking Admin OSBB Association...\n');

    // Check if email column exists
    const emailCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    const hasEmail = emailCheck.rows.length > 0;
    
    // Get all admin users
    const adminQuery = hasEmail
      ? 'SELECT id, full_name, phone, email, role, osbb_id FROM users WHERE role = $1'
      : 'SELECT id, full_name, phone, role, osbb_id FROM users WHERE role = $1';
    const admins = await db.query(adminQuery, ['admin']);

    console.log(`Found ${admins.rows.length} admin users:\n`);

    for (const admin of admins.rows) {
      console.log(`Admin: ${admin.full_name} (ID: ${admin.id})`);
      console.log(`  Phone: ${admin.phone || 'N/A'}`);
      if (hasEmail) {
        console.log(`  Email: ${admin.email || 'N/A'}`);
      }
      console.log(`  OSBB ID (direct): ${admin.osbb_id || 'NULL'}`);

      if (!admin.osbb_id) {
        console.log(`  ⚠️  No direct osbb_id link!`);
        
        // Check registration requests
        const regCheck = await db.query(`
          SELECT osbb_id, status, head_email, head_phone 
          FROM osbb_registration_requests 
          WHERE (${hasEmail && admin.email ? 'head_email = $1' : 'FALSE'} ${hasEmail && admin.email && admin.phone ? 'OR' : ''} ${admin.phone ? 'head_phone = $2' : 'FALSE'}) AND status = 'approved'
        `, [admin.email || null, admin.phone || null].filter(v => v !== null));
        
        if (regCheck.rows.length > 0) {
          console.log(`  Found in registration: OSBB ID ${regCheck.rows[0].osbb_id}`);
        } else {
          console.log(`  ❌ Not found in approved registrations`);
        }
      } else {
        // Check if OSBB exists
        const osbbCheck = await db.query(
          'SELECT id, full_name, status FROM osbb_organizations WHERE id = $1',
          [admin.osbb_id]
        );
        
        if (osbbCheck.rows.length > 0) {
          const osbb = osbbCheck.rows[0];
          console.log(`  ✅ OSBB exists: ${osbb.full_name} (Status: ${osbb.status})`);
          
          // Check apartments
          const apts = await db.query(
            'SELECT COUNT(*) as count FROM apartments WHERE osbb_id = $1',
            [admin.osbb_id]
          );
          console.log(`  Apartments: ${apts.rows[0].count}`);
        } else {
          console.log(`  ❌ OSBB with ID ${admin.osbb_id} does not exist!`);
        }
      }
      console.log('');
    }

    // Test the actual query that the API uses
    console.log('\n🧪 Testing apartments query for Admin User 1 (ID: 2)...\n');
    
    const testAdminId = 2;
    const testOsbbId = admins.rows[0].osbb_id;
    
    console.log(`Testing with Admin ID: ${testAdminId}, OSBB ID: ${testOsbbId}\n`);
    
    // Get apartments for this OSBB
    const osbbApartments = await db.query(
      'SELECT * FROM apartments WHERE osbb_id = $1 ORDER BY number',
      [testOsbbId]
    );
    
    console.log(`Found ${osbbApartments.rows.length} apartments for OSBB ${testOsbbId}`);
    
    if (osbbApartments.rows.length > 0) {
      const apartmentIds = osbbApartments.rows.map(apt => apt.id);
      console.log(`Apartment IDs: ${apartmentIds.join(', ')}\n`);
      
      // Check if email column exists
      const emailCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
      `);
      const hasEmail = emailCheck.rows.length > 0;
      console.log(`Email column exists: ${hasEmail}\n`);
      
      // Check if used_at column exists
      const usedAtCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'invitation_codes' AND column_name = 'used_at'
      `);
      const hasUsedAt = usedAtCheck.rows.length > 0;
      console.log(`used_at column exists: ${hasUsedAt}\n`);
      
      const invitationCodesFields = hasUsedAt
        ? `'code', ic.code, 'role', ic.role, 'is_used', ic.is_used, 'used_at', ic.used_at, 'created_at', ic.created_at`
        : `'code', ic.code, 'role', ic.role, 'is_used', ic.is_used, 'created_at', ic.created_at`;
      
      // Try the actual query
      try {
        const result = await db.query(`
          SELECT 
            a.id,
            a.number,
            a.area,
            a.balance,
            u.id as user_id,
            u.full_name as owner,
            u.phone,
            ${hasEmail ? 'u.email,' : 'NULL as email,'}
            CASE 
              WHEN u.id IS NOT NULL THEN 'activated'
              WHEN EXISTS (SELECT 1 FROM invitation_codes ic WHERE ic.apartment_id = a.id AND ic.is_used = false) THEN 'invited'
              ELSE 'not_invited'
            END as status,
            COALESCE((
              SELECT json_agg(
                json_build_object(
                  ${invitationCodesFields}
                ) ORDER BY ic.created_at DESC
              )
              FROM invitation_codes ic
              WHERE ic.apartment_id = a.id
            ), '[]'::json) as invitation_codes
          FROM apartments a
          LEFT JOIN users u ON a.id = u.apartment_id
          WHERE a.id = ANY($1::int[]) AND a.number != 'ADMIN'
          ORDER BY a.number
        `, [apartmentIds]);
        
        console.log(`✅ Query successful! Returned ${result.rows.length} apartments`);
        console.log(`First apartment:`, JSON.stringify(result.rows[0], null, 2));
      } catch (queryErr) {
        console.error(`❌ Query failed:`, queryErr.message);
        console.error(`Stack:`, queryErr.stack);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.pool.end();
  }
}

checkAdminOSBB();
