require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        approvalStatus: true,
        isVerified: true,
        isActive: true,
        owner: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total Clinics: ${clinics.length}\n`);
    
    if (clinics.length === 0) {
      console.log('No clinics found in database.');
    } else {
      clinics.forEach((clinic, idx) => {
        console.log(`${idx + 1}. ${clinic.name}`);
        console.log(`   Owner: ${clinic.owner.name} (${clinic.owner.email})`);
        console.log(`   Status: ${clinic.approvalStatus}`);
        console.log(`   Verified: ${clinic.isVerified}`);
        console.log(`   Active: ${clinic.isActive}`);
        console.log('');
      });
    }

    // Count by status
    const verified = clinics.filter(c => c.isVerified).length;
    const pending = clinics.filter(c => c.approvalStatus === 'PENDING').length;
    
    console.log(`Summary:`);
    console.log(`  Verified: ${verified}`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Total: ${clinics.length}`);

    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
