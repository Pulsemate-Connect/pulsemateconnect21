/**
 * Cleanup Test Data Script
 * 
 * Removes all test doctor data from the database
 * Run before executing test suite
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_MOBILES = [
  '9999999001', '9999999002', '9999999003', '9999999004', '9999999005',
  '9999999006', '9999999007', '9999999008', '9999999009', '9999999010',
  '9999999011', '9999999012', '9999999013', '9999999014', '9999999015',
  '9999999016', '9999999017', '9999999018', '9999999019', '9999999020',
  '9999999099'
];

const TEST_EMAILS = TEST_MOBILES.map((_, i) => 
  i < 20 ? `test.doctor${String(i + 1).padStart(2, '0')}@gmail.com` : 'test.doctor.final@gmail.com'
);

async function cleanup() {
  console.log('🧹 Starting test data cleanup...\n');

  try {
    // 1. Delete doctor invitations
    console.log('Deleting doctor invitations...');
    const deletedInvitations = await prisma.doctorInvitation.deleteMany({
      where: {
        OR: [
          { doctorMobile: { in: TEST_MOBILES.map(m => `+91${m}`) } },
          { doctorEmail: { in: TEST_EMAILS } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedInvitations.count} invitations\n`);

    // 2. Delete clinic-doctor relationships
    console.log('Deleting clinic-doctor relationships...');
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        user: {
          OR: [
            { mobile: { in: TEST_MOBILES.map(m => `+91${m}`) } },
            { email: { in: TEST_EMAILS } }
          ]
        }
      },
      select: { id: true }
    });

    if (doctors.length > 0) {
      const doctorIds = doctors.map(d => d.id);
      const deletedRelations = await prisma.doctorClinic.deleteMany({
        where: { doctorId: { in: doctorIds } }
      });
      console.log(`✓ Deleted ${deletedRelations.count} clinic-doctor relationships\n`);
    } else {
      console.log('✓ No clinic-doctor relationships to delete\n');
    }

    // 3. Delete doctor profiles
    console.log('Deleting doctor profiles...');
    const deletedProfiles = await prisma.doctorProfile.deleteMany({
      where: {
        user: {
          OR: [
            { mobile: { in: TEST_MOBILES.map(m => `+91${m}`) } },
            { email: { in: TEST_EMAILS } }
          ]
        }
      }
    });
    console.log(`✓ Deleted ${deletedProfiles.count} doctor profiles\n`);

    // 4. Delete user accounts
    console.log('Deleting user accounts...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { mobile: { in: TEST_MOBILES.map(m => `+91${m}`) } },
          { email: { in: TEST_EMAILS } }
        ]
      }
    });
    console.log(`✓ Deleted ${deletedUsers.count} user accounts\n`);

    console.log('✅ Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`  - ${deletedInvitations.count} invitations removed`);
    console.log(`  - ${deletedProfiles.count} doctor profiles removed`);
    console.log(`  - ${deletedUsers.count} user accounts removed`);
    console.log('\nReady to run test suite!\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
