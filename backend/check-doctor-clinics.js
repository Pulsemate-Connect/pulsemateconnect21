/**
 * Check Doctor Clinic Associations
 * Verify which clinics a doctor is associated with
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Check Doctor Clinic Associations ===\n');

  // Get doctor by mobile number
  const doctorMobile = process.argv[2] || '+919480562922'; // Default to Samay
  
  const doctor = await prisma.user.findFirst({
    where: {
      mobile: doctorMobile,
      role: 'DOCTOR'
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
      },
      clinicStaff: {
        include: {
          clinic: true
        }
      }
    }
  });

  if (!doctor) {
    console.log('❌ Doctor not found!');
    return;
  }

  console.log(`👨‍⚕️ Doctor: ${doctor.name} (${doctor.mobile})`);
  console.log(`   Role: ${doctor.role}`);
  console.log(`   Doctor Profile ID: ${doctor.doctorProfile?.id || 'NOT FOUND'}`);
  
  console.log('\n📋 ClinicStaff Associations:');
  if (doctor.clinicStaff.length === 0) {
    console.log('   ❌ No ClinicStaff records found');
  } else {
    doctor.clinicStaff.forEach((cs, idx) => {
      console.log(`   ${idx + 1}. ${cs.clinic.name}`);
      console.log(`      - isActive: ${cs.isActive}`);
      console.log(`      - role: ${cs.role}`);
      console.log(`      - clinicId: ${cs.clinicId}`);
      console.log(`      - userId: ${cs.userId}`);
    });
  }

  console.log('\n🏥 DoctorClinics Associations:');
  const doctorClinics = doctor.doctorProfile?.doctorClinics || [];
  if (doctorClinics.length === 0) {
    console.log('   ❌ No DoctorClinics records found');
    console.log('   ℹ️  This table is used for the schedule page!');
  } else {
    doctorClinics.forEach((dc, idx) => {
      console.log(`   ${idx + 1}. ${dc.clinic.name}`);
      console.log(`      - isActive: ${dc.isActive}`);
      console.log(`      - clinicId: ${dc.clinicId}`);
      console.log(`      - doctorProfileId: ${dc.doctorProfileId}`);
    });
  }

  // Check what the API expects
  console.log('\n🔍 Analysis:');
  if (doctor.clinicStaff.length > 0 && doctorClinics.length === 0) {
    console.log('   ⚠️  PROBLEM FOUND:');
    console.log('   - ClinicStaff record exists (for appointments/queue)');
    console.log('   - DoctorClinics record MISSING (for schedule page)');
    console.log('\n   💡 SOLUTION:');
    console.log('   - Need to create DoctorClinics record');
    console.log('   - This connects DoctorProfile → Clinic');
    
    // Create the missing DoctorClinics record
    console.log('\n🔧 Creating DoctorClinics record...');
    
    for (const cs of doctor.clinicStaff.filter(cs => cs.isActive)) {
      const existing = await prisma.doctorClinic.findFirst({
        where: {
          doctorId: doctor.doctorProfile.id,
          clinicId: cs.clinicId
        }
      });

      if (!existing) {
        await prisma.doctorClinic.create({
          data: {
            doctorId: doctor.doctorProfile.id,
            clinicId: cs.clinicId,
            isActive: true,
            inviteStatus: 'ACCEPTED'
          }
        });
        console.log(`   ✅ Created DoctorClinics for ${cs.clinic.name}`);
      } else {
        console.log(`   ✓  DoctorClinics already exists for ${cs.clinic.name}`);
      }
    }
  } else if (doctorClinics.length > 0) {
    console.log('   ✅ Doctor has DoctorClinics associations');
    console.log('   ✅ Schedule page should work');
  }

  console.log('\n=== Done! ===\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
