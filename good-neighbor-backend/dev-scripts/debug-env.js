const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('--- Env Debug ---');
console.log('Current Directory:', process.cwd());
console.log('.env file exists?', fs.existsSync(path.join(process.cwd(), '.env')));

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL Value (masked):', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
}

console.log('All Keys in .env:', Object.keys(require('dotenv').config().parsed || {}));
