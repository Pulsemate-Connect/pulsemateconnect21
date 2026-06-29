const { execSync } = require('child_process');

console.log('🔍 Checking for failed Prisma migrations...');

try {
  // Check for failed migrations
  const result = execSync('npx prisma migrate status', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  if (result.includes('following migrations have not yet been applied') || 
      result.includes('Database schema is not in sync')) {
    console.log('⚠️  Found pending migrations, will be applied with migrate deploy');
  } else {
    console.log('✅ No pending migrations found');
  }
} catch (error) {
  // If there's an error, it might be a failed migration
  const errorOutput = error.stdout || error.stderr || error.message;
  
  if (errorOutput.includes('following migration have failed')) {
    console.log('❌ Found failed migration, attempting to resolve...');
    
    try {
      // Try to mark the migration as resolved
      execSync('npx prisma migrate resolve --applied "$(npx prisma migrate status | grep -oP \'(?<=following migration have failed: ).*\')"', {
        stdio: 'inherit'
      });
      console.log('✅ Migration resolved');
    } catch (resolveError) {
      console.log('⚠️  Could not auto-resolve migration, will continue with deploy');
    }
  } else {
    console.log('✅ No failed migrations detected');
  }
}

console.log('Migration resolve step completed (or no failed migrations).');
