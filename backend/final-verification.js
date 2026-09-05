const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('\n' + '='.repeat(70));
  console.log('  PAIN CLINIC SETUP - FINAL VERIFICATION');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Check admin users
    console.log('1️⃣  ADMIN USERS');
    console.log('─'.repeat(70));
    const admins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true
      }
    });
    
    console.log(`Found ${admins.length} admin user(s):`);
    admins.forEach(admin => {
      console.log(`   ✅ ${admin.name} (${admin.role}) - ${admin.email}`);
    });

    // 2. Check clinic owner
    console.log('\n2️⃣  CLINIC OWNER USER');
    console.log('─'.repeat(70));
    const clinicOwner = await prisma.user.findFirst({
      where: {
        mobile: '+919876543210'
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        ownedClinics: {
          select: {
            id: true,
            name: true,
            approvalStatus: true,
            isVerified: true,
            isActive: true
          }
        }
      }
    });

    if (!clinicOwner) {
      console.log('   ❌ Clinic owner not found!');
      return;
    }

    console.log(`   ✅ Name: ${clinicOwner.name}`);
    console.log(`   ✅ Email: ${clinicOwner.email}`);
    console.log(`   ✅ Mobile: ${clinicOwner.mobile}`);
    console.log(`   ✅ Role: ${clinicOwner.role}`);
    console.log(`   ✅ Account Active: ${clinicOwner.isActive}`);
    console.log(`   ✅ Email Verified: ${clinicOwner.isEmailVerified}`);
    console.log(`   ✅ Phone Verified: ${clinicOwner.isPhoneVerified}`);
    console.log(`   ✅ Owned Clinics: ${clinicOwner.ownedClinics.length}`);

    // 3. Check clinic details
    console.log('\n3️⃣  PAIN CLINIC DETAILS');
    console.log('─'.repeat(70));
    
    if (clinicOwner.ownedClinics.length === 0) {
      console.log('   ❌ No clinics found for this owner!');
      return;
    }

    const clinic = await prisma.clinic.findUnique({
      where: {
        id: clinicOwner.ownedClinics[0].id
      },
      include: {
        workingHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    console.log(`   ✅ Name: ${clinic.name}`);
    console.log(`   ✅ ID: ${clinic.id}`);
    console.log(`   ✅ Address: ${clinic.address}`);
    console.log(`   ✅ City: ${clinic.city}, ${clinic.state} - ${clinic.pincode}`);
    console.log(`   ✅ Phone: ${clinic.phone}`);
    console.log(`   ✅ Is Verified: ${clinic.isVerified}`);
    console.log(`   ✅ Is Active: ${clinic.isActive}`);
    console.log(`   ✅ Approval Status: ${clinic.approvalStatus}`);
    console.log(`   ✅ Owner Mobile Verified: ${clinic.ownerMobileVerified}`);
    console.log(`   ✅ Specialties: ${clinic.specialties.join(', ')}`);
    console.log(`   ✅ Working Days: ${clinic.workingHours.length}`);

    // 4. Check working hours
    console.log('\n4️⃣  WORKING HOURS');
    console.log('─'.repeat(70));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (clinic.workingHours.length > 0) {
      clinic.workingHours.forEach(h => {
        console.log(`   ${dayNames[h.dayOfWeek]}: ${h.morningStartTime}-${h.morningEndTime}, ${h.eveningStartTime}-${h.eveningEndTime}`);
      });
    } else {
      console.log('   ⚠️  No working hours configured');
    }

    // 5. Check TEST_OTP_NUMBERS in env
    console.log('\n5️⃣  OTP CONFIGURATION');
    console.log('─'.repeat(70));
    const testOtpNumbers = process.env.TEST_OTP_NUMBERS || '';
    console.log(`   TEST_OTP_NUMBERS: ${testOtpNumbers}`);
    if (testOtpNumbers.includes('9876543210')) {
      console.log('   ✅ 9876543210 is in TEST_OTP_NUMBERS (will accept OTP: 123456)');
    } else {
      console.log('   ⚠️  9876543210 NOT in TEST_OTP_NUMBERS - add it to .env!');
    }

    console.log(`   SMS_PROVIDER: ${process.env.SMS_PROVIDER || 'not set'}`);
    console.log(`   OTP_PROVIDER: ${process.env.OTP_PROVIDER || 'not set'}`);
    console.log(`   ENABLE_TEST_OTP: ${process.env.ENABLE_TEST_OTP || 'not set'}`);

    // 6. Summary
    console.log('\n' + '='.repeat(70));
    console.log('  VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    const checks = [
      { name: 'Admin users exist', pass: admins.length >= 2 },
      { name: 'Clinic owner user created', pass: !!clinicOwner },
      { name: 'Clinic owner role is CLINIC_OWNER', pass: clinicOwner?.role === 'CLINIC_OWNER' },
      { name: 'Clinic created', pass: clinicOwner?.ownedClinics.length > 0 },
      { name: 'Clinic is VERIFIED', pass: clinic?.approvalStatus === 'VERIFIED' },
      { name: 'Clinic is active', pass: clinic?.isActive === true },
      { name: 'Owner mobile verified', pass: clinic?.ownerMobileVerified === true },
      { name: 'Working hours configured', pass: clinic?.workingHours.length >= 6 },
      { name: 'Test OTP number configured', pass: testOtpNumbers.includes('9876543210') },
    ];

    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);
    
    if (allPassed) {
      console.log('\n' + '='.repeat(70));
      console.log('  🎉 ALL CHECKS PASSED! SETUP COMPLETE! 🎉');
      console.log('='.repeat(70));
      console.log('\n📱 Clinic Owner Login:');
      console.log('   Mobile: +919876543210 or 9876543210');
      console.log('   Test OTP: 123456');
      console.log('\n💻 Admin Panel:');
      console.log('   Go to: http://localhost:3000/admin');
      console.log('   Hard refresh (Ctrl+Shift+R) if clinic not showing');
      console.log('\n✅ The clinic is ready to use!\n');
    } else {
      console.log('\n⚠️  Some checks failed. Please review the issues above.\n');
    }

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();
