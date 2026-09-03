require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Simulates creating 2 test clinics via API workflow
 * This mimics what the UI would do through API calls
 */

async function createTestClinics() {
  console.log('🏥 Creating 2 TEST CLINICS via API Simulation\n');
  console.log('This simulates the complete UI workflow:\n');
  console.log('  1. Register clinic owner');
  console.log('  2. Create clinic');
  console.log('  3. Submit for approval');
  console.log('  4. Admin approval\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get admin for approvals
  const admin = await prisma.user.findUnique({
    where: { email: 'sahilnaik1515@gmail.com' }
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  // ============================================================
  // CLINIC 01: PulseMate Test Clinic 01
  // ============================================================
  console.log('🏥 Creating CLINIC 01: PulseMate Test Clinic 01\n');

  // Step 1: Register Clinic Owner 01
  console.log('Step 1: Registering clinic owner...');
  const passwordHash = await bcrypt.hash('Test@123456', 12);
  
  const owner01 = await prisma.user.upsert({
    where: { email: 'testclinicowner01@pulsemate.test' },
    update: {},
    create: {
      name: 'Test Clinic Owner 01',
      mobile: '+919900001001',
      email: 'testclinicowner01@pulsemate.test',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
    }
  });
  console.log(`✅ Clinic Owner 01 registered: ${owner01.email}\n`);

  // Step 2: Create Clinic (simulates onboarding completion)
  console.log('Step 2: Creating clinic (onboarding)...');
  const clinic01 = await prisma.clinic.upsert({
    where: { id: 'manual-test-clinic-01' },
    update: {},
    create: {
      id: 'manual-test-clinic-01',
      name: 'PulseMate Test Clinic 01',
      ownerId: owner01.id,
      phone: '+918800001001',
      alternateEmail: 'clinic01@pulsemate.test',
      address: 'Test Address 01, Test Street, Near Test Park',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      openingTime: '09:00',
      closingTime: '18:00',
      openingHours: 'Mon-Sat 09:00-18:00',
      specialties: ['General Medicine', 'Cardiology'],
      description: 'TEST CLINIC - PulseMate Test Clinic 01 for comprehensive healthcare services',
      clinicLicenseDocument: 'https://example.com/test/license-01.pdf',
      approvalStatus: 'PENDING',
      isVerified: false,
      isActive: false,
      submittedAt: new Date(),
    }
  });
  console.log(`✅ Clinic created: ${clinic01.name}`);
  console.log(`   Status: ${clinic01.approvalStatus}`);
  console.log(`   ID: ${clinic01.id}\n`);

  // Step 3: Admin Approval
  console.log('Step 3: Admin approving clinic...');
  const approvedClinic01 = await prisma.clinic.update({
    where: { id: clinic01.id },
    data: {
      approvalStatus: 'VERIFIED',
      isVerified: true,
      isActive: true,
      verifiedById: admin.id,
      verifiedAt: new Date(),
    }
  });
  console.log(`✅ Clinic APPROVED by admin`);
  console.log(`   Status: ${approvedClinic01.approvalStatus}`);
  console.log(`   Verified: ${approvedClinic01.isVerified}`);
  console.log(`   Active: ${approvedClinic01.isActive}\n`);

  // Add owner to clinic staff
  await prisma.clinicStaff.upsert({
    where: {
      clinicId_userId: {
        clinicId: clinic01.id,
        userId: owner01.id
      }
    },
    update: {},
    create: {
      clinicId: clinic01.id,
      userId: owner01.id,
      role: 'OWNER',
    }
  });

  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================================
  // CLINIC 02: PulseMate Test Clinic 02
  // ============================================================
  console.log('🏥 Creating CLINIC 02: PulseMate Test Clinic 02\n');

  // Step 1: Register Clinic Owner 02
  console.log('Step 1: Registering clinic owner...');
  const owner02 = await prisma.user.upsert({
    where: { email: 'testclinicowner02@pulsemate.test' },
    update: {},
    create: {
      name: 'Test Clinic Owner 02',
      mobile: '+919900001002',
      email: 'testclinicowner02@pulsemate.test',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
    }
  });
  console.log(`✅ Clinic Owner 02 registered: ${owner02.email}\n`);

  // Step 2: Create Clinic
  console.log('Step 2: Creating clinic (onboarding)...');
  const clinic02 = await prisma.clinic.upsert({
    where: { id: 'manual-test-clinic-02' },
    update: {},
    create: {
      id: 'manual-test-clinic-02',
      name: 'PulseMate Test Clinic 02',
      ownerId: owner02.id,
      phone: '+918800001002',
      alternateEmail: 'clinic02@pulsemate.test',
      address: 'Test Address 02, Test Road, Near Test Square',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      latitude: 19.0760,
      longitude: 72.8777,
      openingTime: '08:00',
      closingTime: '20:00',
      openingHours: 'Mon-Sun 08:00-20:00',
      specialties: ['Pediatrics', 'Dermatology', 'General Medicine'],
      description: 'TEST CLINIC - PulseMate Test Clinic 02 for family healthcare',
      clinicLicenseDocument: 'https://example.com/test/license-02.pdf',
      approvalStatus: 'PENDING',
      isVerified: false,
      isActive: false,
      submittedAt: new Date(),
    }
  });
  console.log(`✅ Clinic created: ${clinic02.name}`);
  console.log(`   Status: ${clinic02.approvalStatus}`);
  console.log(`   ID: ${clinic02.id}\n`);

  // Step 3: Admin Approval
  console.log('Step 3: Admin approving clinic...');
  const approvedClinic02 = await prisma.clinic.update({
    where: { id: clinic02.id },
    data: {
      approvalStatus: 'VERIFIED',
      isVerified: true,
      isActive: true,
      verifiedById: admin.id,
      verifiedAt: new Date(),
    }
  });
  console.log(`✅ Clinic APPROVED by admin`);
  console.log(`   Status: ${approvedClinic02.approvalStatus}`);
  console.log(`   Verified: ${approvedClinic02.isVerified}`);
  console.log(`   Active: ${approvedClinic02.isActive}\n`);

  // Add owner to clinic staff
  await prisma.clinicStaff.upsert({
    where: {
      clinicId_userId: {
        clinicId: clinic02.id,
        userId: owner02.id
      }
    },
    update: {},
    create: {
      clinicId: clinic02.id,
      userId: owner02.id,
      role: 'OWNER',
    }
  });

  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================================
  // VERIFICATION
  // ============================================================
  console.log('📊 VERIFICATION\n');

  const allClinics = await prisma.clinic.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      approvalStatus: true,
      isVerified: true,
      isActive: true,
      owner: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total Clinics in Database: ${allClinics.length}\n`);

  const newClinics = allClinics.filter(c => 
    c.name === 'PulseMate Test Clinic 01' || c.name === 'PulseMate Test Clinic 02'
  );

  console.log('Newly Created Clinics:\n');
  newClinics.forEach((clinic, idx) => {
    console.log(`${idx + 1}. ${clinic.name} (${clinic.city})`);
    console.log(`   Owner: ${clinic.owner.name} (${clinic.owner.email})`);
    console.log(`   Status: ${clinic.approvalStatus}`);
    console.log(`   Verified: ${clinic.isVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Active: ${clinic.isActive ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ TEST CLINICS CREATED SUCCESSFULLY VIA API\n');

  console.log('Summary:');
  console.log(`  ✅ Clinic 01: PulseMate Test Clinic 01 (Bangalore)`);
  console.log(`  ✅ Clinic 02: PulseMate Test Clinic 02 (Mumbai)`);
  console.log(`  ✅ Both clinics VERIFIED and ACTIVE`);
  console.log(`  ✅ Owner relationships established`);
  console.log(`  ✅ Staff assignments complete\n`);

  console.log('Test Credentials:');
  console.log('  Owner 01: testclinicowner01@pulsemate.test / Test@123456');
  console.log('  Owner 02: testclinicowner02@pulsemate.test / Test@123456');
  console.log('');
}

createTestClinics()
  .catch((error) => {
    console.error('❌ Error creating test clinics:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
