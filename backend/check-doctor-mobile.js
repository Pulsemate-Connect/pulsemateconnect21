/**
 * Check doctor mobile number and account status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoctorMobile() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Checking Doctor Mobile Numbers                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check all doctors
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        approvalStatus: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        passwordHash: true,
        doctorProfile: {
          select: {
            verificationStatus: true,
            specialization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${doctors.length} doctor(s):\n`);

    doctors.forEach((doc, idx) => {
      console.log(`Doctor ${idx + 1}:`);
      console.log('  Name:', doc.name);
      console.log('  Mobile:', doc.mobile);
      console.log('  Email:', doc.email || 'N/A');
      console.log('  Approval Status:', doc.approvalStatus);
      console.log('  Phone Verified:', doc.isPhoneVerified ? 'YES ✅' : 'NO ❌');
      console.log('  Email Verified:', doc.isEmailVerified ? 'YES ✅' : 'NO ❌');
      console.log('  Has Password:', doc.passwordHash ? 'YES ✅' : 'NO ❌');
      console.log('  Profile Status:', doc.doctorProfile?.verificationStatus || 'N/A');
      console.log('  Specialization:', doc.doctorProfile?.specialization || 'N/A');
      console.log();
    });

    // Test different mobile formats
    console.log('Testing Mobile Number Formats:\n');
    
    const testFormats = [
      '9999999999',
      '+919999999999',
      '919999999999',
      '9999999099',
      '+919999999099',
      '919999999099',
    ];

    for (const mobile of testFormats) {
      const found = await prisma.user.findFirst({
        where: {
          mobile: mobile,
          role: 'DOCTOR',
        },
      });
      
      console.log(`  ${mobile.padEnd(15)} → ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoctorMobile();
