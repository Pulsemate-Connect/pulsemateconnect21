/**
 * add-doctor-sample-photos.js
 * Add sample profile photo URLs to doctors for testing
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample avatar URLs from UI Avatars service
const SAMPLE_PHOTOS = {
  'priya.sharma@test.com': 'https://ui-avatars.com/api/?name=Priya+Sharma&size=200&background=8b5cf6&color=fff&bold=true',
  'amit.verma@test.com': 'https://ui-avatars.com/api/?name=Amit+Verma&size=200&background=3b82f6&color=fff&bold=true',
};

async function main() {
  console.log('\n📸 Adding sample profile photos to doctors...\n');

  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      email: { in: Object.keys(SAMPLE_PHOTOS) },
    },
    include: {
      doctorProfile: true,
    },
  });

  for (const doctor of doctors) {
    const photoUrl = SAMPLE_PHOTOS[doctor.email];
    
    await prisma.doctorProfile.update({
      where: { userId: doctor.id },
      data: {
        profilePhotoUrl: photoUrl,
        profileImage: photoUrl, // Also set old field for compatibility
      },
    });

    console.log(`✅ ${doctor.name}`);
    console.log(`   Photo URL: ${photoUrl}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 SAMPLE PHOTOS ADDED!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n✅ Profile photos are now available for all patients');
  console.log('✅ Photos will appear in:');
  console.log('   - Doctor search list');
  console.log('   - Doctor profile page');
  console.log('   - Appointment cards');
  console.log('\n💡 Note: These are placeholder avatars from UI Avatars');
  console.log('   Doctors can upload real photos from their profile page');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
