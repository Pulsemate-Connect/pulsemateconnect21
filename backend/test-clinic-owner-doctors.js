const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Clinic Owner Doctors Check');
  console.log('============================================\n');

  // Get SPINE clinic
  const clinic = await prisma.clinic.findFirst({
    where: { name: 'SPINE' },
    include: {
      owner: {
        select: { id: true, name: true }
      }
    }
  });

  console.log('Clinic:', clinic.name);
  console.log('Owner:', clinic.owner.name);
  console.log('Owner ID:', clinic.ownerId);
  console.log();

  // Get doctorClinics for this clinic
  const doctorClinics = await prisma.doctorClinic.findMany({
    where: { clinicId: clinic.id },
    include: {
      doctor: {
        include: {
          user: {
            select: { name: true, approvalStatus: true, isActive: true }
          }
        }
      }
    }
  });

  console.log(`DoctorClinics entries: ${doctorClinics.length}`);
  if (doctorClinics.length === 0) {
    console.log('  ❌ NO ENTRIES - This is why clinic owner sees no doctors!');
  } else {
    doctorClinics.forEach((dc, i) => {
      console.log(`\n${i + 1}. ${dc.doctor.user.name}`);
      console.log(`   inviteStatus: ${dc.inviteStatus}`);
      console.log(`   isActive: ${dc.isActive}`);
      console.log(`   user.approvalStatus: ${dc.doctor.user.approvalStatus}`);
      console.log(`   user.isActive: ${dc.doctor.user.isActive}`);
      
      const issues = [];
      if (dc.inviteStatus !== 'ACCEPTED') issues.push(`inviteStatus is ${dc.inviteStatus}, should be ACCEPTED`);
      if (!dc.isActive) issues.push('isActive is false');
      if (dc.doctor.user.approvalStatus !== 'VERIFIED') issues.push(`user not verified (${dc.doctor.user.approvalStatus})`);
      if (!dc.doctor.user.isActive) issues.push('user not active');
      
      if (issues.length > 0) {
        console.log(`   ❌ Issues: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ Should appear in clinic owner dashboard`);
      }
    });
  }

  // Test the query that getClinicDoctors uses
  console.log('\n============================================');
  console.log('Testing getClinicDoctors Query');
  console.log('============================================\n');

  // Without status filter (default)
  const allDoctors = await prisma.doctorClinic.findMany({
    where: { clinicId: clinic.id },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, approvalStatus: true }
          }
        }
      }
    }
  });

  console.log(`Query with no filter: ${allDoctors.length} doctors`);
  allDoctors.forEach(dc => {
    console.log(`  - ${dc.doctor.user.name}`);
  });

  // With ACTIVE status filter
  const activeDoctors = await prisma.doctorClinic.findMany({
    where: { 
      clinicId: clinic.id,
      isActive: true,
      inviteStatus: 'ACCEPTED'
    },
    include: {
      doctor: {
        include: {
          user: {
            select: { id: true, name: true, approvalStatus: true }
          }
        }
      }
    }
  });

  console.log(`\nQuery with ACTIVE filter: ${activeDoctors.length} doctors`);
  activeDoctors.forEach(dc => {
    console.log(`  - ${dc.doctor.user.name}`);
  });

  console.log('\n============================================');
  console.log('Conclusion');
  console.log('============================================\n');

  if (allDoctors.length > 0) {
    console.log('✅ Doctors exist in database');
    console.log(`   API endpoint GET /api/clinic/doctors should return ${allDoctors.length} doctor(s)`);
    console.log('   If clinic owner still sees "No doctors yet", the issue is:');
    console.log('   1. Frontend not calling the correct API');
    console.log('   2. Frontend not rendering the response');
    console.log('   3. Authentication/authorization issue');
  } else {
    console.log('❌ No doctors in database');
    console.log('   Need to run fix-doctor-clinic-links.js');
  }
}

main().finally(() => prisma.$disconnect());
