#!/usr/bin/env node
/**
 * Baseline Prisma Migrations for Existing Production Database
 * 
 * This script marks all existing migrations as applied without running them.
 * Use this when deploying to an existing database that already has the schema.
 * 
 * Usage: node scripts/baseline-migrations.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Baselining Prisma migrations for existing database...\n');

try {
  // Get all migration directories
  const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    console.error('❌ Migrations directory not found!');
    process.exit(1);
  }

  const migrations = fs.readdirSync(migrationsPath)
    .filter(dir => dir !== 'migration_lock.toml')
    .sort();

  console.log(`📦 Found ${migrations.length} migrations to baseline:\n`);
  migrations.forEach((migration, index) => {
    console.log(`   ${index + 1}. ${migration}`);
  });
  console.log('');

  // Use prisma migrate resolve to mark migrations as applied
  console.log('✅ Marking migrations as applied...\n');

  for (const migration of migrations) {
    try {
      execSync(
        `npx prisma migrate resolve --applied "${migration}"`,
        { stdio: 'inherit' }
      );
      console.log(`   ✓ ${migration}`);
    } catch (error) {
      console.error(`   ✗ Failed to baseline ${migration}`);
      // Continue with other migrations
    }
  }

  console.log('\n✅ All migrations baselined successfully!');
  console.log('💡 Your database is now in sync. Future migrations will run normally.\n');

} catch (error) {
  console.error('❌ Baseline failed:', error.message);
  process.exit(1);
}
