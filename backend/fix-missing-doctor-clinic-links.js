/**
 * Fix missing doctor-clinic relationships
 * This script finds verified doctors with invitations and creates missing DoctorClinic entries
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingLinks() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Fixing Missing Doctor-Clinic Relationships            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Find all VERIFIED doctor invitations
    console.log('1️⃣ Finding VERIFIED doctor invitations...');
    const verifiedInvitations = await prisma.doctorInvitation.findMany({
      where: {
        status: 'VERIFIED',
      },
      include: {
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`   Found ${verifiedInvitations.length} verified invitation(s)\n`);

    if (verifiedInvitations.length === 0) {
      console.log('❌ No verified invitations found. Nothing to fix.\n');
      return;
    }

    // 2. Check each invitation for missing DoctorClinic link
    console.log('2️⃣ Checking for missing DoctorClinic relationships...\n');
    const toFix = [];

    for (const inv of verifiedInvitations) {
      if (!inv.doctorProfile) {
        console.log(`   ⚠️  Invitation ${inv.id}: No doctor profile linked yet`);
        continue;
      }

      const existingLink = await prisma.doctorClinic.findUnique({
        where: {
          doctorId_clinicId: {
            doctorId: inv.doctorProfile.id,
            clinicId: inv.clinicId,
          },
        },
      });

      if (!existingLink) {
        console.log(`   ❌ MISSING: Doctor ${inv.doctorProfile.user.name} → Clinic ${inv.clinic.name}`);
        toFix.push(inv);
      } else {
        console.log(`   ✅ EXISTS: Doctor ${inv.doctorProfile.user.name} → Clinic ${inv.clinic.name}`);
      }
    }

    console.log(`\n   Total missing links: ${toFix.length}\n`);

    if (toFix.length === 0) {
      console.log('✅ All verified doctors are properly linked to clinics!\n');
      return;
    }

    // 3. Create missing DoctorClinic links
    console.log('3️⃣ Creating missing DoctorClinic relationships...\n');
    
    for (const inv of toFix) {
      try {
        const doctorClinic = await prisma.doctorClinic.create({
          data: {
            doctorId: inv.doctorProfile.id,
            clinicId: inv.clinicId,
            inviteStatus: 'ACCEPTED',
            roleAtClinic: inv.specialization || 'CONSULTANT',
            consultationFee: inv.doctorProfile.consultationFee,
            isActive: true,
            joinedAt: inv.acceptedAt || new Date(),
            adminVerifiedAt: inv.verifiedAt || new Date(),
            adminVerifiedById: inv.verifiedById,
          },
        });

        console.log(`   ✅ CREATED: ${inv.doctorProfile.user.name} → ${inv.clinic.name}`);
        console.log(`      DoctorClinic ID: ${doctorClinic.id}`);
        console.log(`      Invite Status: ${doctorClinic.inviteStatus}`);
        console.log(`      Is Active: ${doctorClinic.isActive}`);
        console.log();
      } catch (error) {
        console.error(`   ❌ FAILED to create link for ${inv.doctorProfile.user.name}:`, error.message);
      }
    }

    console.log('\n4️⃣ Verifying fixes...\n');
    
    for (const inv of toFix) {
      const link = await prisma.doctorClinic.findUnique({
        where: {
          doctorId_clinicId: {
            doctorId: inv.doctorProfile.id,
            clinicId: inv.clinicId,
          },
        },
      });

      if (link) {
        console.log(`   ✅ VERIFIED: ${inv.doctorProfile.user.name} is now linked to ${inv.clinic.name}`);
      } else {
        console.log(`   ❌ FAILED: ${inv.doctorProfile.user.name} is still not linked`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      FIX COMPLETED                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`Fixed ${toFix.length} missing doctor-clinic relationship(s)`);
    console.log('Doctors should now appear in clinic portal!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingLinks();
