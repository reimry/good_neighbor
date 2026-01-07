const fs = require('fs');
const path = require('path');
const db = require('./connection');

const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function initDb() {
  console.log('⏳ Running schema execution...');
  try {
    await db.query(schemaSql);
    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing schema:', err);
    process.exit(1);
  }
}

initDb();
