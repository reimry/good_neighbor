const db = require('./src/db/connection');

async function seedVotings() {
  try {
    console.log('🌱 Seeding votings...');
    
    // 1. Create an active "Simple" voting
    await db.query(`
      INSERT INTO votings (title, description, type, status, start_date, end_date)
      VALUES (
        'Встановлення шлагбауму', 
        'Чи підтримуєте ви встановлення шлагбауму при в’їзді у двір? Вартість 50 000 грн.', 
        'simple', 
        'active',
        NOW(),
        NOW() + INTERVAL '30 days'
      )
    `);

    // 2. Create a finished "Legal" voting (Area based)
    const finishedResult = await db.query(`
      INSERT INTO votings (title, description, type, status, start_date, end_date)
      VALUES (
        'Створення ОСББ (Завершено)', 
        'Голосування за створення ОСББ "Добрий Сусід". Це тестове завершене голосування.', 
        'legal', 
        'finished',
        NOW() - INTERVAL '7 days',
        NOW()
      ) RETURNING id
    `);
    
    const finishedId = finishedResult.rows[0].id;

    // Add some fake votes for the finished one to show results
    // We need user IDs. Let's just assuming we have some or skip vote seeding if no users.
    // For visualization, we can just let it be empty or hack it if we really want.
    // But empty finished voting is fine too, or we can't easily seed votes without knowing user IDs.
    // Let's just create the votings.

    console.log('✅ Votings seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding votings:', err);
    process.exit(1);
  }
}

seedVotings();
