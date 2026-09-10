const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('All Doctors in System');
  console.log('============================================\n');

  const users = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: {
      doctorProfile: {
        include: {
          doctorClinics: {
            include: {
              clinic: {
                select: { name: true, id: true }
              }
            }
          }
        }
      }
    }
  });

  console.log(`Total doctors: ${users.length}\n`);

  users.forEach(u => {
    console.log(`Doctor: ${u.name}`);
    console.log(`  User ID: ${u.id}`);
    console.log(`  Approval Status: ${u.approvalStatus}`);
    console.log(`  Role: ${u.role}`);
    
    if (u.doctorProfile) {
      console.log(`  Profile ID: ${u.doctorProfile.id}`);
      console.log(`  Profile Approval: ${u.doctorProfile.approvalStatus}`);
      console.log(`  Marketplace Visible: ${u.doctorProfile.marketplaceVisible}`);
      console.log(`  Clinics: ${u.doctorProfile.doctorClinics?.length || 0}`);
      
      if (u.doctorProfile.doctorClinics?.length > 0) {
        u.doctorProfile.doctorClinics.forEach(dc => {
          console.log(`    → ${dc.clinic.name} (${dc.clinic.id})`);
          console.log(`       inviteStatus: ${dc.inviteStatus}, isActive: ${dc.isActive}`);
        });
      } else {
        console.log(`    ❌ NO CLINIC LINKS`);
      }
    } else {
      console.log(`  ❌ NO PROFILE`);
    }
    console.log();
  });

  // Check invitations
  console.log('============================================');
  console.log('All Doctor Invitations');
  console.log('============================================\n');

  const invitations = await prisma.doctorInvitation.findMany({
    include: {
      clinic: { select: { name: true, id: true } },
      doctorUser: { select: { name: true, id: true } },
      doctorProfile: { select: { id: true } }
    }
  });

  console.log(`Total invitations: ${invitations.length}\n`);

  invitations.forEach(inv => {
    console.log(`Invitation: ${inv.doctorName}`);
    console.log(`  Clinic: ${inv.clinic.name} (${inv.clinic.id})`);
    console.log(`  Status: ${inv.status}`);
    console.log(`  Doctor User: ${inv.doctorUser?.name || 'Not linked'}`);
    console.log(`  Doctor User ID: ${inv.doctorUserId || 'None'}`);
    console.log(`  Doctor Profile ID: ${inv.doctorProfileId || 'None'}`);
    console.log();
  });
}

main().finally(() => prisma.$disconnect());
