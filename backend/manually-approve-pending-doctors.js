const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manuallyApproveDoctors() {
  try {
    console.log('✅ Manually Approving Pending Doctors...\n');

    const pendingDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'PENDING',
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${pendingDoctors.length} doctor(s) to approve\n`);

    for (const doctor of pendingDoctors) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👨‍⚕️ Approving: ${doctor.user.name}`);
      console.log(`   Mobile: ${doctor.user.mobile}`);
      console.log('');

      // Find invitation
      const invitation = await prisma.doctorInvitation.findFirst({
        where: {
          OR: [
            { doctorUserId: doctor.userId },
            { doctorProfileId: doctor.id },
            { doctorMobile: doctor.user.mobile },
          ],
        },
        include: {
          clinic: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!invitation) {
        console.log(`   ⚠️  No invitation found - skipping (needs manual clinic assignment)`);
        console.log('');
        continue;
      }

      console.log(`   📧 Found invitation from: ${invitation.clinic.name}`);
      console.log('');

      // STEP 1: Update doctor profile
      await prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: {
          approvalStatus: 'VERIFIED',
          profileStatus: 'COMPLETE',
          marketplaceVisible: true,
        },
      });
      console.log(`   ✅ Updated doctor profile to VERIFIED`);

      // STEP 2: Update user
      await prisma.user.update({
        where: { id: doctor.userId },
        data: {
          approvalStatus: 'VERIFIED',
          rejectionReason: null,
        },
      });
      console.log(`   ✅ Updated user approval status`);

      // STEP 3: Create clinic-doctor link
      const existingLink = await prisma.doctorClinic.findUnique({
        where: {
          doctorId_clinicId: {
            doctorId: doctor.id,
            clinicId: invitation.clinicId,
          },
        },
      });

      if (existingLink) {
        await prisma.doctorClinic.update({
          where: { id: existingLink.id },
          data: {
            inviteStatus: 'ACCEPTED',
            isActive: true,
            adminVerifiedAt: new Date(),
          },
        });
        console.log(`   ✅ Updated existing clinic-doctor link`);
      } else {
        await prisma.doctorClinic.create({
          data: {
            doctorId: doctor.id,
            clinicId: invitation.clinicId,
            inviteStatus: 'ACCEPTED',
            roleAtClinic: invitation.specialization || 'CONSULTANT',
            consultationFee: doctor.consultationFee || 500,
            isActive: true,
            joinedAt: new Date(),
            adminVerifiedAt: new Date(),
          },
        });
        console.log(`   ✅ Created new clinic-doctor link`);
      }

      // STEP 4: Update invitation
      await prisma.doctorInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
      console.log(`   ✅ Updated invitation status`);

      console.log('');
      console.log(`   🎉 ${doctor.user.name} approved and linked to ${invitation.clinic.name}!`);
      console.log('');
    }

    // Final verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allVerifiedDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
      },
      include: {
        user: true,
        doctorClinics: {
          where: { isActive: true },
          include: {
            clinic: true,
          },
        },
      },
    });

    for (const doc of allVerifiedDoctors) {
      console.log(`👨‍⚕️ ${doc.user.name} (${doc.user.mobile})`);
      console.log(`   Status: VERIFIED, Active: ${doc.user.isActive}`);
      console.log(`   Linked Clinics: ${doc.doctorClinics.length}`);
      
      if (doc.doctorClinics.length === 0) {
        console.log(`      ⚠️  NO CLINIC LINKS!`);
      } else {
        for (const dc of doc.doctorClinics) {
          console.log(`      ✅ ${dc.clinic.name}`);
        }
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL DOCTORS APPROVED AND LINKED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

manuallyApproveDoctors()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
