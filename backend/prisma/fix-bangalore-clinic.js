/**
 * Adds coordinates to the Bangalore Spine Clinic so it shows in nearby results.
 * Koramangala, Bangalore coordinates: 12.9352, 77.6245
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Fix Bangalore clinic - add Koramangala coordinates
  const r1 = await p.clinic.updateMany({
    where: {
      city: { contains: 'Bangalore', mode: 'insensitive' },
      OR: [{ latitude: null }, { longitude: null }],
    },
    data: { latitude: 12.9352, longitude: 77.6245 },
  });
  console.log(`Fixed ${r1.count} Bangalore clinic(s) with coordinates`);

  // Show all clinics now
  const all = await p.clinic.findMany({
    select: { id: true, name: true, city: true, latitude: true, longitude: true, approvalStatus: true, isActive: true }
  });
  console.log('\nAll clinics:');
  all.forEach(c => console.log(`  ${c.name} (${c.city}) lat:${c.latitude} lng:${c.longitude} | ${c.approvalStatus} active:${c.isActive}`));
}

main().catch(e => console.error(e.message)).finally(() => p.$disconnect());
