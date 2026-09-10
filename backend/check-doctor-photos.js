const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoctorPhotos() {
  try {
    console.log('🔍 Checking doctor profile photos...\n');

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        approvalStatus: 'VERIFIED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            approvalStatus: true,
          },
        },
        doctorClinics: {
          where: {
            isActive: true,
            inviteStatus: 'ACCEPTED',
          },
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${doctors.length} verified doctors:\n`);

    doctors.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.user.name}`);
      console.log(`   User ID: ${doc.user.id}`);
      console.log(`   Profile ID: ${doc.id}`);
      console.log(`   Specialization: ${doc.specialization || 'Not set'}`);
      console.log(`   📸 profilePhotoUrl: ${doc.profilePhotoUrl || '❌ NOT SET'}`);
      console.log(`   📸 profileImage: ${doc.profileImage || '❌ NOT SET'}`);
      console.log(`   User approval: ${doc.user.approvalStatus}`);
      console.log(`   Profile approval: ${doc.approvalStatus}`);
      console.log(`   Verification status: ${doc.verificationStatus}`);
      
      if (doc.doctorClinics.length > 0) {
        console.log(`   🏥 Clinics:`);
        doc.doctorClinics.forEach(dc => {
          console.log(`      - ${dc.clinic.name} (${dc.inviteStatus})`);
        });
      } else {
        console.log(`   ⚠️  No clinic associations`);
      }
      console.log('');
    });

    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoctorPhotos();
