require('dotenv').config(); // Завантажуємо .env
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDbConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL!');

    // Виконуємо запит "SELECT NOW();"
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);

    client.release();
    pool.end();
  } catch (err) {
    console.error('Error connecting to database:', err.stack);
  }
}

checkDbConnection();