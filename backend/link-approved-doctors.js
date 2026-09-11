const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkApprovedDoctors() {
  try {
    console.log('🔗 Linking Approved Doctors to Their Invited Clinics...\n');

    // Find all VERIFIED doctors
    const verifiedDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: true,
        doctorClinics: true,
      },
    });

    console.log(`Found ${verifiedDoctors.length} verified doctor(s)\n`);

    for (const doctor of verifiedDoctors) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👨‍⚕️ ${doctor.user.name}`);
      console.log(`   Mobile: ${doctor.user.mobile}`);
      console.log(`   User ID: ${doctor.userId}`);
      console.log(`   Doctor Profile ID: ${doctor.id}`);
      console.log(`   Current Clinic Links: ${doctor.doctorClinics.length}`);

      // Search for invitations by multiple criteria
      const invitations = await prisma.doctorInvitation.findMany({
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

      console.log(`   Found ${invitations.length} invitation(s)`);

      if (invitations.length === 0) {
        console.log(`   ℹ️  No invitations found - doctor may have self-registered`);
        console.log('');
        continue;
      }

      for (const invitation of invitations) {
        console.log(`\n   📧 Invitation Details:`);
        console.log(`      From Clinic: ${invitation.clinic.name}`);
        console.log(`      Invitation Status: ${invitation.status}`);
        console.log(`      Created: ${invitation.createdAt.toLocaleString()}`);

        // Check if already linked
        const existingLink = await prisma.doctorClinic.findUnique({
          where: {
            doctorId_clinicId: {
              doctorId: doctor.id,
              clinicId: invitation.clinicId,
            },
          },
        });

        if (existingLink) {
          console.log(`      ✅ Already linked (ID: ${existingLink.id})`);
          console.log(`      Status: ${existingLink.inviteStatus}, Active: ${existingLink.isActive}`);
          
          // Ensure it's active
          if (!existingLink.isActive || existingLink.inviteStatus !== 'ACCEPTED') {
            await prisma.doctorClinic.update({
              where: { id: existingLink.id },
              data: {
                inviteStatus: 'ACCEPTED',
                isActive: true,
              },
            });
            console.log(`      ✅ Updated to ACCEPTED and ACTIVE`);
          }
        } else {
          console.log(`      📝 Creating new clinic-doctor link...`);
          
          const newLink = await prisma.doctorClinic.create({
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
          
          console.log(`      ✅ Successfully linked! (Link ID: ${newLink.id})`);
        }

        // Update invitation status if not VERIFIED
        if (invitation.status !== 'VERIFIED') {
          await prisma.doctorInvitation.update({
            where: { id: invitation.id },
            data: {
              status: 'VERIFIED',
              verifiedAt: new Date(),
            },
          });
          console.log(`      ✅ Updated invitation status to VERIFIED`);
        }
      }

      console.log('');
    }

    // Final Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 FINAL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const finalDoctors = await prisma.doctorProfile.findMany({
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

    for (const doc of finalDoctors) {
      console.log(`👨‍⚕️ ${doc.user.name} (${doc.user.mobile})`);
      console.log(`   Active: ${doc.user.isActive}`);
      console.log(`   Linked to ${doc.doctorClinics.length} clinic(s):`);
      
      if (doc.doctorClinics.length === 0) {
        console.log(`      ⚠️  NO CLINIC LINKS - CHECK INVITATIONS!`);
      } else {
        for (const dc of doc.doctorClinics) {
          console.log(`      ✅ ${dc.clinic.name} (${dc.inviteStatus})`);
        }
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL DOCTORS PROCESSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

linkApprovedDoctors()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
