/**
 * check-doctor-names.js
 * Check doctor names and fix "Dr." prefix
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Checking doctor names...\n');

  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctorProfile: true },
  });

  for (const doctor of doctors) {
    console.log(`Name: "${doctor.name}"`);
    console.log(`   Email: ${doctor.email}`);
    console.log(`   Profile Photo URL: ${doctor.doctorProfile?.profilePhotoUrl || 'NONE'}`);
    console.log(`   Profile Image: ${doctor.doctorProfile?.profileImage || 'NONE'}`);
    
    // Fix duplicate "Dr." prefix
    if (doctor.name.startsWith('Dr. Dr.')) {
      const fixedName = doctor.name.replace('Dr. Dr. ', 'Dr. ');
      console.log(`   ⚠️  Fixing duplicate prefix: "${doctor.name}" → "${fixedName}"`);
      
      await prisma.user.update({
        where: { id: doctor.id },
        data: { name: fixedName },
      });
      console.log(`   ✅ Fixed!`);
    } else if (!doctor.name.startsWith('Dr.')) {
      console.log(`   ℹ️  Name doesn't start with "Dr." - this is fine`);
    } else {
      console.log(`   ✅ Name format is correct`);
    }
    console.log('');
  }

  console.log('✅ Done!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
