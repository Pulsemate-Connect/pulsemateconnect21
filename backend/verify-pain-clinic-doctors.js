const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const painClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'Pain Clinic' } },
      include: {
        owner: true,
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏥 PAIN CLINIC INFO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Clinic ID: ${painClinic.id}`);
    console.log(`Clinic Name: ${painClinic.name}`);
    console.log(`Owner ID: ${painClinic.ownerId}`);
    console.log(`Owner Name: ${painClinic.owner.name}`);
    console.log(`Owner Mobile: ${painClinic.owner.mobile}`);
    console.log('');

    const doctors = await prisma.doctorClinic.findMany({
      where: { clinicId: painClinic.id },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍⚕️ DOCTORS LINKED TO PAIN CLINIC');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total: ${doctors.length}\n`);

    if (doctors.length === 0) {
      console.log('❌ NO DOCTORS FOUND!');
    } else {
      doctors.forEach((d, idx) => {
        console.log(`${idx + 1}. ${d.doctor.user.name}`);
        console.log(`   Mobile: ${d.doctor.user.mobile}`);
        console.log(`   Doctor Profile ID: ${d.doctorId}`);
        console.log(`   User ID: ${d.doctor.userId}`);
        console.log(`   Link ID: ${d.id}`);
        console.log(`   inviteStatus: ${d.inviteStatus}`);
        console.log(`   isActive: ${d.isActive}`);
        console.log(`   User Approval: ${d.doctor.user.approvalStatus}`);
        console.log(`   Profile Verification: ${d.doctor.verificationStatus}`);
        console.log(`   Joined At: ${d.joinedAt ? d.joinedAt.toLocaleString() : 'N/A'}`);
        console.log('');
      });
    }

    // Test the exact query the API uses
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 TESTING API QUERY (status=ACTIVE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const apiQuery = {
      clinicId: painClinic.id,
      isActive: true,
      inviteStatus: 'ACCEPTED',
    };

    console.log('Query:', JSON.stringify(apiQuery, null, 2));
    console.log('');

    const apiResult = await prisma.doctorClinic.findMany({
      where: apiQuery,
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                approvalStatus: true,
              },
            },
          },
        },
      },
    });

    console.log(`API Query Result: ${apiResult.length} doctor(s)\n`);

    if (apiResult.length === 0) {
      console.log('❌ API QUERY RETURNS EMPTY!');
      console.log('This is why doctors are not showing in the clinic dashboard.');
    } else {
      apiResult.forEach((d, idx) => {
        console.log(`${idx + 1}. ${d.doctor.user.name} (${d.doctor.user.mobile})`);
        console.log(`   Status: ${d.inviteStatus}, Active: ${d.isActive}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
