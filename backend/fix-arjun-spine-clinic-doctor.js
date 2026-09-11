const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArjunAsDoctor() {
  try {
    console.log('🔧 Fixing Dr. Arjun Upadhyay as Doctor in Spine Clinic...\n');

    // Step 1: Find Dr. Arjun Upadhyay
    const arjun = await prisma.user.findUnique({
      where: { mobile: '+919740809295' },
      include: {
        doctorProfile: true,
        ownedClinics: true,
      },
    });

    if (!arjun) {
      console.log('❌ Dr. Arjun Upadhyay not found!');
      return;
    }

    console.log('✅ Found Dr. Arjun Upadhyay:');
    console.log(`   User ID: ${arjun.id}`);
    console.log(`   Name: ${arjun.name}`);
    console.log(`   Current Role: ${arjun.role}`);
    console.log(`   Current Roles: ${JSON.stringify(arjun.roles)}`);
    console.log(`   Has Doctor Profile: ${!!arjun.doctorProfile}`);
    console.log(`   Owned Clinics: ${arjun.ownedClinics.length}`);
    console.log('');

    // Step 2: Find Spine Clinic
    const spineClinic = await prisma.clinic.findFirst({
      where: {
        name: { contains: 'Spine Clinic' },
      },
    });

    if (!spineClinic) {
      console.log('❌ Spine Clinic not found!');
      return;
    }

    console.log('✅ Found Spine Clinic:');
    console.log(`   Clinic ID: ${spineClinic.id}`);
    console.log(`   Name: ${spineClinic.name}`);
    console.log(`   Owner ID: ${spineClinic.ownerId}`);
    console.log('');

    // Step 3: Update Dr. Arjun's role to DOCTOR (primary role)
    console.log('📝 Updating Dr. Arjun role to DOCTOR...');
    
    // Keep both roles but make DOCTOR primary
    const updatedRoles = arjun.roles || [arjun.role];
    if (!updatedRoles.includes('DOCTOR')) {
      updatedRoles.push('DOCTOR');
    }
    
    const updatedArjun = await prisma.user.update({
      where: { id: arjun.id },
      data: {
        role: 'DOCTOR', // Primary role
        roles: updatedRoles, // Keep all roles
        primaryRole: 'DOCTOR',
      },
    });

    console.log('✅ Updated Dr. Arjun Upadhyay:');
    console.log(`   New Role: ${updatedArjun.role}`);
    console.log(`   All Roles: ${JSON.stringify(updatedArjun.roles)}`);
    console.log(`   Primary Role: ${updatedArjun.primaryRole}`);
    console.log('');

    // Step 4: Ensure doctor profile exists and is verified
    if (!arjun.doctorProfile) {
      console.log('❌ No doctor profile found!');
      return;
    }

    const doctorProfile = await prisma.doctorProfile.update({
      where: { id: arjun.doctorProfile.id },
      data: {
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        marketplaceVisible: true,
      },
    });

    console.log('✅ Doctor Profile Updated:');
    console.log(`   Profile ID: ${doctorProfile.id}`);
    console.log(`   Approval Status: ${doctorProfile.approvalStatus}`);
    console.log(`   Verification Status: ${doctorProfile.verificationStatus}`);
    console.log(`   Specialization: ${doctorProfile.specialization}`);
    console.log('');

    // Step 5: Check/Create clinic-doctor link
    console.log('🔗 Checking clinic-doctor relationship...');
    
    let clinicDoctor = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: doctorProfile.id,
          clinicId: spineClinic.id,
        },
      },
    });

    if (clinicDoctor) {
      console.log('✅ Clinic-doctor link exists, updating...');
      clinicDoctor = await prisma.doctorClinic.update({
        where: { id: clinicDoctor.id },
        data: {
          inviteStatus: 'ACCEPTED',
          isActive: true,
        },
      });
    } else {
      console.log('📝 Creating clinic-doctor link...');
      clinicDoctor = await prisma.doctorClinic.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: spineClinic.id,
          inviteStatus: 'ACCEPTED',
          roleAtClinic: 'CONSULTANT',
          consultationFee: doctorProfile.consultationFee || 500,
          isActive: true,
          joinedAt: new Date(),
        },
      });
    }

    console.log('✅ Clinic-Doctor Link:');
    console.log(`   Link ID: ${clinicDoctor.id}`);
    console.log(`   Status: ${clinicDoctor.inviteStatus}`);
    console.log(`   Active: ${clinicDoctor.isActive}`);
    console.log('');

    // Step 6: Check staff entry
    console.log('👥 Checking staff entry...');
    
    let staffEntry = await prisma.clinicStaff.findFirst({
      where: {
        clinicId: spineClinic.id,
        userId: arjun.id,
      },
    });

    if (staffEntry) {
      console.log('✅ Staff entry exists, updating...');
      staffEntry = await prisma.clinicStaff.update({
        where: { id: staffEntry.id },
        data: {
          role: 'DOCTOR',
          isActive: true,
        },
      });
    } else {
      console.log('📝 Creating staff entry...');
      staffEntry = await prisma.clinicStaff.create({
        data: {
          clinicId: spineClinic.id,
          userId: arjun.id,
          role: 'DOCTOR',
          isActive: true,
        },
      });
    }

    console.log('✅ Staff Entry:');
    console.log(`   Staff ID: ${staffEntry.id}`);
    console.log(`   Role: ${staffEntry.role}`);
    console.log(`   Active: ${staffEntry.isActive}`);
    console.log('');

    // Final Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Dr. Arjun Fixed as Doctor in Spine Clinic!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👨‍⚕️ Dr. Arjun Upadhyay:');
    console.log(`   User ID: ${updatedArjun.id}`);
    console.log(`   Primary Role: ${updatedArjun.role} (DOCTOR)`);
    console.log(`   All Roles: ${JSON.stringify(updatedArjun.roles)}`);
    console.log(`   Mobile: ${updatedArjun.mobile}`);
    console.log('');
    console.log('🏥 Spine Clinic:');
    console.log(`   Clinic ID: ${spineClinic.id}`);
    console.log(`   Name: ${spineClinic.name}`);
    console.log(`   Owner: ${spineClinic.ownerId === arjun.id ? 'Dr. Arjun' : 'Someone else'}`);
    console.log('');
    console.log('✅ Status:');
    console.log('   ✓ Dr. Arjun role changed to DOCTOR');
    console.log('   ✓ Doctor profile verified');
    console.log('   ✓ Linked to Spine Clinic');
    console.log('   ✓ Staff entry created');
    console.log('   ✓ Ready to see patients!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixArjunAsDoctor()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
