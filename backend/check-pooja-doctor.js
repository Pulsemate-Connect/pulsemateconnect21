const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPooja() {
  try {
    console.log('🔍 Investigating Pooja Naik...\n');

    // Find Pooja
    const pooja = await prisma.user.findFirst({
      where: { 
        OR: [
          { name: { contains: 'Pooja' } },
          { mobile: '+919769983363' },
        ]
      },
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

    if (!pooja) {
      console.log('❌ Pooja Naik not found in database!');
      console.log('   This means the data shown in admin panel is cached/stale.');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 POOJA NAIK - USER INFO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: ${pooja.name}`);
    console.log(`User ID: ${pooja.id}`);
    console.log(`Mobile: ${pooja.mobile}`);
    console.log(`Email: ${pooja.email || 'N/A'}`);
    console.log(`Role: ${pooja.role}`);
    console.log(`Primary Role: ${pooja.primaryRole}`);
    console.log(`Approval Status: ${pooja.approvalStatus}`);
    console.log(`Active: ${pooja.isActive}`);
    console.log(`Created: ${pooja.createdAt.toLocaleString()}`);
    console.log('');

    if (!pooja.doctorProfile) {
      console.log('❌ NO DOCTOR PROFILE FOUND!');
      console.log('   User exists but has no doctor profile.');
      console.log('   This person cannot function as a doctor.');
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍⚕️ DOCTOR PROFILE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Doctor Profile ID: ${pooja.doctorProfile.id}`);
    console.log(`Specialization: ${pooja.doctorProfile.specialization}`);
    console.log(`Approval Status: ${pooja.doctorProfile.approvalStatus}`);
    console.log(`Verification Status: ${pooja.doctorProfile.verificationStatus}`);
    console.log(`Profile Status: ${pooja.doctorProfile.profileStatus}`);
    console.log(`Marketplace Visible: ${pooja.doctorProfile.marketplaceVisible}`);
    console.log(`Consultation Fee: ${pooja.doctorProfile.consultationFee || 'Not set'}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 CLINIC ASSOCIATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Clinic Links: ${pooja.doctorProfile.doctorClinics.length}\n`);

    if (pooja.doctorProfile.doctorClinics.length === 0) {
      console.log('❌ NOT LINKED TO ANY CLINIC!');
      console.log('   This is why Pooja is not showing in clinic owner dashboards.');
      console.log('');
      console.log('   Possible Reasons:');
      console.log('   1. Admin approved but no invitation existed');
      console.log('   2. Invitation was rejected or expired');
      console.log('   3. Doctor self-registered without clinic invitation');
      console.log('');
    } else {
      pooja.doctorProfile.doctorClinics.forEach((dc, idx) => {
        console.log(`${idx + 1}. ${dc.clinic.name}`);
        console.log(`   Clinic ID: ${dc.clinicId}`);
        console.log(`   Link ID: ${dc.id}`);
        console.log(`   Invite Status: ${dc.inviteStatus}`);
        console.log(`   Active: ${dc.isActive}`);
        console.log(`   Role: ${dc.roleAtClinic}`);
        console.log(`   Joined: ${dc.joinedAt ? dc.joinedAt.toLocaleString() : 'N/A'}`);
        console.log('');
      });
    }

    // Check for invitations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 CHECKING FOR INVITATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const invitations = await prisma.doctorInvitation.findMany({
      where: {
        OR: [
          { doctorUserId: pooja.id },
          { doctorProfileId: pooja.doctorProfile.id },
          { doctorMobile: pooja.mobile },
          ...(pooja.email ? [{ doctorEmail: pooja.email }] : []),
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

    console.log(`Found ${invitations.length} invitation(s)\n`);

    if (invitations.length === 0) {
      console.log('❌ NO INVITATIONS FOUND!');
      console.log('   Pooja was NOT invited by any clinic.');
      console.log('   This is why they cannot be linked after approval.');
      console.log('');
      console.log('   SOLUTION:');
      console.log('   1. A clinic owner must invite Pooja');
      console.log('   2. Pooja must accept the invitation');
      console.log('   3. Admin must approve again');
      console.log('   OR');
      console.log('   4. Manually link Pooja to a specific clinic');
      console.log('');
    } else {
      invitations.forEach((inv, idx) => {
        console.log(`${idx + 1}. Invitation from: ${inv.clinic.name}`);
        console.log(`   Clinic Owner: ${inv.clinic.owner.name} (${inv.clinic.owner.mobile})`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Created: ${inv.createdAt.toLocaleString()}`);
        console.log(`   Accepted: ${inv.acceptedAt ? inv.acceptedAt.toLocaleString() : 'Not yet'}`);
        console.log(`   Verified: ${inv.verifiedAt ? inv.verifiedAt.toLocaleString() : 'Not yet'}`);
        console.log('');
      });
    }

    // Final diagnosis
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNOSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (pooja.approvalStatus === 'VERIFIED' && pooja.doctorProfile.approvalStatus === 'VERIFIED') {
      console.log('✅ Pooja is APPROVED by admin');
    } else {
      console.log('❌ Pooja is NOT approved (Status: ' + pooja.approvalStatus + ')');
    }

    if (pooja.doctorProfile.doctorClinics.length > 0) {
      console.log('✅ Pooja is linked to clinic(s)');
    } else {
      console.log('❌ Pooja is NOT linked to any clinic');
    }

    if (invitations.length > 0) {
      console.log('✅ Pooja has invitation(s)');
    } else {
      console.log('❌ Pooja has NO invitations');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPooja();
