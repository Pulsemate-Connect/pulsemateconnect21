/**
 * Check what data mobile app receives when fetching clinic details
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Mobile Clinic Data Check');
  console.log('============================================\n');

  try {
    // Find a clinic with verified status
    const clinic = await prisma.clinic.findFirst({
      where: { approvalStatus: 'VERIFIED' },
      include: {
        owner: { select: { id: true, name: true, mobile: true, email: true } },
        staff: {
          where: { isActive: true },
          include: {
            user: {
              include: {
                doctorProfile: true,
              },
            },
          },
        },
        doctorClinics: {
          where: { isActive: true },
          include: {
            doctor: {
              include: {
                user: { select: { id: true, name: true, mobile: true } },
              },
            },
          },
        },
      },
    });

    if (!clinic) {
      console.log('❌ No verified clinics found in database');
      return;
    }

    console.log('Clinic Details:');
    console.log(`  ID: ${clinic.id}`);
    console.log(`  Name: ${clinic.name}`);
    console.log(`  Owner: ${clinic.owner.name}`);
    console.log(`  Approval Status: ${clinic.approvalStatus}`);
    console.log();

    console.log('Staff (from staff table):');
    if (clinic.staff.length === 0) {
      console.log('  (none)');
    } else {
      clinic.staff.forEach((staff, i) => {
        console.log(`  ${i + 1}. ${staff.user.name} (${staff.role})`);
      });
    }
    console.log();

    console.log('Doctors (from doctorClinics table):');
    console.log(`  Total: ${clinic.doctorClinics.length}`);
    if (clinic.doctorClinics.length === 0) {
      console.log('  ❌ NO DOCTORS FOUND');
      console.log();
      console.log('  This is why mobile app shows no doctors!');
      console.log();
      
      // Check if there are any doctorClinics with isActive=false
      const inactiveDoctors = await prisma.doctorClinic.findMany({
        where: { clinicId: clinic.id, isActive: false },
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      });
      
      if (inactiveDoctors.length > 0) {
        console.log('  Found inactive doctors:');
        inactiveDoctors.forEach((dc, i) => {
          console.log(`    ${i + 1}. ${dc.doctor.user.name} - isActive: false, inviteStatus: ${dc.inviteStatus}`);
        });
      }

      // Check all doctorClinics for this clinic regardless of isActive
      const allDoctors = await prisma.doctorClinic.findMany({
        where: { clinicId: clinic.id },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, approvalStatus: true } },
            },
          },
        },
      });

      console.log();
      console.log(`  Total doctorClinics entries (any status): ${allDoctors.length}`);
      if (allDoctors.length > 0) {
        console.log('  All entries:');
        allDoctors.forEach((dc, i) => {
          console.log(`    ${i + 1}. ${dc.doctor.user.name}`);
          console.log(`       - inviteStatus: ${dc.inviteStatus}`);
          console.log(`       - isActive: ${dc.isActive}`);
          console.log(`       - user approvalStatus: ${dc.doctor.user.approvalStatus}`);
        });
      }
    } else {
      clinic.doctorClinics.forEach((dc, i) => {
        console.log(`  ${i + 1}. ${dc.doctor.user.name}`);
        console.log(`     - inviteStatus: ${dc.inviteStatus}`);
        console.log(`     - isActive: ${dc.isActive}`);
      });
    }

    console.log();
    console.log('============================================');
    console.log('What Mobile App Receives:');
    console.log('============================================');
    
    const mobileResponse = {
      clinic: {
        id: clinic.id,
        name: clinic.name,
        doctorClinics: clinic.doctorClinics.map(dc => ({
          id: dc.id,
          inviteStatus: dc.inviteStatus,
          isActive: dc.isActive,
          doctor: {
            id: dc.doctor.id,
            user: {
              name: dc.doctor.user.name,
            },
          },
        })),
      },
    };

    console.log(JSON.stringify(mobileResponse, null, 2));
    console.log();

    if (clinic.doctorClinics.length === 0) {
      console.log('⚠️  ISSUE: Mobile app receives empty doctorClinics array');
      console.log('   This is why doctors don\'t appear on mobile!');
    } else {
      console.log('✅ Mobile app should show', clinic.doctorClinics.length, 'doctor(s)');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
