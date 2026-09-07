#!/usr/bin/env node
/**
 * Update Admin Passwords
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  // Shubham's new password
  const shubhamHash = await bcrypt.hash('Shubham2708*', 12);
  console.log('Shubham (shubham27052002@gmail.com):');
  console.log('Password: Shubham2708*');
  console.log('Hash:', shubhamHash);
  console.log('');
  
  // Sahil's new password
  const sahilHash = await bcrypt.hash('Sahilnaik18$', 12);
  console.log('Sahil (sahilnaik1515@gmail.com):');
  console.log('Password: Sahilnaik18$');
  console.log('Hash:', sahilHash);
  console.log('');
  
  console.log('Copy this SQL to Supabase SQL Editor:\n');
  console.log('----------------------------------------');
  console.log(`UPDATE users SET "passwordHash" = '${shubhamHash}' WHERE email = 'shubham27052002@gmail.com';`);
  console.log(`UPDATE users SET "passwordHash" = '${sahilHash}' WHERE email = 'sahilnaik1515@gmail.com';`);
  console.log('----------------------------------------');
}

generateHashes();
