/**
 * Script to create a sample PDF file for testing OSBB registration
 * This creates a simple PDF that can be used as a "Protocol of Appointment"
 */

const fs = require('fs');
const path = require('path');

// Simple PDF content (minimal valid PDF structure)
// This is a basic PDF that will work for testing
const pdfContent = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj\n' +
  '<<\n' +
  '/Type /Catalog\n' +
  '/Pages 2 0 R\n' +
  '>>\n' +
  'endobj\n' +
  '2 0 obj\n' +
  '<<\n' +
  '/Type /Pages\n' +
  '/Kids [3 0 R]\n' +
  '/Count 1\n' +
  '>>\n' +
  'endobj\n' +
  '3 0 obj\n' +
  '<<\n' +
  '/Type /Page\n' +
  '/Parent 2 0 R\n' +
  '/MediaBox [0 0 612 792]\n' +
  '/Contents 4 0 R\n' +
  '/Resources <<\n' +
  '/Font <<\n' +
  '/F1 <<\n' +
  '/Type /Font\n' +
  '/Subtype /Type1\n' +
  '/BaseFont /Helvetica\n' +
  '>>\n' +
  '>>\n' +
  '>>\n' +
  '>>\n' +
  'endobj\n' +
  '4 0 obj\n' +
  '<<\n' +
  '/Length 200\n' +
  '>>\n' +
  'stream\n' +
  'BT\n' +
  '/F1 12 Tf\n' +
  '100 700 Td\n' +
  '(PROTOCOL OF APPOINTMENT) Tj\n' +
  '0 -20 Td\n' +
  '(Head of OSBB) Tj\n' +
  '0 -20 Td\n' +
  '(This is a test document for OSBB registration) Tj\n' +
  '0 -20 Td\n' +
  '(Date: ' + new Date().toLocaleDateString() + ') Tj\n' +
  'ET\n' +
  'endstream\n' +
  'endobj\n' +
  'xref\n' +
  '0 5\n' +
  '0000000000 65535 f \n' +
  '0000000009 00000 n \n' +
  '0000000058 00000 n \n' +
  '0000000115 00000 n \n' +
  '0000000306 00000 n \n' +
  'trailer\n' +
  '<<\n' +
  '/Size 5\n' +
  '/Root 1 0 R\n' +
  '>>\n' +
  'startxref\n' +
  '506\n' +
  '%%EOF'
);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/protocols');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create sample PDF file
const pdfPath = path.join(__dirname, '../uploads/protocols/sample-protocol.pdf');
fs.writeFileSync(pdfPath, pdfContent);

console.log('✅ Sample PDF created successfully!');
console.log(`📄 Location: ${pdfPath}`);
console.log('\n📋 You can use this file to test OSBB registration.');
console.log('   The file will be uploaded as a "Protocol of Appointment" document.');

