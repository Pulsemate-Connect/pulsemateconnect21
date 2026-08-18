#!/usr/bin/env node

/**
 * Database Connection Diagnostic Script
 * Tests database connectivity and provides troubleshooting info
 */

const { PrismaClient } = require('@prisma/client');

console.log('\n═══════════════════════════════════════════════════════');
console.log('DATABASE CONNECTION DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════\n');

async function checkDatabase() {
  console.log('Step 1: Environment Configuration');
  console.log('───────────────────────────────────────────────────────');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NOT SET');
  console.log('');

  console.log('Step 2: Testing Database Connection');
  console.log('───────────────────────────────────────────────────────');

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('Attempting to connect...');
    await prisma.$connect();
    console.log('✓ Connection successful!\n');

    console.log('Step 3: Testing Database Query');
    console.log('───────────────────────────────────────────────────────');
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✓ Query successful!');
    console.log('Database time:', result[0].current_time);
    console.log('');

    console.log('Step 4: Checking Tables');
    console.log('───────────────────────────────────────────────────────');
    
    // Check if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log('✓ User table exists');
      console.log('  Users in database:', userCount);
    } catch (error) {
      console.log('✗ User table not found or inaccessible');
      console.log('  Error:', error.message);
    }

    // Check for admin
    try {
      const adminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN' }
      });
      console.log('✓ Admin check complete');
      console.log('  Admin users:', adminCount);
      
      if (adminCount === 0) {
        console.log('\n⚠️  WARNING: No admin users found!');
        console.log('  Run: node scripts/seedAdmin.js');
      }
    } catch (error) {
      console.log('✗ Could not check admin users');
    }

    console.log('');
    console.log('Step 5: Database Summary');
    console.log('───────────────────────────────────────────────────────');
    
    try {
      const tables = {
        users: await prisma.user.count(),
        clinics: await prisma.clinic.count(),
        doctors: await prisma.doctor.count(),
        clinicDoctors: await prisma.clinicDoctor.count(),
      };

      console.log('Table Counts:');
      console.log('  Users:          ', tables.users);
      console.log('  Clinics:        ', tables.clinics);
      console.log('  Doctors:        ', tables.doctors);
      console.log('  Relationships:  ', tables.clinicDoctors);
    } catch (error) {
      console.log('✗ Could not fetch table counts');
      console.log('  This might mean migrations need to be run');
      console.log('  Run: npx prisma migrate deploy');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✓ DATABASE STATUS: HEALTHY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nYou can now run tests:');
    console.log('  npm run test:generate-data');
    console.log('  npm run test:qa');
    console.log('');

  } catch (error) {
    console.log('✗ Connection failed!\n');
    console.log('Error Details:');
    console.log('───────────────────────────────────────────────────────');
    console.log('Type:', error.constructor.name);
    console.log('Code:', error.code || 'N/A');
    console.log('Message:', error.message);
    console.log('');

    console.log('Common Issues and Solutions:');
    console.log('───────────────────────────────────────────────────────');
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n1. DATABASE SERVER UNREACHABLE');
      console.log('   Possible causes:');
      console.log('   • Database server is down');
      console.log('   • Incorrect host/port in DATABASE_URL');
      console.log('   • Firewall blocking connection');
      console.log('   • VPN/network issue');
      console.log('');
      console.log('   Solutions:');
      console.log('   • For Supabase: Check project status in dashboard');
      console.log('   • For local: Ensure PostgreSQL is running');
      console.log('   • Windows: net start postgresql-x64-14');
      console.log('   • Check DATABASE_URL in .env file');
    }

    if (error.message.includes('password authentication failed')) {
      console.log('\n2. AUTHENTICATION FAILED');
      console.log('   • Check username and password in DATABASE_URL');
      console.log('   • Verify credentials in Supabase dashboard');
      console.log('   • For local: Check PostgreSQL user password');
    }

    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n3. DATABASE DOES NOT EXIST');
      console.log('   • For local: createdb pulsemate_test');
      console.log('   • For Supabase: Create database in dashboard');
    }

    if (!process.env.DATABASE_URL) {
      console.log('\n4. DATABASE_URL NOT SET');
      console.log('   • Check .env file exists in backend/ directory');
      console.log('   • Ensure DATABASE_URL is not commented out');
      console.log('   • Copy from .env.example if needed');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✗ DATABASE STATUS: UNHEALTHY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nFix the database connection before running tests.');
    console.log('See: QA_EXECUTION_GUIDE.md for detailed instructions');
    console.log('');

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostic
checkDatabase().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
