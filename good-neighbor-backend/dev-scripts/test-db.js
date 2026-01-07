const { Client } = require('pg');
require('dotenv').config();

// Construct connection string from individual vars if DATABASE_URL is missing
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

console.log('--- Database Connection Test ---');
console.log('Trying to connect with:', connectionString.replace(/:[^:@]*@/, ':****@'));

const client = new Client({
  connectionString,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connection Sucessful!');
    
    // Check if table exists
    const res = await client.query("SELECT to_regclass('public.users') as table_exists;");
    if (res.rows[0].table_exists) {
        console.log('✅ Users table exists.');
    } else {
        console.log('⚠️ Connected, but tables NOT found. Did you run schema.sql?');
    }

  } catch (err) {
    console.error('❌ Connection FAILED:');
    if (err.code === '28P01') {
        console.error('   -> Invalid Password! Please check your .env file.');
        console.error('   -> Hint: Default password is often "admin", "root", or "postgres".');
    } else if (err.code === '3D000') {
        console.error('   -> Database does not exist! Please create it using pgAdmin or "createdb".');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('   -> Could not connect to localhost:5432. Is PostgreSQL running?');
    } else {
        console.error('   -> Error:', err.message);
    }
  } finally {
    await client.end();
  }
}

testConnection();
