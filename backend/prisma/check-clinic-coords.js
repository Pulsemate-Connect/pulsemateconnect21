require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const clinics = await p.clinic.findMany({
    select: {
      id: true, name: true, city: true,
      latitude: true, longitude: true,
      approvalStatus: true, isVerified: true, isActive: true
    }
  });

  console.log('\nAll clinics:');
  clinics.forEach(c => {
    console.log(`  [${c.id}] ${c.name} (${c.city})`);
    console.log(`    lat: ${c.latitude}, lng: ${c.longitude}`);
    console.log(`    status: ${c.approvalStatus}, isVerified: ${c.isVerified}, isActive: ${c.isActive}`);
  });
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
