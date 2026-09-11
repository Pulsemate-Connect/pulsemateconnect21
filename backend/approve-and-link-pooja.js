const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approvePoojaAndLink() {
  try {
    console.log('✅ Approving and Linking Pooja Naik...\n');

    // Find Pooja
    const pooja = await prisma.user.findUnique({
      where: { mobile: '+918197689363' },
      include: {
        doctorProfile: true,
      },
    });

    if (!pooja || !pooja.doctorProfile) {
      console.log('❌ Pooja not found!');
      return;
    }

    console.log(`Found: ${pooja.name} (${pooja.mobile})`);
    console.log(`Doctor Profile ID: ${pooja.doctorProfile.id}`);
    console.log('');

    // Find the VERIFIED invitation (most recent)
    const invitation = await prisma.doctorInvitation.findFirst({
      where: {
        doctorMobile: pooja.mobile,
        status: 'VERIFIED',
      },
      include: {
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation) {
      console.log('❌ No VERIFIED invitation found!');
      return;
    }

    console.log(`Found VERIFIED invitation from: ${invitation.clinic.name}`);
    console.log('');

    // STEP 1: Update doctor profile approval
    console.log('STEP 1: Updating doctor profile approval status...');
    await prisma.doctorProfile.update({
      where: { id: pooja.doctorProfile.id },
      data: {
        approvalStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        marketplaceVisible: true,
      },
    });
    console.log('✅ Doctor profile approved\n');

    // STEP 2: Update user approval (should already be VERIFIED, but ensure it)
    console.log('STEP 2: Ensuring user approval status...');
    await prisma.user.update({
      where: { id: pooja.id },
      data: {
        approvalStatus: 'VERIFIED',
        rejectionReason: null,
      },
    });
    console.log('✅ User approval confirmed\n');

    // STEP 3: Check if already linked
    console.log('STEP 3: Checking for existing clinic link...');
    const existingLink = await prisma.doctorClinic.findUnique({
      where: {
        doctorId_clinicId: {
          doctorId: pooja.doctorProfile.id,
          clinicId: invitation.clinicId,
        },
      },
    });

    if (existingLink) {
      console.log('   Found existing link, updating status...');
      await prisma.doctorClinic.update({
        where: { id: existingLink.id },
        data: {
          inviteStatus: 'ACCEPTED',
          isActive: true,
          adminVerifiedAt: new Date(),
        },
      });
      console.log('✅ Existing link updated\n');
    } else {
      console.log('   No existing link, creating new one...');
      await prisma.doctorClinic.create({
        data: {
          doctorId: pooja.doctorProfile.id,
          clinicId: invitation.clinicId,
          inviteStatus: 'ACCEPTED',
          roleAtClinic: invitation.specialization || 'CONSULTANT',
          consultationFee: pooja.doctorProfile.consultationFee || 500,
          isActive: true,
          joinedAt: new Date(),
          adminVerifiedAt: new Date(),
        },
      });
      console.log('✅ New clinic link created\n');
    }

    // STEP 4: Final verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const updatedPooja = await prisma.user.findUnique({
      where: { id: pooja.id },
      include: {
        doctorProfile: {
          include: {
            doctorClinics: {
              where: { isActive: true },
              include: {
                clinic: true,
              },
            },
          },
        },
      },
    });

    console.log(`👨‍⚕️ ${updatedPooja.name}`);
    console.log(`   Mobile: ${updatedPooja.mobile}`);
    console.log(`   User Approval: ${updatedPooja.approvalStatus}`);
    console.log(`   Profile Approval: ${updatedPooja.doctorProfile.approvalStatus}`);
    console.log(`   Active: ${updatedPooja.isActive}`);
    console.log(`   Linked Clinics: ${updatedPooja.doctorProfile.doctorClinics.length}\n`);

    if (updatedPooja.doctorProfile.doctorClinics.length === 0) {
      console.log('❌ STILL NOT LINKED! Something went wrong.');
    } else {
      updatedPooja.doctorProfile.doctorClinics.forEach((dc, idx) => {
        console.log(`   ${idx + 1}. ${dc.clinic.name}`);
        console.log(`      Status: ${dc.inviteStatus}, Active: ${dc.isActive}`);
      });
      console.log('');
      console.log('🎉 Pooja is now approved and linked to clinic!');
      console.log(`   Spine Clinic owner can now see Pooja in their "Doctors" list.`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approvePoojaAndLink();
