/**
 * Comprehensive Test Data Seeding Script
 * Creates realistic test data for development and testing
 */

require('dotenv').config();
const db = require('../src/db/connection');
const bcrypt = require('bcrypt');
const argon2 = require('argon2');

async function seedTestData() {
  try {
    console.log('\n🌱 Seeding Test Data...\n');

    // Check if email column exists
    const emailCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    const hasEmail = emailCheck.rows.length > 0;

    // 1. Create OSBB Organizations
    console.log('Creating OSBB Organizations...');
    
    // Check if OSBBs already exist
    let osbb1Id, osbb2Id;
    const existingOsbb1 = await db.query('SELECT id FROM osbb_organizations WHERE edrpou = $1', ['12345678']);
    if (existingOsbb1.rows.length > 0) {
      osbb1Id = existingOsbb1.rows[0].id;
      await db.query('UPDATE osbb_organizations SET status = $1 WHERE id = $2', ['approved', osbb1Id]);
    } else {
      const osbb1 = await db.query(`
        INSERT INTO osbb_organizations (edrpou, full_name, address_city, address_street, address_building, authorized_person, status)
        VALUES ('12345678', 'ОСББ "СОНЯЧНИЙ"', 'Київ', 'вул. Хрещатик', '1', 'Петренко Іван Олександрович', 'approved')
        RETURNING id
      `);
      osbb1Id = osbb1.rows[0].id;
    }

    const existingOsbb2 = await db.query('SELECT id FROM osbb_organizations WHERE edrpou = $1', ['87654321']);
    if (existingOsbb2.rows.length > 0) {
      osbb2Id = existingOsbb2.rows[0].id;
      await db.query('UPDATE osbb_organizations SET status = $1 WHERE id = $2', ['approved', osbb2Id]);
    } else {
      const osbb2 = await db.query(`
        INSERT INTO osbb_organizations (edrpou, full_name, address_city, address_street, address_building, authorized_person, status)
        VALUES ('87654321', 'ОСББ "МІЙ ДІМ"', 'Львів', 'вул. Свободи', '15', 'Коваленко Марія Василівна', 'approved')
        RETURNING id
      `);
      osbb2Id = osbb2.rows[0].id;
    }

    console.log(`✅ Created OSBB organizations: ${osbb1Id}, ${osbb2Id}`);

    // 2. Create Apartments
    console.log('\nCreating Apartments...');
    const apartments = [];
    for (let i = 1; i <= 20; i++) {
      const osbbId = i <= 10 ? osbb1Id : osbb2Id;
      const area = 40 + Math.random() * 40; // 40-80 m²
      const balance = (Math.random() - 0.3) * 2000; // -600 to +1400
      
      // Check if apartment already exists
      const existingApt = await db.query('SELECT id FROM apartments WHERE number = $1 AND osbb_id = $2', [String(i), osbbId]);
      if (existingApt.rows.length > 0) {
        apartments.push({ id: existingApt.rows[0].id, number: String(i), osbb_id: osbbId });
        continue;
      }
      
      const result = await db.query(`
        INSERT INTO apartments (number, area, balance, osbb_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [String(i), area.toFixed(2), balance.toFixed(2), osbbId]);
      
      if (result.rows.length > 0) {
        apartments.push({ id: result.rows[0].id, number: String(i), osbb_id: osbbId });
      }
    }
    console.log(`✅ Created ${apartments.length} apartments`);

    // 3. Create Regular Users (admins, owners, tenants)
    console.log('\nCreating Regular Users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [];

    // Create admin users
    for (let i = 0; i < 2; i++) {
      const osbbId = i === 0 ? osbb1Id : osbb2Id;
      const phone = `+380501234${String(i).padStart(3, '0')}`;
      const email = hasEmail ? `admin${i}@osbb${i + 1}.ua` : null;
      
      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) {
        users.push({ id: existing.rows[0].id, role: 'admin', osbb_id: osbbId });
        continue;
      }
      
      const userQuery = hasEmail 
        ? `INSERT INTO users (phone, ${email ? 'email, ' : ''}password_hash, full_name, role, osbb_id)
           VALUES ($1, ${email ? '$2, ' : ''}${email ? '$3' : '$2'}, ${email ? '$4' : '$3'}, 'admin', $${email ? '5' : '4'})
           RETURNING id`
        : `INSERT INTO users (phone, password_hash, full_name, role, osbb_id)
           VALUES ($1, $2, $3, 'admin', $4)
           RETURNING id`;
      
      const params = hasEmail 
        ? [phone, email, passwordHash, `Admin User ${i + 1}`, osbbId]
        : [phone, passwordHash, `Admin User ${i + 1}`, osbbId];
      
      const result = await db.query(userQuery, params);
      if (result.rows.length > 0) {
        users.push({ id: result.rows[0].id, role: 'admin', osbb_id: osbbId });
      }
    }

    // Create owner/tenant users
    for (let i = 0; i < 10; i++) {
      const apt = apartments[i % apartments.length];
      const role = i % 2 === 0 ? 'owner' : 'tenant';
      const phone = `+380501234${String(i + 10).padStart(3, '0')}`;
      const email = hasEmail ? `user${i}@example.com` : null;
      
      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) {
        users.push({ id: existing.rows[0].id, role, apartment_id: apt.id, osbb_id: apt.osbb_id });
        continue;
      }
      
      // Check email uniqueness if email column exists
      if (hasEmail && email) {
        const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          continue; // Skip if email already exists
        }
      }
      
      const userQuery = hasEmail
        ? `INSERT INTO users (phone, ${email ? 'email, ' : ''}password_hash, full_name, role, apartment_id, osbb_id)
           VALUES ($1, ${email ? '$2, ' : ''}${email ? '$3' : '$2'}, ${email ? '$4' : '$3'}, $${email ? '5' : '4'}, $${email ? '6' : '5'}, $${email ? '7' : '6'})
           RETURNING id`
        : `INSERT INTO users (phone, password_hash, full_name, role, apartment_id, osbb_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`;
      
      const params = hasEmail
        ? [phone, email, passwordHash, `${role === 'owner' ? 'Owner' : 'Tenant'} User ${i + 1}`, role, apt.id, apt.osbb_id]
        : [phone, passwordHash, `${role === 'owner' ? 'Owner' : 'Tenant'} User ${i + 1}`, role, apt.id, apt.osbb_id];
      
      const result = await db.query(userQuery, params);
      if (result.rows.length > 0) {
        users.push({ id: result.rows[0].id, role, apartment_id: apt.id, osbb_id: apt.osbb_id });
      }
    }

    console.log(`✅ Created ${users.length} regular users`);

    // 4. Create News
    console.log('\nCreating News...');
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0) {
      const newsTitles = [
        'Важлива інформація про збір коштів',
        'Зустріч мешканців 15 березня',
        'Ремонт під\'їзду заплановано на квітень',
        'Оновлення правил використання ліфту'
      ];
      
      for (let i = 0; i < newsTitles.length; i++) {
        await db.query(`
          INSERT INTO news (title, content, is_important, author_id)
          VALUES ($1, $2, $3, $4)
        `, [
          newsTitles[i],
          `Детальна інформація про ${newsTitles[i].toLowerCase()}. Будь ласка, ознайомтесь з деталями.`,
          i === 0,
          adminUsers[i % adminUsers.length].id
        ]);
      }
      console.log(`✅ Created ${newsTitles.length} news items`);
    }

    // 5. Create Votings
    console.log('\nCreating Votings...');
    if (adminUsers.length > 0) {
      // Check if osbb_id column exists in votings table
      const votingsOsbbCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'votings' AND column_name = 'osbb_id'
      `);
      const votingsHasOsbb = votingsOsbbCheck.rows.length > 0;
      
      const now = new Date();
      const voting1Query = votingsHasOsbb
        ? `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by, osbb_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`
        : `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`;
      
      const voting1Params = votingsHasOsbb
        ? [
            'Збір коштів на ремонт даху',
            'Голосування щодо збору коштів на ремонт даху будинку',
            'legal',
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            'active',
            adminUsers[0].id,
            osbb1Id
          ]
        : [
            'Збір коштів на ремонт даху',
            'Голосування щодо збору коштів на ремонт даху будинку',
            'legal',
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            'active',
            adminUsers[0].id
          ];
      
      const voting1 = await db.query(voting1Query, voting1Params);

      const voting2Query = votingsHasOsbb
        ? `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by, osbb_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`
        : `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`;
      
      const voting2Params = votingsHasOsbb
        ? [
            'Вибір управителя',
            'Голосування щодо вибору нового управителя ОСББ',
            'simple',
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            'finished',
            adminUsers[0].id,
            osbb1Id
          ]
        : [
            'Вибір управителя',
            'Голосування щодо вибору нового управителя ОСББ',
            'simple',
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            'finished',
            adminUsers[0].id
          ];
      
      const voting2 = await db.query(voting2Query, voting2Params);

      console.log(`✅ Created 2 votings`);
    }

    // 6. Create Invitation Codes
    console.log('\nCreating Invitation Codes...');
    for (let i = 0; i < 5; i++) {
      const apt = apartments[i + 10];
      if (apt) {
        const code = `OWNER${String(i + 200).padStart(3, '0')}`;
        // Check if code already exists
        const existing = await db.query('SELECT id FROM invitation_codes WHERE code = $1', [code]);
        if (existing.rows.length === 0) {
          await db.query(`
            INSERT INTO invitation_codes (code, apartment_id, role)
            VALUES ($1, $2, $3)
          `, [code, apt.id, 'owner']);
        }
      }
    }
    console.log(`✅ Created 5 invitation codes`);

    console.log('\n✅ Test data seeding complete!\n');
    console.log('Summary:');
    console.log(`  - OSBB Organizations: 2`);
    console.log(`  - Apartments: ${apartments.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - News: 4`);
    console.log(`  - Votings: 2`);
    console.log(`  - Invitation Codes: 5`);
    console.log('\n💡 Test credentials:');
    console.log('   Regular users: phone (+380501234XXX), password: password123');
    console.log('   SuperAdmin: login_id: admin123, password: (your password)\n');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

seedTestData();
