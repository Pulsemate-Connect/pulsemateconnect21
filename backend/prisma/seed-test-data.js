require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Safe Test Data Creation for PulseMate Connect
 * 
 * Creates:
 * - 3 TEST clinics (clearly marked)
 * - 7 TEST doctors (linked to clinics)
 * - 3 TEST receptionists (linked to clinics)
 * 
 * DOES NOT delete existing data!
 * DOES NOT affect RBAC tables!
 */

async function main() {
  console.log('🧪 Creating TEST data for PulseMate Connect...\n');

  // Test password for all test accounts
  const testPassword = 'Test@123456';
  const passwordHash = await bcrypt.hash(testPassword, 12);

  // Get existing admin for approval references
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!existingAdmin) {
    throw new Error('No SUPER_ADMIN found. Cannot create test data without admin for approvals.');
  }

  console.log(`✅ Found existing admin: ${existingAdmin.email}\n`);

  // ========================================
  // 1. CREATE 3 TEST CLINIC OWNERS
  // ========================================
  console.log('📋 Creating 3 TEST clinic owners...');

  const testOwner1 = await prisma.user.upsert({
    where: { email: 'test-owner-1@pulsemate.test' },
    update: {},
    create: {
      name: 'TEST Owner 1',
      mobile: '+919900000001',
      email: 'test-owner-1@pulsemate.test',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });

  const testOwner2 = await prisma.user.upsert({
    where: { email: 'test-owner-2@pulsemate.test' },
    update: {},
    create: {
      name: 'TEST Owner 2',
      mobile: '+919900000002',
      email: 'test-owner-2@pulsemate.test',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });

  const testOwner3 = await prisma.user.upsert({
    where: { email: 'test-owner-3@pulsemate.test' },
    update: {},
    create: {
      name: 'TEST Owner 3',
      mobile: '+919900000003',
      email: 'test-owner-3@pulsemate.test',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Created 3 TEST clinic owners\n');

  // ========================================
  // 2. CREATE 3 TEST CLINICS
  // ========================================
  console.log('🏥 Creating 3 TEST clinics...');

  const testClinic1 = await prisma.clinic.upsert({
    where: { id: 'test-clinic-1' },
    update: {},
    create: {
      id: 'test-clinic-1',
      name: 'TEST - City Hospital',
      ownerId: testOwner1.id,
      phone: '+918800000001',
      alternateEmail: 'city-hospital@test.pulsemate.com',
      address: 'TEST - 123 MG Road, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      isVerified: true,
      isActive: true,
      approvalStatus: 'VERIFIED',
      verifiedById: existingAdmin.id,
      verifiedAt: new Date(),
      openingTime: '09:00',
      closingTime: '20:00',
      openingHours: 'Mon-Sat 09:00-20:00',
      clinicLicenseDocument: 'https://example.com/test/license1.pdf',
      specialties: ['General Medicine', 'Cardiology'],
      description: 'TEST CLINIC - City Hospital for general healthcare',
    },
  });

  const testClinic2 = await prisma.clinic.upsert({
    where: { id: 'test-clinic-2' },
    update: {},
    create: {
      id: 'test-clinic-2',
      name: 'TEST - Health Center',
      ownerId: testOwner2.id,
      phone: '+918800000002',
      alternateEmail: 'health-center@test.pulsemate.com',
      address: 'TEST - 456 Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      isVerified: true,
      isActive: true,
      approvalStatus: 'VERIFIED',
      verifiedById: existingAdmin.id,
      verifiedAt: new Date(),
      openingTime: '08:00',
      closingTime: '21:00',
      openingHours: 'Mon-Sun 08:00-21:00',
      clinicLicenseDocument: 'https://example.com/test/license2.pdf',
      specialties: ['Pediatrics', 'Dermatology'],
      description: 'TEST CLINIC - Health Center for family healthcare',
    },
  });

  const testClinic3 = await prisma.clinic.upsert({
    where: { id: 'test-clinic-3' },
    update: {},
    create: {
      id: 'test-clinic-3',
      name: 'TEST - Medical Clinic',
      ownerId: testOwner3.id,
      phone: '+918800000003',
      alternateEmail: 'medical-clinic@test.pulsemate.com',
      address: 'TEST - 789 Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6315,
      longitude: 77.2167,
      isVerified: true,
      isActive: true,
      approvalStatus: 'VERIFIED',
      verifiedById: existingAdmin.id,
      verifiedAt: new Date(),
      openingTime: '10:00',
      closingTime: '19:00',
      openingHours: 'Mon-Sat 10:00-19:00',
      clinicLicenseDocument: 'https://example.com/test/license3.pdf',
      specialties: ['Orthopedics', 'ENT', 'Ophthalmology'],
      description: 'TEST CLINIC - Multi-specialty medical clinic',
    },
  });

  console.log('✅ Created 3 TEST clinics\n');

  // ========================================
  // 3. CREATE 7 TEST DOCTORS
  // ========================================
  console.log('👨‍⚕️ Creating 7 TEST doctors...');

  const doctors = [
    // Clinic 1: City Hospital - 2 doctors
    {
      name: 'Dr. Test Kumar',
      mobile: '+919900000011',
      email: 'test-dr-kumar@pulsemate.test',
      specialization: 'Cardiology',
      qualification: 'MD (Cardiology)',
      experienceYears: 10,
      fee: 800,
      clinic: testClinic1.id,
      licenseNumber: 'TEST-LIC-001',
    },
    {
      name: 'Dr. Test Sharma',
      mobile: '+919900000012',
      email: 'test-dr-sharma@pulsemate.test',
      specialization: 'General Medicine',
      qualification: 'MBBS, MD (Internal Medicine)',
      experienceYears: 8,
      fee: 600,
      clinic: testClinic1.id,
      licenseNumber: 'TEST-LIC-002',
    },
    // Clinic 2: Health Center - 2 doctors
    {
      name: 'Dr. Test Patel',
      mobile: '+919900000013',
      email: 'test-dr-patel@pulsemate.test',
      specialization: 'Pediatrics',
      qualification: 'MBBS, DCH',
      experienceYears: 12,
      fee: 700,
      clinic: testClinic2.id,
      licenseNumber: 'TEST-LIC-003',
    },
    {
      name: 'Dr. Test Singh',
      mobile: '+919900000014',
      email: 'test-dr-singh@pulsemate.test',
      specialization: 'Dermatology',
      qualification: 'MBBS, MD (Dermatology)',
      experienceYears: 6,
      fee: 750,
      clinic: testClinic2.id,
      licenseNumber: 'TEST-LIC-004',
    },
    // Clinic 3: Medical Clinic - 3 doctors
    {
      name: 'Dr. Test Reddy',
      mobile: '+919900000015',
      email: 'test-dr-reddy@pulsemate.test',
      specialization: 'Orthopedics',
      qualification: 'MBBS, MS (Orthopedics)',
      experienceYears: 15,
      fee: 900,
      clinic: testClinic3.id,
      licenseNumber: 'TEST-LIC-005',
    },
    {
      name: 'Dr. Test Gupta',
      mobile: '+919900000016',
      email: 'test-dr-gupta@pulsemate.test',
      specialization: 'ENT',
      qualification: 'MBBS, MS (ENT)',
      experienceYears: 9,
      fee: 650,
      clinic: testClinic3.id,
      licenseNumber: 'TEST-LIC-006',
    },
    {
      name: 'Dr. Test Rao',
      mobile: '+919900000017',
      email: 'test-dr-rao@pulsemate.test',
      specialization: 'Ophthalmology',
      qualification: 'MBBS, MS (Ophthalmology)',
      experienceYears: 11,
      fee: 800,
      clinic: testClinic3.id,
      licenseNumber: 'TEST-LIC-007',
    },
  ];

  const createdDoctors = [];

  for (const doc of doctors) {
    const doctorUser = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        name: doc.name,
        mobile: doc.mobile,
        email: doc.email,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        passwordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        doctorProfile: {
          create: {
            approvalStatus: 'VERIFIED',
            qualification: doc.qualification,
            specialization: doc.specialization,
            experienceYears: doc.experienceYears,
            education: doc.qualification,
            consultationFee: doc.fee,
            onlineAvailable: true,
            offlineAvailable: true,
            bio: `TEST DOCTOR - ${doc.specialization} specialist with ${doc.experienceYears} years of experience.`,
            avgConsultationMins: 20,
            medicalRegistrationNumber: doc.licenseNumber,
            certificates: [`https://example.com/test/certificates/${doc.licenseNumber}.pdf`],
            languagesKnown: ['English', 'Hindi'],
            marketplaceVisible: true,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });

    createdDoctors.push({ user: doctorUser, clinicId: doc.clinic, fee: doc.fee });
  }

  console.log('✅ Created 7 TEST doctors\n');

  // ========================================
  // 4. LINK DOCTORS TO CLINICS
  // ========================================
  console.log('🔗 Linking doctors to clinics...');

  for (const { user, clinicId, fee } of createdDoctors) {
    // Check if DoctorClinic link already exists
    const existingLink = await prisma.doctorClinic.findFirst({
      where: {
        doctorId: user.doctorProfile.id,
        clinicId: clinicId,
      },
    });

    if (!existingLink) {
      await prisma.doctorClinic.create({
        data: {
          doctorId: user.doctorProfile.id,
          clinicId: clinicId,
          inviteStatus: 'ACCEPTED',
          consultationFee: fee,
          availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: '09:00',
          endTime: '18:00',
          avgConsultationMins: 20,
          joinedAt: new Date(),
        },
      });
    }

    // Add to clinic staff
    const existingStaff = await prisma.clinicStaff.findFirst({
      where: {
        clinicId: clinicId,
        userId: user.id,
      },
    });

    if (!existingStaff) {
      await prisma.clinicStaff.create({
        data: {
          clinicId: clinicId,
          userId: user.id,
          role: 'DOCTOR',
        },
      });
    }
  }

  console.log('✅ Linked all doctors to clinics\n');

  // ========================================
  // 5. CREATE 3 TEST RECEPTIONISTS
  // ========================================
  console.log('👤 Creating 3 TEST receptionists...');

  const receptionists = [
    {
      name: 'TEST Receptionist 1',
      mobile: '+919900000021',
      email: 'test-receptionist-1@pulsemate.test',
      clinic: testClinic1.id,
      owner: testOwner1.id,
    },
    {
      name: 'TEST Receptionist 2',
      mobile: '+919900000022',
      email: 'test-receptionist-2@pulsemate.test',
      clinic: testClinic2.id,
      owner: testOwner2.id,
    },
    {
      name: 'TEST Receptionist 3',
      mobile: '+919900000023',
      email: 'test-receptionist-3@pulsemate.test',
      clinic: testClinic3.id,
      owner: testOwner3.id,
    },
  ];

  for (const rec of receptionists) {
    const receptionistUser = await prisma.user.upsert({
      where: { email: rec.email },
      update: {},
      create: {
        name: rec.name,
        mobile: rec.mobile,
        email: rec.email,
        role: 'RECEPTIONIST',
        approvalStatus: 'VERIFIED',
        passwordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        receptionistProfile: {
          create: {
            assignedClinicId: rec.clinic,
            createdByOwnerId: rec.owner,
          },
        },
      },
      include: {
        receptionistProfile: true,
      },
    });

    // Add to clinic staff
    const existingStaff = await prisma.clinicStaff.findFirst({
      where: {
        clinicId: rec.clinic,
        userId: receptionistUser.id,
      },
    });

    if (!existingStaff) {
      await prisma.clinicStaff.create({
        data: {
          clinicId: rec.clinic,
          userId: receptionistUser.id,
          role: 'RECEPTIONIST',
        },
      });
    }
  }

  console.log('✅ Created 3 TEST receptionists\n');

  // ========================================
  // 6. ADD CLINIC OWNERS TO CLINIC STAFF
  // ========================================
  console.log('👔 Adding clinic owners to staff tables...');

  const ownerClinicLinks = [
    { ownerId: testOwner1.id, clinicId: testClinic1.id },
    { ownerId: testOwner2.id, clinicId: testClinic2.id },
    { ownerId: testOwner3.id, clinicId: testClinic3.id },
  ];

  for (const link of ownerClinicLinks) {
    const existingStaff = await prisma.clinicStaff.findFirst({
      where: {
        clinicId: link.clinicId,
        userId: link.ownerId,
      },
    });

    if (!existingStaff) {
      await prisma.clinicStaff.create({
        data: {
          clinicId: link.clinicId,
          userId: link.ownerId,
          role: 'OWNER',
        },
      });
    }
  }

  console.log('✅ Added clinic owners to staff tables\n');

  // ========================================
  // 7. SUMMARY
  // ========================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ TEST DATA CREATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 Summary:');
  console.log('  ✅ 3 TEST clinics created');
  console.log('  ✅ 7 TEST doctors created and linked');
  console.log('  ✅ 3 TEST receptionists created and linked');
  console.log('  ✅ All staff added to clinic_staff table');
  console.log('  ✅ All doctors added to doctor_clinics table\n');

  console.log('🔐 Test Credentials:');
  console.log('  Password for ALL test accounts: Test@123456\n');

  console.log('🏥 Test Clinics:');
  console.log(`  1. ${testClinic1.name} (Bangalore)`);
  console.log(`     Owner: ${testOwner1.email}`);
  console.log(`     Doctors: 2, Receptionists: 1\n`);

  console.log(`  2. ${testClinic2.name} (Mumbai)`);
  console.log(`     Owner: ${testOwner2.email}`);
  console.log(`     Doctors: 2, Receptionists: 1\n`);

  console.log(`  3. ${testClinic3.name} (Delhi)`);
  console.log(`     Owner: ${testOwner3.email}`);
  console.log(`     Doctors: 3, Receptionists: 1\n`);

  console.log('👨‍⚕️ Test Doctors:');
  doctors.forEach((doc, idx) => {
    console.log(`  ${idx + 1}. ${doc.name} - ${doc.specialization}`);
    console.log(`     Email: ${doc.email}`);
  });
  console.log();

  console.log('👤 Test Receptionists:');
  receptionists.forEach((rec, idx) => {
    console.log(`  ${idx + 1}. ${rec.name}`);
    console.log(`     Email: ${rec.email}`);
  });
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 NEXT STEPS:');
  console.log('  1. Verify clinics: SELECT * FROM clinics WHERE name LIKE \'TEST%\';');
  console.log('  2. Verify doctors: SELECT * FROM users WHERE role = \'DOCTOR\' AND email LIKE \'%test%\';');
  console.log('  3. Test authentication with any test account');
  console.log('  4. Test appointment booking flow');
  console.log('  5. Test RBAC permissions');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
