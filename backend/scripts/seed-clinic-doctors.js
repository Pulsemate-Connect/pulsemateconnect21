/**
 * seed-clinic-doctors.js
 * Creates 1 clinic with 2 doctors for testing
 * Run: node scripts/seed-clinic-doctors.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CLINIC_DATA = {
  name: 'HealthCare Plus Clinic',
  ownerName: 'Dr. Rajesh Kumar',
  ownerEmail: 'rajesh.clinic@test.com',
  ownerMobile: '9876543210',
  ownerPassword: 'Clinic@123',
  phone: '0804567890',
  email: 'info@healthcareplus.com',
  address: '123 MG Road',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  latitude: 12.9716,
  longitude: 77.5946,
  clinicType: 'MULTI_SPECIALTY',
  specialties: ['General Medicine', 'Cardiology'],
};

const DOCTORS = [
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@test.com',
    mobile: '9988776655',
    password: 'Doctor@123',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD (Cardiology)',
    experienceYears: 10,
    consultationFee: 800,
    gender: 'Female',
    licenseNumber: 'MCI12345',
  },
  {
    name: 'Dr. Amit Verma',
    email: 'amit.verma@test.com',
    mobile: '9876543211',
    password: 'Doctor@123',
    specialization: 'General Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    experienceYears: 8,
    consultationFee: 600,
    gender: 'Male',
    licenseNumber: 'MCI54321',
  },
];

async function main() {
  console.log('\n🏥 Creating clinic with 2 doctors...\n');

  // ═══════════════════════════════════════════════════════════════════
  // 1. CREATE CLINIC OWNER
  // ═══════════════════════════════════════════════════════════════════
  console.log('📝 Step 1: Creating clinic owner...');
  
  const ownerPasswordHash = await bcrypt.hash(CLINIC_DATA.ownerPassword, 12);
  
  const owner = await prisma.user.upsert({
    where: { email: CLINIC_DATA.ownerEmail },
    update: {
      mobile: CLINIC_DATA.ownerMobile,
      name: CLINIC_DATA.ownerName,
      passwordHash: ownerPasswordHash,
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      authProvider: 'EMAIL_PASSWORD',
    },
    create: {
      email: CLINIC_DATA.ownerEmail,
      mobile: CLINIC_DATA.ownerMobile,
      name: CLINIC_DATA.ownerName,
      passwordHash: ownerPasswordHash,
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      authProvider: 'EMAIL_PASSWORD',
    },
  });

  // Create clinic owner profile
  await prisma.clinicOwnerProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
    },
  });

  console.log(`✅ Clinic owner created: ${owner.email}`);
  console.log(`   Mobile: ${owner.mobile}`);
  console.log(`   Password: ${CLINIC_DATA.ownerPassword}`);

  // ═══════════════════════════════════════════════════════════════════
  // 2. CREATE CLINIC
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n🏥 Step 2: Creating clinic...');
  
  // Check if clinic already exists
  let clinic = await prisma.clinic.findFirst({
    where: {
      phone: CLINIC_DATA.phone,
    },
  });

  if (clinic) {
    console.log(`ℹ️  Clinic already exists, updating...`);
    clinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        name: CLINIC_DATA.name,
        ownerId: owner.id,
        address: CLINIC_DATA.address,
        city: CLINIC_DATA.city,
        state: CLINIC_DATA.state,
        pincode: CLINIC_DATA.pincode,
        latitude: CLINIC_DATA.latitude,
        longitude: CLINIC_DATA.longitude,
        clinicType: CLINIC_DATA.clinicType,
        specialties: CLINIC_DATA.specialties,
        approvalStatus: 'VERIFIED',
        isActive: true,
        isVerified: true,
      },
    });
  } else {
    clinic = await prisma.clinic.create({
      data: {
        name: CLINIC_DATA.name,
        ownerId: owner.id,
        phone: CLINIC_DATA.phone,
        address: CLINIC_DATA.address,
        city: CLINIC_DATA.city,
        state: CLINIC_DATA.state,
        pincode: CLINIC_DATA.pincode,
        latitude: CLINIC_DATA.latitude,
        longitude: CLINIC_DATA.longitude,
        clinicType: CLINIC_DATA.clinicType,
        specialties: CLINIC_DATA.specialties,
        approvalStatus: 'VERIFIED',
        isActive: true,
        isVerified: true,
      },
    });
  }

  console.log(`✅ Clinic created: ${clinic.name}`);
  console.log(`   ID: ${clinic.id}`);
  console.log(`   Address: ${clinic.address}, ${clinic.city}`);

  // ═══════════════════════════════════════════════════════════════════
  // 3. CREATE DOCTORS
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n👨‍⚕️ Step 3: Creating doctors...\n');

  for (const doctorData of DOCTORS) {
    const passwordHash = await bcrypt.hash(doctorData.password, 12);
    
    const doctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {
        mobile: doctorData.mobile,
        name: doctorData.name,
        passwordHash: passwordHash,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
      create: {
        email: doctorData.email,
        mobile: doctorData.mobile,
        name: doctorData.name,
        passwordHash: passwordHash,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
    });

    // Create doctor profile
    await prisma.doctorProfile.upsert({
      where: { userId: doctor.id },
      update: {
        specialization: doctorData.specialization,
        qualification: doctorData.qualification,
        experienceYears: doctorData.experienceYears,
        consultationFee: doctorData.consultationFee,
        gender: doctorData.gender,
        licenseNumber: doctorData.licenseNumber,
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        marketplaceVisible: true,
      },
      create: {
        userId: doctor.id,
        specialization: doctorData.specialization,
        qualification: doctorData.qualification,
        experienceYears: doctorData.experienceYears,
        consultationFee: doctorData.consultationFee,
        gender: doctorData.gender,
        licenseNumber: doctorData.licenseNumber,
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        marketplaceVisible: true,
      },
    });

    // Link doctor to clinic as staff
    await prisma.clinicStaff.upsert({
      where: {
        clinicId_userId: {
          clinicId: clinic.id,
          userId: doctor.id,
        },
      },
      update: {
        isActive: true,
        role: 'DOCTOR',
      },
      create: {
        clinicId: clinic.id,
        userId: doctor.id,
        role: 'DOCTOR',
        isActive: true,
      },
    });

    console.log(`✅ Doctor created: ${doctor.name}`);
    console.log(`   Email: ${doctor.email}`);
    console.log(`   Mobile: ${doctor.mobile}`);
    console.log(`   Password: ${doctorData.password}`);
    console.log(`   Specialization: ${doctorData.specialization}`);
    console.log(`   Linked to clinic: ${clinic.name}`);
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n📋 CLINIC OWNER LOGIN:');
  console.log(`   Email: ${CLINIC_DATA.ownerEmail}`);
  console.log(`   Mobile: ${CLINIC_DATA.ownerMobile}`);
  console.log(`   Password: ${CLINIC_DATA.ownerPassword}`);
  console.log(`   Login at: /login or /portal`);
  
  console.log('\n🏥 CLINIC DETAILS:');
  console.log(`   Name: ${clinic.name}`);
  console.log(`   Address: ${clinic.address}, ${clinic.city}, ${clinic.state}`);
  console.log(`   Phone: ${clinic.phone}`);
  
  console.log('\n👨‍⚕️ DOCTORS LOGIN:');
  DOCTORS.forEach((doc, index) => {
    console.log(`\n   Doctor ${index + 1}: ${doc.name}`);
    console.log(`   Email: ${doc.email}`);
    console.log(`   Mobile: ${doc.mobile}`);
    console.log(`   Password: ${doc.password}`);
    console.log(`   Specialization: ${doc.specialization}`);
    console.log(`   Login at: /doctor/login`);
  });
  
  console.log('\n📱 TEST OTP (for mobile login):');
  console.log('   Use: 123456 (if in test mode)');
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
