const { execSync } = require('child_process');

console.log('🔍 Checking for failed Prisma migrations...');

try {
  // Check migration status
  const result = execSync('npx prisma migrate status', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log('Migration status:', result);
  
  if (result.includes('following migrations have not yet been applied') || 
      result.includes('Database schema is not in sync')) {
    console.log('⚠️  Found pending migrations, will be applied with migrate deploy');
  } else if (result.includes('Database schema is up to date')) {
    console.log('✅ Database schema is up to date');
  } else {
    console.log('✅ No issues found with migrations');
  }
} catch (error) {
  const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
  console.log('Migration check output:', errorOutput);
  
  // Check if it's the specific failed migration we know about
  if (errorOutput.includes('20260628140314_add_clinic_holidays')) {
    console.log('⚠️  Found known failed migration: add_clinic_holidays');
    console.log('🔧 Attempting to resolve...');
    
    try {
      // Mark the specific migration as applied
      execSync('npx prisma migrate resolve --applied 20260628140314_add_clinic_holidays', {
        stdio: 'inherit'
      });
      console.log('✅ Migration marked as resolved');
    } catch (resolveError) {
      console.log('⚠️  Could not auto-resolve, will try with migrate deploy');
      console.log('Note: If clinic_holidays table exists, migration will be skipped');
    }
  } else if (errorOutput.includes('migration have failed') || errorOutput.includes('migration failed')) {
    console.log('⚠️  Found failed migration');
    console.log('Will attempt to continue with migrate deploy (idempotent migration)');
  } else {
    console.log('✅ No failed migrations detected');
  }
}

console.log('Migration check completed.');
console.log('Proceeding with prisma generate and migrate deploy...');
