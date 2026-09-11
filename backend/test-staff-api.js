const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStaffAPI() {
  try {
    const painClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'Pain Clinic' } },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 TESTING /api/clinics/:id/staff ENDPOINT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Clinic ID: ${painClinic.id}`);
    console.log(`Clinic Name: ${painClinic.name}\n`);

    // Simulate the exact query the API uses
    console.log('STEP 1: Get direct staff from ClinicStaff table');
    const directStaff = await prisma.clinicStaff.findMany({
      where: { clinicId: painClinic.id, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
    console.log(`   Found ${directStaff.length} direct staff member(s)`);
    if (directStaff.length > 0) {
      directStaff.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.user.name} - ${s.role}`);
      });
    }
    console.log('');

    console.log('STEP 2: Get invited doctors from DoctorClinic table');
    const directStaffUserIds = new Set(directStaff.map((s) => s.user.id));
    
    const invitedDoctors = await prisma.doctorClinic.findMany({
      where: {
        clinicId: painClinic.id,
        inviteStatus: 'ACCEPTED',
        isActive: true,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    console.log(`   Found ${invitedDoctors.length} invited doctor(s)`);
    if (invitedDoctors.length > 0) {
      invitedDoctors.forEach((d, idx) => {
        console.log(`   ${idx + 1}. ${d.doctor.user.name} (${d.doctor.user.mobile})`);
        console.log(`      User ID: ${d.doctor.user.id}`);
        console.log(`      Is in directStaff: ${directStaffUserIds.has(d.doctor.user.id)}`);
      });
    }
    console.log('');

    console.log('STEP 3: Filter out duplicates');
    const invitedAsStaff = invitedDoctors
      .filter((dc) => !directStaffUserIds.has(dc.doctor?.user?.id))
      .map((dc) => ({
        id: `dc-${dc.id}`,
        clinicId: dc.clinicId,
        userId: dc.doctor.user.id,
        role: 'DOCTOR',
        isActive: dc.isActive,
        joinedAt: dc.joinedAt || dc.createdAt,
        user: dc.doctor.user,
      }));

    console.log(`   After filtering: ${invitedAsStaff.length} unique invited doctor(s)\n`);

    console.log('STEP 4: Combine results');
    const allStaff = [...directStaff, ...invitedAsStaff];
    console.log(`   Total staff: ${allStaff.length}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 FINAL RESULT (what API returns):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    allStaff.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.user.name}`);
      console.log(`   Role: ${s.role}`);
      console.log(`   Mobile: ${s.user.mobile}`);
      console.log(`   Active: ${s.isActive}`);
      console.log('');
    });

    if (allStaff.length === 0) {
      console.log('❌ API RETURNS EMPTY ARRAY!');
      console.log('This is why doctors are not showing in the frontend.\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStaffAPI();
