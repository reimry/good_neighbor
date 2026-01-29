/**
 * Comprehensive Demo Data Seeding Script
 * Creates realistic data for video presentations and demonstrations
 * 
 * Usage: node dev-scripts/seed-demo-data.js
 */

require('dotenv').config();
const db = require('../src/db/connection');
const bcrypt = require('bcrypt');
const { generateBillsForPeriod, updateBalancesFromBills } = require('../src/services/billingEngine');

async function seedDemoData() {
  try {
    console.log('\n🎬 Seeding Demo Data for Video Presentation...\n');

    // Check if email column exists
    const emailCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);
    const hasEmail = emailCheck.rows.length > 0;

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create OSBB Organizations
    console.log('📋 Creating OSBB Organizations...');
    
    let osbb1Id, osbb2Id;
    
    // OSBB 1: "СОНЯЧНИЙ"
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

    // OSBB 2: "МІЙ ДІМ"
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
    console.log('\n🏠 Creating Apartments...');
    const apartments = [];
    
    // OSBB 1: 15 apartments
    for (let i = 1; i <= 15; i++) {
      const area = 40 + Math.random() * 50; // 40-90 m²
      const existingApt = await db.query('SELECT id FROM apartments WHERE number = $1 AND osbb_id = $2', [String(i), osbb1Id]);
      if (existingApt.rows.length > 0) {
        apartments.push({ id: existingApt.rows[0].id, number: String(i), osbb_id: osbb1Id, area });
        continue;
      }
      
      const result = await db.query(`
        INSERT INTO apartments (number, area, balance, osbb_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [String(i), area.toFixed(2), 0, osbb1Id]);
      
      if (result.rows.length > 0) {
        apartments.push({ id: result.rows[0].id, number: String(i), osbb_id: osbb1Id, area });
      }
    }

    // OSBB 2: 10 apartments
    for (let i = 1; i <= 10; i++) {
      const area = 45 + Math.random() * 45; // 45-90 m²
      const existingApt = await db.query('SELECT id FROM apartments WHERE number = $1 AND osbb_id = $2', [String(i), osbb2Id]);
      if (existingApt.rows.length > 0) {
        apartments.push({ id: existingApt.rows[0].id, number: String(i), osbb_id: osbb2Id, area });
        continue;
      }
      
      const result = await db.query(`
        INSERT INTO apartments (number, area, balance, osbb_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [String(i), area.toFixed(2), 0, osbb2Id]);
      
      if (result.rows.length > 0) {
        apartments.push({ id: result.rows[0].id, number: String(i), osbb_id: osbb2Id, area });
      }
    }

    console.log(`✅ Created ${apartments.length} apartments`);

    // 3. Create Users
    console.log('\n👥 Creating Users...');
    const users = [];

    // Admin users (one per OSBB)
    const adminNames = ['Петренко Іван Олександрович', 'Коваленко Марія Василівна'];
    const adminPhones = ['+380501234567', '+380501234568'];
    const adminEmails = hasEmail ? ['admin1@osbb1.ua', 'admin2@osbb2.ua'] : [null, null];

    for (let i = 0; i < 2; i++) {
      const osbbId = i === 0 ? osbb1Id : osbb2Id;
      const phone = adminPhones[i];
      const email = adminEmails[i];
      
      const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) {
        users.push({ id: existing.rows[0].id, role: 'admin', osbb_id: osbbId });
        continue;
      }
      
      const userQuery = hasEmail && email
        ? `INSERT INTO users (phone, email, password_hash, full_name, role, osbb_id)
           VALUES ($1, $2, $3, $4, 'admin', $5)
           RETURNING id`
        : `INSERT INTO users (phone, password_hash, full_name, role, osbb_id)
           VALUES ($1, $2, $3, 'admin', $4)
           RETURNING id`;
      
      const params = hasEmail && email
        ? [phone, email, passwordHash, adminNames[i], osbbId]
        : [phone, passwordHash, adminNames[i], osbbId];
      
      const result = await db.query(userQuery, params);
      if (result.rows.length > 0) {
        users.push({ id: result.rows[0].id, role: 'admin', osbb_id: osbbId });
      }
    }

    // Owner/Tenant users (20 users)
    const ownerNames = [
      'Іванов Олексій Петрович', 'Петрова Марія Іванівна', 'Сидоренко Андрій Володимирович',
      'Коваль Олена Сергіївна', 'Мельник Дмитро Олександрович', 'Шевченко Наталія Вікторівна',
      'Бондаренко Сергій Миколайович', 'Ткаченко Оксана Олегівна', 'Морозов Віктор Ігорович',
      'Лисенко Ірина Борисівна', 'Гриценко Павло Сергійович', 'Романенко Юлія Олександрівна',
      'Савченко Максим Віталійович', 'Кравченко Анна Петрівна', 'Олійник Олег Дмитрович',
      'Захарченко Тетяна Володимирівна', 'Білоусов Ігор Сергійович', 'Кузьменко Світлана Олексіївна',
      'Терещенко Роман Андрійович', 'Гончаренко Вікторія Миколаївна'
    ];

    for (let i = 0; i < 20; i++) {
      const apt = apartments[i % apartments.length];
      const role = i % 3 === 0 ? 'tenant' : 'owner'; // Mix of owners and tenants
      const phone = `+380501234${String(i + 100).padStart(3, '0')}`;
      const email = hasEmail ? `user${i}@example.com` : null;
      
      const existing = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length > 0) {
        users.push({ id: existing.rows[0].id, role, apartment_id: apt.id, osbb_id: apt.osbb_id });
        continue;
      }
      
      if (hasEmail && email) {
        const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) continue;
      }
      
      const userQuery = hasEmail && email
        ? `INSERT INTO users (phone, email, password_hash, full_name, role, apartment_id, osbb_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`
        : `INSERT INTO users (phone, password_hash, full_name, role, apartment_id, osbb_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`;
      
      const params = hasEmail && email
        ? [phone, email, passwordHash, ownerNames[i], role, apt.id, apt.osbb_id]
        : [phone, passwordHash, ownerNames[i], role, apt.id, apt.osbb_id];
      
      const result = await db.query(userQuery, params);
      if (result.rows.length > 0) {
        users.push({ id: result.rows[0].id, role, apartment_id: apt.id, osbb_id: apt.osbb_id });
      }
    }

    console.log(`✅ Created ${users.length} users`);

    // 4. Create News
    console.log('\n📰 Creating News...');
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0) {
      const newsItems = [
        {
          title: 'Важлива інформація про збір коштів',
          content: 'Шановні мешканці! Нагадуємо про необхідність своєчасної оплати комунальних послуг. Збір коштів на ремонт даху заплановано на березень 2025 року. Детальна інформація буде надана пізніше.',
          is_important: true
        },
        {
          title: 'Зустріч мешканців 15 березня',
          content: 'Запрошуємо всіх мешканців на загальні збори, які відбудуться 15 березня 2025 року о 18:00 у приміщенні ОСББ. На порядку денному: обговорення плану ремонтних робіт, звіт про використання коштів, вибори управителя.',
          is_important: true
        },
        {
          title: 'Ремонт під\'їзду заплановано на квітень',
          content: 'Повідомляємо, що ремонт під\'їзду №1 заплановано на квітень 2025 року. Буде виконано фарбування стін, заміну освітлення та оновлення підлогового покриття. Просимо терпіння під час проведення робіт.',
          is_important: false
        },
        {
          title: 'Оновлення правил використання ліфту',
          content: 'Нагадуємо про правила використання ліфту: заборонено перевантаження, куріння та перевезення будівельних матеріалів без дозволу. Дякуємо за розуміння!',
          is_important: false
        },
        {
          title: 'Встановлення відеоспостереження',
          content: 'У рамках забезпечення безпеки мешканців, планується встановлення системи відеоспостереження у під\'їздах та на території будинку. Голосування щодо цього питання буде проведено найближчим часом.',
          is_important: false
        },
        {
          title: 'Звіт про виконання бюджету за 2024 рік',
          content: 'Публікуємо звіт про виконання бюджету ОСББ за 2024 рік. Всі документи доступні в адмін-панелі. За додатковою інформацією звертайтесь до управителя.',
          is_important: false
        },
        {
          title: 'Оголошення про зміну графіку вивізу сміття',
          content: 'З 1 березня 2025 року змінюється графік вивізу сміття. Вивіз буде здійснюватись щопонеділка та щоп\'ятниці. Просимо дотримуватись графіку та не залишати сміття поза контейнерами.',
          is_important: false
        },
        {
          title: 'Проведення загальних зборів',
          content: 'Нагадуємо про необхідність участі у загальних зборах мешканців. Ваша думка важлива для прийняття рішень щодо управління будинком.',
          is_important: true
        }
      ];
      
      for (let i = 0; i < newsItems.length; i++) {
        const news = newsItems[i];
        const authorId = adminUsers[i % adminUsers.length].id;
        
        // Check if news already exists
        const existing = await db.query('SELECT id FROM news WHERE title = $1', [news.title]);
        if (existing.rows.length > 0) continue;
        
        await db.query(`
          INSERT INTO news (title, content, is_important, author_id)
          VALUES ($1, $2, $3, $4)
        `, [news.title, news.content, news.is_important, authorId]);
      }
      console.log(`✅ Created ${newsItems.length} news items`);
    }

    // 5. Create Votings
    console.log('\n🗳️  Creating Votings...');
    if (adminUsers.length > 0) {
      const now = new Date();
      
      // Check if osbb_id column exists
      const votingsOsbbCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'votings' AND column_name = 'osbb_id'
      `);
      const hasOsbbId = votingsOsbbCheck.rows.length > 0;
      
      const votings = [
        {
          title: 'Збір коштів на ремонт даху',
          description: 'Голосування щодо збору коштів на ремонт даху будинку. Загальна сума: 500 000 грн. Розподіл коштів між квартирами пропорційно площі.',
          type: 'legal',
          start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          end_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'active',
          osbb_id: osbb1Id
        },
        {
          title: 'Встановлення шлагбауму',
          description: 'Чи підтримуєте ви встановлення шлагбауму при в\'їзді у двір? Вартість 50 000 грн.',
          type: 'simple',
          start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          end_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          status: 'active',
          osbb_id: osbb1Id
        },
        {
          title: 'Вибір управителя',
          description: 'Голосування щодо вибору нового управителя ОСББ. Кандидати: Петренко І.О., Коваленко М.В.',
          type: 'simple',
          start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          status: 'finished',
          osbb_id: osbb1Id
        },
        {
          title: 'Оновлення системи опалення',
          description: 'Голосування щодо заміни системи опалення. Загальна сума: 800 000 грн.',
          type: 'legal',
          start_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          end_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          status: 'finished',
          osbb_id: osbb1Id
        },
        {
          title: 'Встановлення відеоспостереження',
          description: 'Голосування щодо встановлення системи відеоспостереження. Вартість: 120 000 грн.',
          type: 'legal',
          start_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          end_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          status: 'active',
          osbb_id: osbb2Id
        }
      ];
      
      const votingIds = [];
      for (const voting of votings) {
        const votingQuery = hasOsbbId
          ? `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by, osbb_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`
          : `INSERT INTO votings (title, description, type, start_date, end_date, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`;
        
        const votingParams = hasOsbbId
          ? [voting.title, voting.description, voting.type, voting.start_date, voting.end_date, voting.status, adminUsers[0].id, voting.osbb_id]
          : [voting.title, voting.description, voting.type, voting.start_date, voting.end_date, voting.status, adminUsers[0].id];
        
        const result = await db.query(votingQuery, votingParams);
        if (result.rows.length > 0) {
          votingIds.push({ id: result.rows[0].id, status: voting.status, osbb_id: voting.osbb_id });
        }
      }
      
      console.log(`✅ Created ${votingIds.length} votings`);
      
      // Add votes to finished votings
      console.log('\n🗳️  Adding votes to finished votings...');
      const finishedVotings = votingIds.filter(v => v.status === 'finished');
      const osbb1Users = users.filter(u => u.osbb_id === osbb1Id && (u.role === 'owner' || u.role === 'tenant'));
      
      for (const voting of finishedVotings) {
        // Add votes from 60-80% of users
        const votersCount = Math.floor(osbb1Users.length * (0.6 + Math.random() * 0.2));
        const shuffled = [...osbb1Users].sort(() => Math.random() - 0.5);
        const voters = shuffled.slice(0, votersCount);
        
        for (const voter of voters) {
          const choices = ['for', 'against', 'abstain'];
          const choice = choices[Math.floor(Math.random() * choices.length)];
          
          // Check if vote already exists
          const existing = await db.query(
            'SELECT id FROM votes WHERE voting_id = $1 AND user_id = $2',
            [voting.id, voter.id]
          );
          
          if (existing.rows.length === 0) {
            await db.query(
              'INSERT INTO votes (voting_id, user_id, choice) VALUES ($1, $2, $3)',
              [voting.id, voter.id, choice]
            );
          }
        }
      }
      console.log(`✅ Added votes to ${finishedVotings.length} finished votings`);
    }

    // 6. Generate Bills
    console.log('\n💰 Generating Bills...');
    const startMonth = new Date();
    startMonth.setMonth(startMonth.getMonth() - 6); // Last 6 months
    startMonth.setDate(1);
    
    for (const osbbId of [osbb1Id, osbb2Id]) {
      console.log(`   Generating bills for OSBB ${osbbId}...`);
      const result = await generateBillsForPeriod(osbbId, startMonth, 6);
      if (result.success) {
        console.log(`   ✅ Generated ${result.totalGenerated} bills for OSBB ${osbbId}`);
        
        // Update balances
        for (let i = 0; i < 6; i++) {
          const currentMonth = new Date(startMonth);
          currentMonth.setMonth(startMonth.getMonth() + i);
          await updateBalancesFromBills(osbbId, currentMonth);
        }
      } else {
        console.log(`   ⚠️  Some errors for OSBB ${osbbId}`);
      }
    }

    // 7. Create Invitation Codes
    console.log('\n🎫 Creating Invitation Codes...');
    const unusedApartments = apartments.filter(apt => 
      !users.some(u => u.apartment_id === apt.id)
    ).slice(0, 5);
    
    for (let i = 0; i < unusedApartments.length; i++) {
      const apt = unusedApartments[i];
      const code = `OWNER${String(i + 300).padStart(3, '0')}`;
      
      const existing = await db.query('SELECT id FROM invitation_codes WHERE code = $1', [code]);
      if (existing.rows.length === 0) {
        await db.query(`
          INSERT INTO invitation_codes (code, apartment_id, role)
          VALUES ($1, $2, 'owner')
        `, [code, apt.id]);
      }
    }
    console.log(`✅ Created ${unusedApartments.length} invitation codes`);

    console.log('\n✅ Demo data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - OSBB Organizations: 2`);
    console.log(`   - Apartments: ${apartments.length}`);
    console.log(`   - Users: ${users.length} (${users.filter(u => u.role === 'admin').length} admins, ${users.filter(u => u.role === 'owner').length} owners, ${users.filter(u => u.role === 'tenant').length} tenants)`);
    console.log(`   - News: 8`);
    console.log(`   - Votings: 5 (2 active, 3 finished with votes)`);
    console.log(`   - Bills: ~${apartments.length * 6 * 6} (6 months × 6 service types)`);
    console.log(`   - Invitation Codes: ${unusedApartments.length}`);
    console.log('\n💡 Test credentials:');
    console.log('   Regular users: phone (+380501234XXX), password: password123');
    console.log('   Admin 1: phone (+380501234567), password: password123');
    console.log('   Admin 2: phone (+380501234568), password: password123');
    console.log('\n🎬 Your application is now ready for video demonstrations!\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

seedDemoData();
