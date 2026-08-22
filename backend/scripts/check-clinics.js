const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClinics() {
  try {
    console.log('=== CHECKING ALL CLINICS ===\n');
    
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        ownerId: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Found ${clinics.length} clinics:\n`);
    
    clinics.forEach((clinic, index) => {
      console.log(`${index + 1}. Clinic: ${clinic.name || 'NO NAME'}`);
      console.log(`   ID: ${clinic.id}`);
      console.log(`   Owner ID: ${clinic.ownerId}`);
      console.log(`   Phone: ${clinic.phone || 'NO PHONE'}`);
      console.log(`   Status: ${clinic.approvalStatus}`);
      console.log(`   Created: ${clinic.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClinics();
