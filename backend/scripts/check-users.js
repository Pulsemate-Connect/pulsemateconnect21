const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

if (!prisma || !prisma.users) {
  console.error('Prisma client not properly initialized');
  process.exit(1);
}

async function checkUsers() {
  try {
    console.log('\n=== CHECKING USERS ===\n');
    
    // Check patients
    const patients = await prisma.users.findMany({
      where: { role: 'PATIENT' },
      include: { patientProfile: true },
      take: 5
    });
    
    console.log(`Found ${patients.length} patient accounts:\n`);
    patients.forEach(p => {
      console.log(`- Name: ${p.name || 'N/A'}`);
      console.log(`  Mobile: ${p.mobile}`);
      console.log(`  Email: ${p.email || 'N/A'}`);
      console.log(`  Role: ${p.role}`);
      console.log(`  Has Profile: ${!!p.patientProfile}`);
      if (p.patientProfile) {
        console.log(`  Gender: ${p.patientProfile.gender || 'N/A'}`);
        console.log(`  Emergency Contact: ${p.patientProfile.emergencyContact || 'N/A'}`);
      }
      console.log('');
    });
    
    // Check the Sahil Naik user
    const sahil = await prisma.users.findFirst({
      where: { 
        OR: [
          { email: 'sahilnaik1515@gmail.com' },
          { name: { contains: 'Sahil' } }
        ]
      },
      include: { 
        adminProfile: true,
        patientProfile: true 
      }
    });
    
    if (sahil) {
      console.log('=== SAHIL NAIK USER ===\n');
      console.log(`Name: ${sahil.name}`);
      console.log(`Mobile: ${sahil.mobile}`);
      console.log(`Email: ${sahil.email}`);
      console.log(`Role: ${sahil.role}`);
      console.log(`Admin Profile: ${!!sahil.adminProfile}`);
      console.log(`Patient Profile: ${!!sahil.patientProfile}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
