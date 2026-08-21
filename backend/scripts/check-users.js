const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n=== CHECKING ALL CLINIC_OWNER USERS ===\n');
  
  const users = await prisma.user.findMany({
    where: { role: 'CLINIC_OWNER' },
    include: {
      patientProfile: true,
      ownedClinics: true,
      clinicOwnerProfile: true,
    },
  });

  console.log(`Found ${users.length} CLINIC_OWNER users:\n`);

  users.forEach((u, i) => {
    console.log(`${i + 1}. Mobile: ${u.mobile}`);
    console.log(`   Name: ${u.name || 'null'}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   Approval Status: ${u.approvalStatus}`);
    console.log(`   Has PatientProfile: ${!!u.patientProfile}`);
    console.log(`   Has OwnerProfile: ${!!u.clinicOwnerProfile}`);
    console.log(`   Owns Clinics: ${u.ownedClinics?.length || 0}`);
    console.log(`   Auth Provider: ${u.authProvider || 'none'}`);
    console.log(`   Created: ${u.createdAt.toISOString().split('T')[0]}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
