const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllIssues() {
  try {
    console.log('🔧 Fixing All Doctor Issues...\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ISSUE 1: Fully Disable Gourish Naik (has appointments, can't delete)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔒 ISSUE 1: Fully Disable Gourish Naik');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const gourish = await prisma.user.findFirst({
      where: { name: { contains: 'Gourish' } },
      include: {
        doctorProfile: {
          include: {
            doctorClinics: true,
          },
        },
      },
    });

    if (gourish) {
      console.log(`Found: ${gourish.name} (${gourish.mobile})`);
      console.log(`User ID: ${gourish.id}`);
      console.log(`Active: ${gourish.isActive}`);
      
      // Disable user account
      await prisma.user.update({
        where: { id: gourish.id },
        data: {
          isActive: false,
          approvalStatus: 'REJECTED',
        },
      });
      console.log(`✅ Disabled user account`);
      
      if (gourish.doctorProfile) {
        // Deactivate all clinic links
        const updatedLinks = await prisma.doctorClinic.updateMany({
          where: { doctorId: gourish.doctorProfile.id },
          data: {
            isActive: false,
            inviteStatus: 'REJECTED',
          },
        });
        console.log(`✅ Deactivated ${updatedLinks.count} clinic link(s)`);

        // Disable doctor profile
        await prisma.doctorProfile.update({
          where: { id: gourish.doctorProfile.id },
          data: {
            approvalStatus: 'REJECTED',
            verificationStatus: 'REJECTED',
            marketplaceVisible: false,
            profileStatus: 'INCOMPLETE',
          },
        });
        console.log(`✅ Disabled doctor profile (kept for appointment history)`);
      }
      console.log('');
    } else {
      console.log('ℹ️  Gourish Naik not found\n');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ISSUE 2: Remove Dr. Arjun from Pain Clinic Staff
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ISSUE 2: Remove Dr. Arjun from Pain Clinic Staff');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const painClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'Pain Clinic' } },
    });

    const arjun = await prisma.user.findUnique({
      where: { mobile: '+919740809295' },
    });

    if (painClinic && arjun) {
      const staffEntry = await prisma.clinicStaff.findFirst({
        where: {
          clinicId: painClinic.id,
          userId: arjun.id,
        },
      });

      if (staffEntry) {
        await prisma.clinicStaff.delete({
          where: { id: staffEntry.id },
        });
        console.log(`✅ Removed Dr. Arjun from Pain Clinic staff`);
        console.log(`   Clinic: ${painClinic.name}`);
        console.log(`   Staff ID deleted: ${staffEntry.id}`);
      } else {
        console.log('ℹ️  Dr. Arjun not in Pain Clinic staff');
      }
    } else {
      console.log('⚠️  Pain Clinic or Dr. Arjun not found');
    }
    console.log('');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ISSUE 3: Fix auto-linking for approved doctors
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 ISSUE 3: Auto-Link Approved Doctors to Invited Clinics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Find all approved doctors with pending invitations
    const approvedDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: true,
        doctorClinics: true,
      },
    });

    console.log(`Found ${approvedDoctors.length} verified doctors\n`);

    for (const doctor of approvedDoctors) {
      console.log(`👨‍⚕️ ${doctor.user.name} (${doctor.user.mobile})`);
      console.log(`   Doctor Profile ID: ${doctor.id}`);
      console.log(`   Current Clinic Links: ${doctor.doctorClinics.length}`);

      // Check for pending invitations
      const invitations = await prisma.doctorInvitation.findMany({
        where: {
          OR: [
            { email: doctor.user.email },
            { phone: doctor.user.mobile },
          ],
          status: 'PENDING',
        },
        include: {
          clinic: true,
        },
      });

      console.log(`   Pending Invitations: ${invitations.length}`);

      if (invitations.length > 0) {
        for (const invitation of invitations) {
          console.log(`   📧 Invitation from: ${invitation.clinic.name}`);

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
            console.log(`      ℹ️  Already linked (updating status...)`);
            await prisma.doctorClinic.update({
              where: { id: existingLink.id },
              data: {
                inviteStatus: 'ACCEPTED',
                isActive: true,
              },
            });
          } else {
            console.log(`      ✅ Creating clinic-doctor link...`);
            await prisma.doctorClinic.create({
              data: {
                doctorId: doctor.id,
                clinicId: invitation.clinicId,
                inviteStatus: 'ACCEPTED',
                roleAtClinic: invitation.roleAtClinic || 'CONSULTANT',
                consultationFee: doctor.consultationFee || 500,
                isActive: true,
                joinedAt: new Date(),
              },
            });
          }

          // Update invitation status
          await prisma.doctorInvitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
          });

          console.log(`      ✅ Linked to ${invitation.clinic.name}`);
        }
      } else {
        console.log(`   ℹ️  No pending invitations`);
      }
      console.log('');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FINAL VERIFICATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FINAL STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const finalDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
      },
      include: {
        user: true,
        doctorClinics: {
          include: {
            clinic: true,
          },
        },
      },
    });

    for (const doc of finalDoctors) {
      console.log(`👨‍⚕️ ${doc.user.name}`);
      console.log(`   Mobile: ${doc.user.mobile}`);
      console.log(`   Active: ${doc.user.isActive}`);
      console.log(`   Linked Clinics: ${doc.doctorClinics.length}`);
      for (const dc of doc.doctorClinics) {
        console.log(`      - ${dc.clinic.name} (${dc.inviteStatus})`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL FIXES COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Gourish Naik fully disabled (kept for appointment history)');
    console.log('✅ Dr. Arjun removed from Pain Clinic staff');
    console.log('✅ Approved doctors auto-linked to invited clinics');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllIssues()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
