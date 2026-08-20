/**
 * Generate 100 Test Patient Users
 * 
 * Creates 100 independent test patients with:
 * - Unique mobile numbers
 * - Unique emails
 * - Unique patient IDs
 * - Role: PATIENT
 * - Test OTP: 123456 (for testing)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test mobile number range: +919900000001 to +919900000100
const generateTestMobile = (index) => {
  const number = 9900000000 + index;
  return `+91${number}`;
};

// Test email pattern: test-patient-001@pulsemate.test to test-patient-100@pulsemate.test
const generateTestEmail = (index) => {
  const paddedIndex = String(index).padStart(3, '0');
  return `test-patient-${paddedIndex}@pulsemate.test`;
};

// Test name pattern: Test Patient 001 to Test Patient 100
const generateTestName = (index) => {
  const paddedIndex = String(index).padStart(3, '0');
  return `Test Patient ${paddedIndex}`;
};

async function generateTestPatients() {
  const startTime = Date.now();
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PulseMate Connect - Test Patient User Generation         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const COUNT = 100;
  const created = [];
  const skipped = [];
  const errors = [];

  for (let i = 1; i <= COUNT; i++) {
    const mobile = generateTestMobile(i);
    const email = generateTestEmail(i);
    const name = generateTestName(i);

    try {
      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile },
            { email },
          ],
        },
      });

      if (existing) {
        skipped.push({ index: i, mobile, email, reason: 'Already exists' });
        process.stdout.write(`\r⏭️  Skipping ${i}/${COUNT} (exists)...`);
        continue;
      }

      // Create test patient user
      const user = await prisma.user.create({
        data: {
          name,
          mobile,
          email,
          role: 'PATIENT',
          isPhoneVerified: true, // Pre-verified for testing
          isEmailVerified: false,
          approvalStatus: 'VERIFIED',
          isActive: true,
          // No password - uses OTP login only
        },
      });

      // Create empty patient profile
      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          registeredVia: 'SELF',
        },
      });

      created.push({
        index: i,
        userId: user.id,
        name,
        mobile,
        email,
      });

      process.stdout.write(`\r✅ Created ${i}/${COUNT} patients...`);

    } catch (error) {
      errors.push({
        index: i,
        mobile,
        email,
        error: error.message,
      });
      process.stdout.write(`\r❌ Error ${i}/${COUNT}...`);
    }
  }

  console.log('\n');
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Summary Report
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Patient Generation Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Created: ${created.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`📊 Total: ${COUNT}\n`);

  if (created.length > 0) {
    console.log('📋 Sample Created Users:');
    created.slice(0, 5).forEach(u => {
      console.log(`   ${u.index}. ${u.name}`);
      console.log(`      Mobile: ${u.mobile}`);
      console.log(`      Email: ${u.email}`);
      console.log(`      ID: ${u.userId}\n`);
    });
    if (created.length > 5) {
      console.log(`   ... and ${created.length - 5} more\n`);
    }
  }

  if (skipped.length > 0) {
    console.log(`⚠️  ${skipped.length} users already exist (skipped)`);
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(e => {
      console.log(`   ${e.index}. ${e.mobile}: ${e.error}`);
    });
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Test Credentials                                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('📱 Login with any test patient:');
  console.log('   Mobile: +919900000001 to +919900000100');
  console.log('   OTP: 123456 (test OTP)');
  console.log('');
  console.log('📧 Emails:');
  console.log('   test-patient-001@pulsemate.test to test-patient-100@pulsemate.test');
  console.log('');

  return { created, skipped, errors };
}

// Run if executed directly
if (require.main === module) {
  generateTestPatients()
    .then(() => {
      console.log('✅ Test patient generation completed!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error.message);
      console.error(error.stack);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { generateTestPatients };
