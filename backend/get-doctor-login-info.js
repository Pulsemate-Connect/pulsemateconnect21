/**
 * Get doctor login information and optionally reset password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function getDoctorLoginInfo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Doctor Login Information & Password Reset        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find the approved doctor
    const doctor = await prisma.user.findFirst({
      where: {
        mobile: '+919999999099',
        role: 'DOCTOR',
      },
      include: {
        doctorProfile: {
          select: {
            fullLegalName: true,
            specialization: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!doctor) {
      console.log('❌ Doctor not found with mobile: +919999999099\n');
      return;
    }

    console.log('✅ Doctor Found:\n');
    console.log('   Name:', doctor.name);
    console.log('   Full Name:', doctor.doctorProfile?.fullLegalName || 'N/A');
    console.log('   Mobile:', doctor.mobile);
    console.log('   Email:', doctor.email || 'N/A');
    console.log('   Role:', doctor.role);
    console.log('   Approval Status:', doctor.approvalStatus);
    console.log('   Verification Status:', doctor.doctorProfile?.verificationStatus);
    console.log('   Specialization:', doctor.doctorProfile?.specialization || 'N/A');
    console.log('   Has Password:', doctor.passwordHash ? 'YES ✅' : 'NO ❌');
    console.log();

    // Check if password exists
    if (!doctor.passwordHash) {
      console.log('⚠️  Doctor has NO password set!\n');
      console.log('Setting default password: "Doctor@123"\n');

      const hashedPassword = await bcrypt.hash('Doctor@123', 10);
      
      await prisma.user.update({
        where: { id: doctor.id },
        data: { passwordHash: hashedPassword },
      });

      console.log('✅ Password has been set!\n');
    } else {
      console.log('ℹ️  Doctor already has a password set.\n');
      console.log('To reset password, set a new one:\n');
      
      const newPassword = 'Doctor@123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { id: doctor.id },
        data: { passwordHash: hashedPassword },
      });

      console.log(`✅ Password has been reset to: "${newPassword}"\n`);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    LOGIN CREDENTIALS                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('   Login URL: http://localhost:3000/doctor/login');
    console.log('              (or your frontend URL)');
    console.log();
    console.log('   Mobile: 9999999099');
    console.log('           (or +919999999099)');
    console.log();
    console.log('   Password: Doctor@123');
    console.log();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    DASHBOARD ACCESS                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('After login, you should be redirected to:');
    console.log('   - Doctor Dashboard: /doctor/dashboard');
    console.log('   - Appointments: /doctor/appointments');
    console.log('   - Profile: /doctor/profile');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

getDoctorLoginInfo();
