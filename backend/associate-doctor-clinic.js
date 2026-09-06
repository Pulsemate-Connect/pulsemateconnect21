/**
 * Associate Doctor with Clinic Script
 * 
 * Usage: node associate-doctor-clinic.js
 * 
 * This script:
 * 1. Lists all doctors and clinics
 * 2. Associates a doctor with a clinic
 * 3. Creates ClinicStaff record with isActive = true
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Associate Doctor with Clinic ===\n');

  // 1. List all doctors
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: {
      doctorProfile: true,
      clinicStaff: {
        include: {
          clinic: true
        }
      }
    }
  });

  console.log('📋 Available Doctors:');
  if (doctors.length === 0) {
    console.log('  ❌ No doctors found!');
    return;
  }

  doctors.forEach((doc, idx) => {
    const profile = doc.doctorProfile;
    const associations = doc.clinicStaff.filter(cs => cs.isActive);
    console.log(`  ${idx + 1}. ${doc.name} (${doc.mobile})`);
    console.log(`     - Specialization: ${profile?.specialization || 'Not set'}`);
    console.log(`     - Active Clinics: ${associations.length}`);
    if (associations.length > 0) {
      associations.forEach(a => {
        console.log(`       • ${a.clinic.name}`);
      });
    }
  });

  // 2. List all clinics
  const clinics = await prisma.clinic.findMany({
    where: { approvalStatus: 'VERIFIED' },
    include: {
      owner: true,
      _count: {
        select: {
          staff: true
        }
      }
    }
  });

  console.log('\n🏥 Available Clinics:');
  if (clinics.length === 0) {
    console.log('  ❌ No verified clinics found!');
    return;
  }

  clinics.forEach((clinic, idx) => {
    console.log(`  ${idx + 1}. ${clinic.name} (Owner: ${clinic.owner?.name})`);
    console.log(`     - Address: ${clinic.city}, ${clinic.state}`);
    console.log(`     - Staff Count: ${clinic._count.staff}`);
  });

  // 3. Associate first doctor with first clinic (for quick testing)
  const doctor = doctors[0];
  const clinic = clinics[0];

  console.log(`\n🔗 Associating Doctor with Clinic...`);
  console.log(`   Doctor: ${doctor.name}`);
  console.log(`   Clinic: ${clinic.name}`);

  // Check if already associated
  const existing = await prisma.clinicStaff.findFirst({
    where: {
      userId: doctor.id,
      clinicId: clinic.id
    }
  });

  if (existing) {
    if (existing.isActive) {
      console.log(`\n✅ Doctor is already associated with this clinic (Active)`);
    } else {
      // Activate existing association
      await prisma.clinicStaff.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
      console.log(`\n✅ Activated existing association`);
    }
  } else {
    // Create new association
    await prisma.clinicStaff.create({
      data: {
        userId: doctor.id,
        clinicId: clinic.id,
        role: 'DOCTOR',
        isActive: true
      }
    });
    console.log(`\n✅ Created new association`);
  }

  // Verify association
  const verified = await prisma.clinicStaff.findFirst({
    where: {
      userId: doctor.id,
      clinicId: clinic.id,
      isActive: true
    },
    include: {
      clinic: true,
      user: true
    }
  });

  if (verified) {
    console.log(`\n✅ SUCCESS! Doctor is now associated with clinic:`);
    console.log(`   • Doctor: ${verified.user.name} (${verified.user.mobile})`);
    console.log(`   • Clinic: ${verified.clinic.name}`);
    console.log(`   • Status: ${verified.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`\n👉 The doctor can now:`);
    console.log(`   1. Set their availability schedule`);
    console.log(`   2. View appointments`);
    console.log(`   3. Manage queue`);
  }

  console.log('\n=== Done! ===\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
