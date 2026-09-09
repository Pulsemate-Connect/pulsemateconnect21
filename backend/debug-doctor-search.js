const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Debug Doctor Search Query');
  console.log('============================================\n');

  // This is the exact query from searchDoctors controller
  const verifiedClinicFilter = {
    some: {
      isActive: true,
      inviteStatus: 'ACCEPTED',
      clinic: { approvalStatus: 'VERIFIED', isActive: true },
    },
  };

  const where = {
    approvalStatus: 'VERIFIED',
    marketplaceVisible: true,
    user: { isActive: true, role: 'DOCTOR' },
    doctorClinics: verifiedClinicFilter,
  };

  console.log('Search Query:');
  console.log(JSON.stringify(where, null, 2));
  console.log();

  const doctors = await prisma.doctorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, mobile: true, role: true, isActive: true, approvalStatus: true } },
      doctorClinics: {
        where: {
          isActive: true,
          inviteStatus: 'ACCEPTED',
          clinic: { approvalStatus: 'VERIFIED', isActive: true },
        },
        include: {
          clinic: {
            select: {
              id: true, name: true, city: true, approvalStatus: true, isActive: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${doctors.length} doctor(s)\n`);

  if (doctors.length === 0) {
    console.log('❌ No doctors found. Checking each condition...\n');

    // Check all doctors with approvalStatus
    const allApproved = await prisma.doctorProfile.findMany({
      where: { approvalStatus: 'VERIFIED' },
      select: { id: true, user: { select: { name: true } }, marketplaceVisible: true }
    });
    console.log(`Doctors with approvalStatus='VERIFIED': ${allApproved.length}`);
    allApproved.forEach(d => console.log(`  - ${d.user.name}: marketplaceVisible=${d.marketplaceVisible}`));
    console.log();

    // Check doctors with marketplace visible
    const marketplace = await prisma.doctorProfile.findMany({
      where: { marketplaceVisible: true },
      select: { id: true, user: { select: { name: true } } }
    });
    console.log(`Doctors with marketplaceVisible=true: ${marketplace.length}`);
    marketplace.forEach(d => console.log(`  - ${d.user.name}`));
    console.log();

    // Check doctors with verified user
    const verifiedUsers = await prisma.doctorProfile.findMany({
      where: { 
        user: { isActive: true, role: 'DOCTOR', approvalStatus: 'VERIFIED' }
      },
      select: { id: true, user: { select: { name: true, role: true, approvalStatus: true, isActive: true } } }
    });
    console.log(`Doctors with verified active user: ${verifiedUsers.length}`);
    verifiedUsers.forEach(d => console.log(`  - ${d.user.name}: role=${d.user.role}, approvalStatus=${d.user.approvalStatus}, isActive=${d.user.isActive}`));
    console.log();

    // Check doctors with clinic links
    const withClinics = await prisma.doctorProfile.findMany({
      where: {
        doctorClinics: {
          some: {
            isActive: true,
            inviteStatus: 'ACCEPTED',
          },
        },
      },
      include: {
        user: { select: { name: true } },
        doctorClinics: {
          where: { isActive: true, inviteStatus: 'ACCEPTED' },
          include: { clinic: { select: { name: true, approvalStatus: true, isActive: true } } }
        }
      }
    });
    console.log(`Doctors with active ACCEPTED clinic links: ${withClinics.length}`);
    withClinics.forEach(d => {
      console.log(`  - ${d.user.name}:`);
      d.doctorClinics.forEach(dc => {
        console.log(`      ${dc.clinic.name}: approvalStatus=${dc.clinic.approvalStatus}, isActive=${dc.clinic.isActive}`);
      });
    });
    console.log();

    // Now check ALL conditions together but log which fails
    const drArjun = await prisma.doctorProfile.findUnique({
      where: { id: 'fd03af76-a64d-4843-9a0d-c45fe5212863' },
      include: {
        user: true,
        doctorClinics: {
          include: { clinic: true }
        }
      }
    });

    console.log('Dr Arjun detailed check:');
    console.log(`  ✅ Found in database`);
    console.log(`  ${drArjun.approvalStatus === 'VERIFIED' ? '✅' : '❌'} approvalStatus: ${drArjun.approvalStatus}`);
    console.log(`  ${drArjun.marketplaceVisible ? '✅' : '❌'} marketplaceVisible: ${drArjun.marketplaceVisible}`);
    console.log(`  ${drArjun.user.isActive ? '✅' : '❌'} user.isActive: ${drArjun.user.isActive}`);
    console.log(`  ${drArjun.user.role === 'DOCTOR' ? '✅' : '❌'} user.role: ${drArjun.user.role}`);
    console.log(`  ${drArjun.user.approvalStatus === 'VERIFIED' ? '✅' : '❌'} user.approvalStatus: ${drArjun.user.approvalStatus}`);
    console.log();
    console.log('  doctorClinics:');
    drArjun.doctorClinics.forEach(dc => {
      console.log(`    Clinic: ${dc.clinic.name}`);
      console.log(`      ${dc.isActive ? '✅' : '❌'} isActive: ${dc.isActive}`);
      console.log(`      ${dc.inviteStatus === 'ACCEPTED' ? '✅' : '❌'} inviteStatus: ${dc.inviteStatus}`);
      console.log(`      ${dc.clinic.approvalStatus === 'VERIFIED' ? '✅' : '❌'} clinic.approvalStatus: ${dc.clinic.approvalStatus}`);
      console.log(`      ${dc.clinic.isActive ? '✅' : '❌'} clinic.isActive: ${dc.clinic.isActive}`);
    });
  } else {
    console.log('✅ Doctors found:');
    doctors.forEach((d, i) => {
      console.log(`${i + 1}. ${d.user.name}`);
      console.log(`   Clinics: ${d.doctorClinics.length}`);
      d.doctorClinics.forEach(dc => {
        console.log(`     - ${dc.clinic.name} (${dc.clinic.city})`);
      });
    });
  }
}

main().finally(() => prisma.$disconnect());
