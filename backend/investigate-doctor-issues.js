const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  try {
    console.log('🔍 Investigating Doctor Issues...\n');

    // 1. Check all doctors and their clinic associations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ALL DOCTORS AND THEIR CLINICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const doctors = await prisma.doctorProfile.findMany({
      include: {
        user: true,
        doctorClinics: {
          include: {
            clinic: true,
          },
        },
      },
    });

    for (const doctor of doctors) {
      console.log(`👨‍⚕️ ${doctor.user.name}`);
      console.log(`   User ID: ${doctor.user.id}`);
      console.log(`   Mobile: ${doctor.user.mobile}`);
      console.log(`   Doctor Profile ID: ${doctor.id}`);
      console.log(`   Specialization: ${doctor.specialization}`);
      console.log(`   Approval Status: ${doctor.approvalStatus}`);
      console.log(`   Verification Status: ${doctor.verificationStatus}`);
      console.log(`   Active: ${doctor.user.isActive}`);
      console.log(`   Associated Clinics (${doctor.doctorClinics.length}):`);
      
      for (const dc of doctor.doctorClinics) {
        console.log(`      - ${dc.clinic.name}`);
        console.log(`        Clinic ID: ${dc.clinicId}`);
        console.log(`        Link Status: ${dc.inviteStatus}`);
        console.log(`        Active: ${dc.isActive}`);
        console.log(`        Role: ${dc.roleAtClinic}`);
      }
      console.log('');
    }

    // 2. Check Pain Clinic specifically
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 PAIN CLINIC DETAILS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const painClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'Pain Clinic' } },
      include: {
        owner: true,
        doctorClinics: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    if (painClinic) {
      console.log(`Clinic: ${painClinic.name}`);
      console.log(`ID: ${painClinic.id}`);
      console.log(`Owner: ${painClinic.owner.name} (${painClinic.owner.mobile})`);
      console.log(`\nDoctors linked to Pain Clinic (${painClinic.doctorClinics.length}):`);
      
      for (const dc of painClinic.doctorClinics) {
        console.log(`   - ${dc.doctor.user.name} (${dc.doctor.user.mobile})`);
        console.log(`     Link ID: ${dc.id}`);
        console.log(`     Status: ${dc.inviteStatus}`);
        console.log(`     Active: ${dc.isActive}`);
      }

      console.log(`\nStaff at Pain Clinic (${painClinic.staff.length}):`);
      for (const staff of painClinic.staff) {
        console.log(`   - ${staff.user.name} (${staff.user.mobile})`);
        console.log(`     Role: ${staff.role}`);
        console.log(`     Active: ${staff.isActive}`);
      }
    } else {
      console.log('❌ Pain Clinic not found!');
    }
    console.log('');

    // 3. Check Spine Clinic
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 SPINE CLINIC DETAILS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const spineClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'Spine Clinic' } },
      include: {
        owner: true,
        doctorClinics: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: true,
          },
        },
      },
    });

    if (spineClinic) {
      console.log(`Clinic: ${spineClinic.name}`);
      console.log(`ID: ${spineClinic.id}`);
      console.log(`Owner: ${spineClinic.owner.name} (${spineClinic.owner.mobile})`);
      console.log(`\nDoctors linked to Spine Clinic (${spineClinic.doctorClinics.length}):`);
      
      for (const dc of spineClinic.doctorClinics) {
        console.log(`   - ${dc.doctor.user.name} (${dc.doctor.user.mobile})`);
        console.log(`     Link ID: ${dc.id}`);
        console.log(`     Status: ${dc.inviteStatus}`);
        console.log(`     Active: ${dc.isActive}`);
      }

      console.log(`\nStaff at Spine Clinic (${spineClinic.staff.length}):`);
      for (const staff of spineClinic.staff) {
        console.log(`   - ${staff.user.name} (${staff.user.mobile})`);
        console.log(`     Role: ${staff.role}`);
        console.log(`     Active: ${staff.isActive}`);
      }
    } else {
      console.log('❌ Spine Clinic not found!');
    }
    console.log('');

    // 4. Check Gourish Naik
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 GOURISH NAIK STATUS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const gourish = await prisma.user.findFirst({
      where: { name: { contains: 'Gourish' } },
      include: {
        doctorProfile: {
          include: {
            doctorClinics: {
              include: {
                clinic: true,
              },
            },
          },
        },
      },
    });

    if (gourish) {
      console.log(`Name: ${gourish.name}`);
      console.log(`User ID: ${gourish.id}`);
      console.log(`Mobile: ${gourish.mobile}`);
      console.log(`Active: ${gourish.isActive}`);
      console.log(`Role: ${gourish.role}`);
      if (gourish.doctorProfile) {
        console.log(`Doctor Profile ID: ${gourish.doctorProfile.id}`);
        console.log(`Approval: ${gourish.doctorProfile.approvalStatus}`);
        console.log(`Clinic Links: ${gourish.doctorProfile.doctorClinics.length}`);
      }
    } else {
      console.log('❌ Gourish Naik not found!');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

investigate()
  .then(() => {
    console.log('✅ Investigation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error);
    process.exit(1);
  });
