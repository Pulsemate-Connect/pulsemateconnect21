// Load dotenv and check what it parses
const fs = require('fs');
const path = require('path');

// Read file directly
const envFilePath = path.join(__dirname, '.env');
const fileContent = fs.readFileSync(envFilePath, 'utf8');

// Find the PASSWORD line
const lines = fileContent.split('\n');
const passwordLine = lines.find(line => line.startsWith('MESSAGE_CENTRAL_PASSWORD='));

console.log('?? Direct file read:');
if (passwordLine) {
  const rawPassword = passwordLine.substring('MESSAGE_CENTRAL_PASSWORD='.length);
  console.log('Length:', rawPassword.length);
  console.log('First 50 chars:', rawPassword.substring(0, 50));
  console.log('Last 20 chars:', rawPassword.substring(rawPassword.length - 20));
} else {
  console.log('PASSWORD line not found');
}

console.log('\n?? Using dotenv:');
require('dotenv').config({ path: '.env' });
const envPassword = process.env.MESSAGE_CENTRAL_PASSWORD;
console.log('Length:', envPassword ? envPassword.length : 0);
console.log('First 50 chars:', envPassword ? envPassword.substring(0, 50) : 'NOT SET');
console.log('Last 20 chars:', envPassword ? envPassword.substring(envPassword.length - 20) : 'NOT SET');

const expectedPassword = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLUI2NDQyMTA5Q0JEMzQzOCIsImlhdCI6MTc4NTI1NjkxNywiZXhwIjoxOTQyOTM2OTE3fQ.SecuHOe9iP1AUpSqsNQu0YocZheNbLgCNM2dPe2NqPn2lOIbYIR8tYuKUlroW7_reGLfXlgTYLloxBbx7WxnAQ';
console.log('\n? Expected length:', expectedPassword.length);
console.log('Match:', envPassword === expectedPassword ? 'YES' : 'NO');
