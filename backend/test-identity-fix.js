/**
 * Test Script: Identity Fix Verification
 * 
 * Tests the exact case:
 * Email: shubhmkothrkr@gmail.com
 * Mobile: 8105846719
 * 
 * Expected: ONE user with both email and mobile
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_EMAIL = 'shubhmkothrkr@gmail.com';
const TEST_MOBILE = '8105846719';

async function testIdentityFix() {
  console.log('='.repeat(80));
  console.log('IDENTITY FIX VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log('\nTest Case:');
  console.log('  Email:', TEST_EMAIL);
  console.log('  Mobile:', TEST_MOBILE);
  console.log('  Expected: ONE user with both email and mobile\n');

  try {
    // Find users with test email
    const usersByEmail = await prisma.user.findMany({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: true,
        createdAt: true,
        clinicOwnerProfile: true,
        ownedClinics: true,
      },
    });

    // Find users with test mobile
    const usersByMobile = await prisma.user.findMany({
      where: {
        OR: [
          { mobile: TEST_MOBILE },
          { mobile: '+91' + TEST_MOBILE },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        approvalStatus: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: true,
        createdAt: true,
        clinicOwnerProfile: true,
        ownedClinics: true,
      },
    });

    console.log('─'.repeat(80));
    console.log('SEARCH RESULTS');
    console.log('─'.repeat(80));
    console.log(`\nUsers with email "${TEST_EMAIL}": ${usersByEmail.length}`);
    console.log(`Users with mobile "${TEST_MOBILE}": ${usersByMobile.length}\n`);

    if (usersByEmail.length === 0 && usersByMobile.length === 0) {
      console.log('✅ PASS: No users found (clean state)');
      console.log('         Ready for registration test\n');
      return;
    }

    // Check if it's the same user
    const allUserIds = [
      ...usersByEmail.map(u => u.id),
      ...usersByMobile.map(u => u.id),
    ];
    const uniqueUserIds = [...new Set(allUserIds)];

    console.log('─'.repeat(80));
    console.log('TEST RESULT');
    console.log('─'.repeat(80));

    if (uniqueUserIds.length === 1) {
      console.log('✅ PASS: Exactly ONE user found with both email and mobile\n');
      
      const user = usersByEmail.length > 0 ? usersByEmail[0] : usersByMobile[0];
      
      console.log('User Details:');
      console.log('  User ID:', user.id);
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Mobile:', user.mobile);
      console.log('  Role:', user.role);
      console.log('  Approval Status:', user.approvalStatus);
      console.log('  Email Verified:', user.isEmailVerified ? '✅' : '❌');
      console.log('  Phone Verified:', user.isPhoneVerified ? '✅' : '❌');
      console.log('  Auth Provider:', user.authProvider);
      console.log('  Has Clinic Owner Profile:', user.clinicOwnerProfile ? '✅' : '❌');
      console.log('  Owns Clinics:', user.ownedClinics.length);
      console.log('  Created At:', user.createdAt);
      console.log('');

      // Verify both identities are correct
      const hasCorrectEmail = user.email === TEST_EMAIL;
      const hasCorrectMobile = user.mobile === TEST_MOBILE || user.mobile === '+91' + TEST_MOBILE;

      if (hasCorrectEmail && hasCorrectMobile) {
        console.log('✅ IDENTITY VERIFIED: User has correct email AND mobile');
      } else {
        console.log('❌ IDENTITY MISMATCH:');
        if (!hasCorrectEmail) console.log('   - Wrong email:', user.email);
        if (!hasCorrectMobile) console.log('   - Wrong mobile:', user.mobile);
      }
    } else {
      console.log('❌ FAIL: Multiple users found (duplicates exist)\n');
      console.log(`Total unique users: ${uniqueUserIds.length}\n`);

      console.log('Duplicate User Records:');
      for (const userId of uniqueUserIds) {
        const user = [...usersByEmail, ...usersByMobile].find(u => u.id === userId);
        console.log('\n' + '─'.repeat(80));
        console.log('User ID:', user.id);
        console.log('  Email:', user.email || 'NULL');
        console.log('  Mobile:', user.mobile || 'NULL');
        console.log('  Role:', user.role);
        console.log('  Status:', user.approvalStatus);
        console.log('  Has Profile:', user.clinicOwnerProfile ? 'YES' : 'NO');
        console.log('  Owns Clinics:', user.ownedClinics.length);
        console.log('  Created:', user.createdAt);
      }

      console.log('\n❌ DUPLICATES DETECTED - Identity fix may not be applied yet');
    }

    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATION');
    console.log('='.repeat(80));

    if (uniqueUserIds.length > 1) {
      console.log('\nAction Required:');
      console.log('  1. Review the duplicate records above');
      console.log('  2. Identify the canonical user (most complete record)');
      console.log('  3. Run cleanup script to merge/delete duplicates');
      console.log('  4. Re-run this test to verify fix\n');
    } else if (uniqueUserIds.length === 1) {
      const user = usersByEmail.length > 0 ? usersByEmail[0] : usersByMobile[0];
      const hasCorrectEmail = user.email === TEST_EMAIL;
      const hasCorrectMobile = user.mobile === TEST_MOBILE || user.mobile === '+91' + TEST_MOBILE;

      if (hasCorrectEmail && hasCorrectMobile) {
        console.log('\n✅ Identity fix verified successfully!');
        console.log('   The registration flow is working correctly.\n');
      } else {
        console.log('\n⚠️  User exists but has wrong email or mobile');
        console.log('   This may be old test data. Consider cleanup.\n');
      }
    } else {
      console.log('\n✅ Clean state - Ready for registration testing\n');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testIdentityFix();
