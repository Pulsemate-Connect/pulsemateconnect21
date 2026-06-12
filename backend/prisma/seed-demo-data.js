/**
 * seed-demo-data.js
 * Creates 2 clinics, 2 doctors, and 2 receptionists for testing
 * All users are VERIFIED and ready to use immediately
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Common password for all demo accounts
const DEMO_PASSWORD = 'Demo@123456';

async function main() {
  console.log('🌱 Starting seed process...\n');
  
  // Clear existing data in proper order (respecting foreign key constraints)
  console.log('🗑️  Clearing existing data...');
  await prisma.reminderSent.deleteMany();
  await prisma.userNotification.deleteMany();
  await prisma.notificationCampaign.deleteMany();
  await prisma.notificationRead.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.fcmToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorClinic.deleteMany();
  await prisma.clinicStaff.deleteMany();
  await prisma.receptionistProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.firebasePhoneVerification.deleteMany();
  await prisma.clinicVerificationLog.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Data cleared\n');

  // Hash password once for all users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE ADMIN ACCOUNTS FIRST
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👑 Creating Admin Accounts...');

  const rootAdmin = await prisma.user.create({
    data: {
      name: 'Sahil Naik',
      mobile: '+919000000001',
      email: 'sahilnaik1515@gmail.com',
      role: 'SUPER_ADMIN',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      adminProfile: {
        create: { level: 'ROOT' },
      },
    },
    include: { adminProfile: true },
  });
  console.log(`  ✓ Root Admin: ${rootAdmin.name} (${rootAdmin.email})`);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      mobile: '+919000000000',
      email: 'admin@pulsemate.com',
      role: 'SUPER_ADMIN',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      adminProfile: {
        create: { level: 'SUPER_ADMIN', createdById: rootAdmin.id },
      },
    },
    include: { adminProfile: true },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.name} (${superAdmin.email})\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // CLINIC 1: City Care Clinic (Mumbai)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📍 Creating Clinic 1: City Care Clinic...');

  const owner1 = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      mobile: '+919876543220',
      email: 'rajesh.kumar@cityclinic.com',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      firebaseUid: 'demo_firebase_uid_clinic_owner_1',
      authProvider: 'FIREBASE_PHONE',
    },
  });
  console.log(`  ✓ Owner: ${owner1.name} (${owner1.email})`);

  const clinic1 = await prisma.clinic.create({
    data: {
      ownerId: owner1.id,
      name: 'City Care Clinic',
      clinicType: 'Multi Specialty',
      address: '123, MG Road, Andheri West',
      landmark: 'Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      pincode: '400058',
      phone: '+912222333444',
      googleMapsLocation: 'https://maps.google.com/?q=19.1197,72.8464',
      latitude: 19.1197,
      longitude: 72.8464,
      emergencyContactNumber: '+912222333445',
      alternateEmail: 'info@cityclinic.com',
      consultationModes: ['OFFLINE', 'ONLINE'],
      openingHours: 'Mon-Sat: 9:00 AM - 8:00 PM, Sun: 10:00 AM - 2:00 PM',
      description: 'Leading multi-specialty clinic in Mumbai with experienced doctors',
      specialties: ['Cardiology', 'Orthopedics', 'General Medicine'],
      doctorCount: 5,
      facilities: ['X-Ray', 'Lab Tests', 'Pharmacy', 'ECG'],
      languagesSpoken: ['English', 'Hindi', 'Marathi'],
      paymentMethods: ['Cash', 'Card', 'UPI'],
      insuranceSupported: ['Star Health', 'HDFC Ergo'],
      clinicRegistrationNumber: 'MH-MUM-CC-2024-001',
      gstNumber: '27AAACC1234C1Z5',
      panNumber: 'AAACC1234C',
      licenseDocumentUrl: '/uploads/clinic-owner/demo-license-1.pdf',
      avgConsultationMinutes: 15,
      appointmentSlotMinutes: 15,
      dailyPatientCapacity: 100,
      approvalStatus: 'VERIFIED',
      isVerified: true,
      ownerMobileVerified: true,
      ownerEmailVerified: true,
      mobileOtpVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      submittedAt: new Date(),
      verifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Clinic: ${clinic1.name} (ID: ${clinic1.id})\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // CLINIC 2: Green Valley Hospital (Delhi)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📍 Creating Clinic 2: Green Valley Hospital...');

  const owner2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      mobile: '+919876543221',
      email: 'priya.sharma@greenvalley.com',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      firebaseUid: 'demo_firebase_uid_clinic_owner_2',
      authProvider: 'FIREBASE_PHONE',
    },
  });
  console.log(`  ✓ Owner: ${owner2.name} (${owner2.email})`);

  const clinic2 = await prisma.clinic.create({
    data: {
      ownerId: owner2.id,
      name: 'Green Valley Hospital',
      clinicType: 'Hospital',
      address: '45, Green Park Extension, South Delhi',
      landmark: 'Opposite AIIMS Metro',
      city: 'New Delhi',
      state: 'Delhi',
      district: 'South Delhi',
      pincode: '110016',
      phone: '+911144556677',
      googleMapsLocation: 'https://maps.google.com/?q=28.5494,77.2001',
      latitude: 28.5494,
      longitude: 77.2001,
      emergencyContactNumber: '+911144556688',
      alternateEmail: 'contact@greenvalley.com',
      consultationModes: ['OFFLINE', 'ONLINE', 'VIDEO_CALL'],
      openingHours: '24/7',
      description: 'Premier multi-specialty hospital with state-of-the-art facilities',
      specialties: ['Cardiology', 'Neurology', 'Pediatrics', 'General Surgery'],
      doctorCount: 8,
      facilities: ['ICU', 'Emergency', 'CT Scan', 'MRI', 'Lab', 'Pharmacy'],
      languagesSpoken: ['English', 'Hindi', 'Punjabi'],
      paymentMethods: ['Cash', 'Card', 'UPI', 'Net Banking'],
      insuranceSupported: ['Star Health', 'Care Health', 'Max Bupa'],
      clinicRegistrationNumber: 'DL-SD-GVH-2024-002',
      gstNumber: '07AAAGG5678G1Z8',
      panNumber: 'AAAGG5678G',
      licenseDocumentUrl: '/uploads/clinic-owner/demo-license-2.pdf',
      avgConsultationMinutes: 20,
      appointmentSlotMinutes: 20,
      dailyPatientCapacity: 150,
      approvalStatus: 'VERIFIED',
      isVerified: true,
      ownerMobileVerified: true,
      ownerEmailVerified: true,
      mobileOtpVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      submittedAt: new Date(),
      verifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Clinic: ${clinic2.name} (ID: ${clinic2.id})\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // DOCTOR 1: Dr. Amit Patel (Linked to City Care Clinic)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👨‍⚕️ Creating Doctor 1: Dr. Amit Patel...');

  const doctor1 = await prisma.user.create({
    data: {
      name: 'Dr. Amit Patel',
      mobile: '+919876543222',
      email: 'amit.patel@doctor.com',
      role: 'DOCTOR',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      firebaseUid: 'demo_firebase_uid_doctor_1',
      authProvider: 'FIREBASE_PHONE',
      doctorProfile: {
        create: {
          approvalStatus: 'VERIFIED',
          qualification: 'MBBS, MD (Cardiology)',
          specialization: 'Cardiology',
          experienceYears: 12,
          education: 'MBBS from AIIMS Delhi, MD from Safdarjung Hospital',
          medicalRegistrationNumber: 'MCI-DOC-2012-12345',
          documentUrl: '/uploads/doctor/demo-license-dr-amit.pdf',
          certificates: ['/uploads/doctor/demo-license-dr-amit.pdf'],
          consultationFee: 800,
          onlineAvailable: true,
          offlineAvailable: true,
          marketplaceVisible: true,
          profileStatus: 'COMPLETE',
          verificationStatus: 'VERIFIED',
          gender: 'Male',
          bio: 'Experienced cardiologist with 12+ years in cardiac care and interventional cardiology',
          languagesKnown: ['English', 'Hindi', 'Gujarati'],
          avgConsultationMins: 15,
        },
      },
    },
    include: {
      doctorProfile: true,
    },
  });
  console.log(`  ✓ Doctor: ${doctor1.name} (${doctor1.email})`);

  // Link Dr. Amit to City Care Clinic
  await prisma.clinicStaff.create({
    data: {
      clinicId: clinic1.id,
      userId: doctor1.id,
      role: 'DOCTOR',
      isActive: true,
    },
  });

  await prisma.doctorClinic.create({
    data: {
      doctorId: doctor1.doctorProfile.id,
      clinicId: clinic1.id,
      inviteStatus: 'ACCEPTED',
      roleAtClinic: 'CONSULTANT',
      consultationFee: 800,
      availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      startTime: '09:00',
      endTime: '18:00',
      avgConsultationMins: 15,
      isActive: true,
      joinedAt: new Date(),
    },
  });
  console.log(`  ✓ Linked to ${clinic1.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // DOCTOR 2: Dr. Sneha Reddy (Linked to Green Valley Hospital)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👩‍⚕️ Creating Doctor 2: Dr. Sneha Reddy...');

  const doctor2 = await prisma.user.create({
    data: {
      name: 'Dr. Sneha Reddy',
      mobile: '+919876543223',
      email: 'sneha.reddy@doctor.com',
      role: 'DOCTOR',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      firebaseUid: 'demo_firebase_uid_doctor_2',
      authProvider: 'FIREBASE_PHONE',
      doctorProfile: {
        create: {
          approvalStatus: 'VERIFIED',
          qualification: 'MBBS, MS (Orthopedics)',
          specialization: 'Orthopedics',
          experienceYears: 8,
          education: 'MBBS from CMC Vellore, MS from Manipal Hospital',
          medicalRegistrationNumber: 'MCI-DOC-2016-67890',
          documentUrl: '/uploads/doctor/demo-license-dr-sneha.pdf',
          certificates: ['/uploads/doctor/demo-license-dr-sneha.pdf'],
          consultationFee: 600,
          onlineAvailable: true,
          offlineAvailable: true,
          marketplaceVisible: true,
          profileStatus: 'COMPLETE',
          verificationStatus: 'VERIFIED',
          gender: 'Female',
          bio: 'Orthopedic surgeon specializing in sports injuries and joint replacements',
          languagesKnown: ['English', 'Hindi', 'Telugu'],
          avgConsultationMins: 20,
        },
      },
    },
    include: {
      doctorProfile: true,
    },
  });
  console.log(`  ✓ Doctor: ${doctor2.name} (${doctor2.email})`);

  // Link Dr. Sneha to Green Valley Hospital
  await prisma.clinicStaff.create({
    data: {
      clinicId: clinic2.id,
      userId: doctor2.id,
      role: 'DOCTOR',
      isActive: true,
    },
  });

  await prisma.doctorClinic.create({
    data: {
      doctorId: doctor2.doctorProfile.id,
      clinicId: clinic2.id,
      inviteStatus: 'ACCEPTED',
      roleAtClinic: 'CONSULTANT',
      consultationFee: 600,
      availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      startTime: '10:00',
      endTime: '17:00',
      avgConsultationMins: 20,
      isActive: true,
      joinedAt: new Date(),
    },
  });
  console.log(`  ✓ Linked to ${clinic2.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // RECEPTIONIST 1: Anjali Singh (City Care Clinic)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👩‍💼 Creating Receptionist 1: Anjali Singh...');

  const receptionist1 = await prisma.user.create({
    data: {
      name: 'Anjali Singh',
      mobile: '+919876543224',
      email: 'anjali.singh@cityclinic.com',
      role: 'RECEPTIONIST',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      receptionistProfile: {
        create: {
          assignedClinicId: clinic1.id,
          createdByOwnerId: owner1.id,
        },
      },
    },
  });
  console.log(`  ✓ Receptionist: ${receptionist1.name} (${receptionist1.email})`);

  await prisma.clinicStaff.create({
    data: {
      clinicId: clinic1.id,
      userId: receptionist1.id,
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });
  console.log(`  ✓ Assigned to ${clinic1.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // RECEPTIONIST 2: Vikram Rao (Green Valley Hospital)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('👨‍💼 Creating Receptionist 2: Vikram Rao...');

  const receptionist2 = await prisma.user.create({
    data: {
      name: 'Vikram Rao',
      mobile: '+919876543225',
      email: 'vikram.rao@greenvalley.com',
      role: 'RECEPTIONIST',
      approvalStatus: 'VERIFIED',
      passwordHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      receptionistProfile: {
        create: {
          assignedClinicId: clinic2.id,
          createdByOwnerId: owner2.id,
        },
      },
    },
  });
  console.log(`  ✓ Receptionist: ${receptionist2.name} (${receptionist2.email})`);

  await prisma.clinicStaff.create({
    data: {
      clinicId: clinic2.id,
      userId: receptionist2.id,
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });
  console.log(`  ✓ Assigned to ${clinic2.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SEED DATA CREATED SUCCESSFULLY!\n');
  
  console.log('👑 ADMIN ACCOUNTS:');
  console.log(`  1. Root Admin: ${rootAdmin.name} (${rootAdmin.email})`);
  console.log(`  2. Super Admin: ${superAdmin.name} (${superAdmin.email})\n`);
  
  console.log('🏥 CLINICS:');
  console.log(`  1. ${clinic1.name} (Mumbai) - Owner: ${owner1.name}`);
  console.log(`  2. ${clinic2.name} (Delhi) - Owner: ${owner2.name}\n`);

  console.log('👨‍⚕️ DOCTORS:');
  console.log(`  1. ${doctor1.name} - Cardiology @ ${clinic1.name}`);
  console.log(`  2. ${doctor2.name} - Orthopedics @ ${clinic2.name}\n`);

  console.log('👥 RECEPTIONISTS:');
  console.log(`  1. ${receptionist1.name} @ ${clinic1.name}`);
  console.log(`  2. ${receptionist2.name} @ ${clinic2.name}\n`);

  console.log('🔑 LOGIN CREDENTIALS (All users):');
  console.log(`   Password: ${DEMO_PASSWORD}\n`);

  console.log('📱 PHONE NUMBERS:');
  console.log('   Admins:');
  console.log(`     • ${rootAdmin.mobile} (${rootAdmin.email})`);
  console.log(`     • ${superAdmin.mobile} (${superAdmin.email})`);
  console.log('   Clinic Owners:');
  console.log(`     • ${owner1.mobile} (${owner1.email})`);
  console.log(`     • ${owner2.mobile} (${owner2.email})`);
  console.log('   Doctors:');
  console.log(`     • ${doctor1.mobile} (${doctor1.email})`);
  console.log(`     • ${doctor2.mobile} (${doctor2.email})`);
  console.log('   Receptionists:');
  console.log(`     • ${receptionist1.mobile} (${receptionist1.email})`);
  console.log(`     • ${receptionist2.mobile} (${receptionist2.email})`);
  
  console.log('\n📝 NOTE: All accounts are VERIFIED and ready to use immediately!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
