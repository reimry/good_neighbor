const { Client } = require('pg');
require('dotenv').config();

const passwordsToTry = [
  process.env.DB_PASSWORD, // Try what's in env first
  'postgres',
  'admin',
  'root',
  'password',
  '1234',
  '123456',
  'admin123'
];

async function checkPassword(password) {
  const connectionString = `postgres://${process.env.DB_USER}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log(`✅ SUCCESS! The correct password is: "${password}"`);
    await client.end();
    return true;
  } catch (e) {
    if (e.code === '28P01') { // Invalid password
         // process.stdout.write('.'); // progress dot
    } else {
        console.log(`\n⚠️ Other Error with password "${password}": ${e.message}`);
    }
    await client.end();
    return false;
  }
}

async function run() {
  console.log('Testing common passwords...');
  for (const pass of passwordsToTry) {
    if (!pass) continue;
    if (await checkPassword(pass)) {
      process.exit(0);
    }
  }
  console.log('\n❌ None of the common passwords worked.');
  process.exit(1);
}

run();
