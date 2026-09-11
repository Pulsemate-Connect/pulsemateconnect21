const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOwner() {
  try {
    const user = await prisma.user.findUnique({
      where: { mobile: '+919740809295' },
      include: {
        ownedClinics: true,
        doctorProfile: true,
      },
    });

    if (user) {
      console.log('✅ Found user with mobile +919740809295:');
      console.log('   User ID:', user.id);
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   Approval Status:', user.approvalStatus);
      console.log('   Active:', user.isActive);
      console.log('   Owned Clinics:', user.ownedClinics.length);
      console.log('   Has Doctor Profile:', !!user.doctorProfile);
      
      if (user.ownedClinics.length > 0) {
        console.log('\n   Clinics:');
        user.ownedClinics.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} (${c.approvalStatus})`);
        });
      }
    } else {
      console.log('❌ No user found with mobile +919740809295');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOwner();
