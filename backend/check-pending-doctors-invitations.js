const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingDoctors() {
  try {
    console.log('🔍 Checking Pending Doctors and Their Invitations...\n');

    const pendingDoctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'PENDING',
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${pendingDoctors.length} doctor(s) with PENDING approval but VERIFIED documents\n`);

    for (const doctor of pendingDoctors) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👨‍⚕️ ${doctor.user.name}`);
      console.log(`   Mobile: ${doctor.user.mobile}`);
      console.log(`   Email: ${doctor.user.email || 'N/A'}`);
      console.log(`   User ID: ${doctor.userId}`);
      console.log(`   Doctor Profile ID: ${doctor.id}`);
      console.log(`   Approval Status: ${doctor.approvalStatus}`);
      console.log(`   Verification Status: ${doctor.verificationStatus}`);
      console.log('');

      // Find all invitations for this doctor
      const invitations = await prisma.doctorInvitation.findMany({
        where: {
          OR: [
            { doctorUserId: doctor.userId },
            { doctorProfileId: doctor.id },
            { doctorMobile: doctor.user.mobile },
            ...(doctor.user.email ? [{ doctorEmail: doctor.user.email }] : []),
          ],
        },
        include: {
          clinic: {
            include: {
              owner: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`   📧 Found ${invitations.length} invitation(s):\n`);

      if (invitations.length === 0) {
        console.log(`      ⚠️  NO INVITATIONS FOUND!`);
        console.log(`      This doctor may have self-registered without clinic invitation.`);
        console.log(`      Admin needs to manually assign them to a clinic after approval.`);
      } else {
        for (const inv of invitations) {
          console.log(`      ────────────────────────────────────────`);
          console.log(`      Invitation ID: ${inv.id}`);
          console.log(`      From Clinic: ${inv.clinic.name}`);
          console.log(`      Clinic Owner: ${inv.clinic.owner.name} (${inv.clinic.owner.mobile})`);
          console.log(`      Invitation Status: ${inv.status}`);
          console.log(`      Doctor Name in Inv: ${inv.doctorName}`);
          console.log(`      Doctor Mobile in Inv: ${inv.doctorMobile}`);
          console.log(`      Specialization: ${inv.specialization || 'Not specified'}`);
          console.log(`      Created: ${inv.createdAt.toLocaleString()}`);
          console.log(`      Accepted: ${inv.acceptedAt ? inv.acceptedAt.toLocaleString() : 'Not yet'}`);
          console.log(`      Verified: ${inv.verifiedAt ? inv.verifiedAt.toLocaleString() : 'Not yet'}`);
          console.log('');
        }
      }

      console.log(`   💡 WHAT HAPPENS WHEN ADMIN APPROVES:`);
      if (invitations.length > 0) {
        console.log(`      ✅ Doctor will be auto-linked to: ${invitations[0].clinic.name}`);
        console.log(`      ✅ approvalStatus will change: PENDING → VERIFIED`);
        console.log(`      ✅ Clinic owner will see doctor in their panel`);
      } else {
        console.log(`      ⚠️  No automatic clinic link (no invitation found)`);
        console.log(`      📝 Admin must manually assign doctor to a clinic`);
      }
      console.log('\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📌 SUMMARY:');
    console.log(`   Total Pending Doctors: ${pendingDoctors.length}`);
    console.log(`   Awaiting Admin Approval to join clinics`);
    console.log(`   Admin should click "Approve" button in the panel`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingDoctors()
  .then(() => {
    console.log('✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
