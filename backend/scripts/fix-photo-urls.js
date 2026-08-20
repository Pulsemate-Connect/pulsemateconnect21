/**
 * fix-photo-urls.js
 * Fix localhost URLs to use the correct IP address for mobile access
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔧 Fixing photo URLs for mobile access...\n');

  const doctors = await prisma.doctorProfile.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  for (const doctor of doctors) {
    let needsUpdate = false;
    let newPhotoUrl = doctor.profilePhotoUrl;
    let newImageUrl = doctor.profileImage;

    // Fix profilePhotoUrl
    if (newPhotoUrl && newPhotoUrl.includes('localhost')) {
      newPhotoUrl = newPhotoUrl.replace('http://localhost:5000', 'http://192.168.31.240:5000');
      needsUpdate = true;
    }

    // Fix profileImage
    if (newImageUrl && newImageUrl.includes('localhost')) {
      newImageUrl = newImageUrl.replace('http://localhost:5000', 'http://192.168.31.240:5000');
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: {
          profilePhotoUrl: newPhotoUrl,
          profileImage: newImageUrl,
        },
      });

      console.log(`✅ ${doctor.user.name}`);
      console.log(`   OLD: ${doctor.profilePhotoUrl}`);
      console.log(`   NEW: ${newPhotoUrl}`);
      console.log('');
    } else {
      console.log(`ℹ️  ${doctor.user.name} - No changes needed`);
      console.log(`   URL: ${newPhotoUrl || 'NONE'}`);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 PHOTO URLS FIXED!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n✅ All localhost URLs replaced with 192.168.31.240');
  console.log('✅ Photos will now be accessible from mobile devices');
  console.log('\n💡 Reload the mobile app to see the changes');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
