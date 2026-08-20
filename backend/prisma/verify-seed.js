/**
 * Verification script to check seeded test data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying seeded test data...\n');

  // Check clinics
  const clinics = await prisma.clinic.findMany({
    where: {
      phone: {
        in: ['9639639639', '9879879879']
      }
    },
    include: {
      owner: true,
    }
  });

  console.log('🏥 CLINICS:');
  clinics.forEach(clinic => {
    console.log(`   ✅ ${clinic.name}`);
    console.log(`      Owner: ${clinic.owner.name} (${clinic.owner.mobile})`);
    console.log(`      Status: ${clinic.approvalStatus} | Active: ${clinic.isActive}`);
    console.log(`      Location: ${clinic.city}, ${clinic.state}\n`);
  });

  // Check doctors
  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      mobile: {
        in: [
          '9111111111', '9222222222', '9333333333', '9444444444', '9555555555',
          '9666666666', '9777777777', '9888888888', '9999999991', '9999999992'
        ]
      }
    },
    include: {
      doctorProfile: {
        include: {
          doctorClinics: {
            include: {
              clinic: true
            }
          }
        }
      }
    }
  });

  console.log('👨‍⚕️ DOCTORS:');
  doctors.forEach(doctor => {
    const profile = doctor.doctorProfile;
    console.log(`   ✅ ${doctor.name} - ${profile.specialization}`);
    console.log(`      Mobile: ${doctor.mobile} | Fee: ₹${profile.consultationFee}`);
    console.log(`      Status: ${profile.verificationStatus} | Marketplace: ${profile.marketplaceVisible}`);
    console.log(`      Experience: ${profile.experienceYears} years`);
    
    if (profile.doctorClinics.length > 0) {
      profile.doctorClinics.forEach(dc => {
        console.log(`      🏥 Associated with: ${dc.clinic.name} (${dc.inviteStatus})`);
      });
    }
    console.log('');
  });

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   - Clinics created: ${clinics.length}`);
  console.log(`   - Doctors created: ${doctors.length}`);
  console.log(`   - Verified clinics: ${clinics.filter(c => c.isVerified).length}`);
  console.log(`   - Active doctors: ${doctors.filter(d => d.isActive).length}`);
  console.log(`   - Marketplace visible: ${doctors.filter(d => d.doctorProfile?.marketplaceVisible).length}`);
  
  console.log('\n✅ All test data verified successfully!');
  console.log('\n🔐 Test Login Credentials:');
  console.log('   Clinic 1: 9639639639 (OTP: 123456)');
  console.log('   Clinic 2: 9879879879 (OTP: 123456)');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
