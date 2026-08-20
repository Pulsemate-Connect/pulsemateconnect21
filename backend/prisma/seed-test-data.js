/**
 * Seed script to create test clinics and doctors
 * 
 * Creates:
 * - 2 Test Clinics with OTP authentication enabled
 * - 10 Doctors across different specializations
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SPECIALIZATIONS = [
  'General Physician',
  'Dentist',
  'Pediatrician',
  'Dermatologist',
  'Orthopedic',
  'Cardiologist',
  'Neurologist',
  'Gynecologist',
  'Psychiatrist',
  'ENT',
];

async function main() {
  console.log('🌱 Starting seed process...\n');

  // ─── Create Test Clinic 1 ────────────────────────────────────────────────
  console.log('📋 Creating Test Clinic 1...');
  
  const clinic1Owner = await prisma.user.upsert({
    where: { mobile: '9639639639' },
    update: {},
    create: {
      mobile: '9639639639',
      email: 'test1@gmail.com',
      name: 'Test Clinic Owner 1',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
      authProvider: 'TEST_OTP',
    },
  });

  const clinic1 = await prisma.clinic.upsert({
    where: { id: 'test-clinic-1' },
    update: {},
    create: {
      id: 'test-clinic-1',
      name: 'Test Clinic 1 - Multi Specialty',
      ownerId: clinic1Owner.id,
      phone: '9639639639',
      address: '123 MG Road, Test Area',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      isVerified: true,
      approvalStatus: 'VERIFIED',
      isActive: true,
      openingTime: '09:00',
      closingTime: '21:00',
      description: 'Full-service multi-specialty clinic with experienced doctors',
      specialties: SPECIALIZATIONS,
      consultationModes: ['ONLINE', 'OFFLINE'],
      languagesSpoken: ['English', 'Hindi', 'Kannada'],
      paymentMethods: ['CASH', 'UPI', 'CARD'],
      facilities: ['Pharmacy', 'Lab', 'X-Ray', 'Emergency Care'],
    },
  });

  console.log('✅ Created Test Clinic 1:', clinic1.name);

  // ─── Create Test Clinic 2 ────────────────────────────────────────────────
  console.log('\n📋 Creating Test Clinic 2...');
  
  const clinic2Owner = await prisma.user.upsert({
    where: { mobile: '9879879879' },
    update: {},
    create: {
      mobile: '9879879879',
      email: 'test2@gmail.com',
      name: 'Test Clinic Owner 2',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
      authProvider: 'TEST_OTP',
    },
  });

  const clinic2 = await prisma.clinic.upsert({
    where: { id: 'test-clinic-2' },
    update: {},
    create: {
      id: 'test-clinic-2',
      name: 'Test Clinic 2 - Healthcare Center',
      ownerId: clinic2Owner.id,
      phone: '9879879879',
      address: '456 Brigade Road, Central District',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560002',
      latitude: 12.9716,
      longitude: 77.6044,
      isVerified: true,
      approvalStatus: 'VERIFIED',
      isActive: true,
      openingTime: '08:00',
      closingTime: '22:00',
      description: 'Modern healthcare center with state-of-the-art facilities',
      specialties: SPECIALIZATIONS,
      consultationModes: ['ONLINE', 'OFFLINE'],
      languagesSpoken: ['English', 'Hindi', 'Tamil'],
      paymentMethods: ['CASH', 'UPI', 'CARD'],
      facilities: ['ICU', 'Pharmacy', 'Lab', 'Diagnostic Center'],
    },
  });

  console.log('✅ Created Test Clinic 2:', clinic2.name);

  // ─── Create 10 Test Doctors ───────────────────────────────────────────────
  console.log('\n👨‍⚕️ Creating 10 Test Doctors...\n');

  const doctors = [
    {
      name: 'Dr. Rajesh Kumar',
      mobile: '9111111111',
      email: 'rajesh.kumar@test.com',
      specialization: 'General Physician',
      qualification: 'MBBS, MD',
      experience: 15,
      fee: 500,
      clinicId: clinic1.id,
    },
    {
      name: 'Dr. Priya Sharma',
      mobile: '9222222222',
      email: 'priya.sharma@test.com',
      specialization: 'Dentist',
      qualification: 'BDS, MDS',
      experience: 10,
      fee: 600,
      clinicId: clinic1.id,
    },
    {
      name: 'Dr. Amit Patel',
      mobile: '9333333333',
      email: 'amit.patel@test.com',
      specialization: 'Pediatrician',
      qualification: 'MBBS, MD (Pediatrics)',
      experience: 12,
      fee: 700,
      clinicId: clinic2.id,
    },
    {
      name: 'Dr. Sneha Reddy',
      mobile: '9444444444',
      email: 'sneha.reddy@test.com',
      specialization: 'Dermatologist',
      qualification: 'MBBS, MD (Dermatology)',
      experience: 8,
      fee: 800,
      clinicId: clinic2.id,
    },
    {
      name: 'Dr. Vikram Singh',
      mobile: '9555555555',
      email: 'vikram.singh@test.com',
      specialization: 'Orthopedic',
      qualification: 'MBBS, MS (Orthopedics)',
      experience: 18,
      fee: 900,
      clinicId: clinic1.id,
    },
    {
      name: 'Dr. Anjali Verma',
      mobile: '9666666666',
      email: 'anjali.verma@test.com',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD, DM (Cardiology)',
      experience: 20,
      fee: 1200,
      clinicId: clinic1.id,
    },
    {
      name: 'Dr. Rahul Gupta',
      mobile: '9777777777',
      email: 'rahul.gupta@test.com',
      specialization: 'Neurologist',
      qualification: 'MBBS, MD, DM (Neurology)',
      experience: 14,
      fee: 1100,
      clinicId: clinic2.id,
    },
    {
      name: 'Dr. Kavita Menon',
      mobile: '9888888888',
      email: 'kavita.menon@test.com',
      specialization: 'Gynecologist',
      qualification: 'MBBS, MS (OB-GYN)',
      experience: 16,
      fee: 800,
      clinicId: clinic2.id,
    },
    {
      name: 'Dr. Sanjay Desai',
      mobile: '9999999991',
      email: 'sanjay.desai@test.com',
      specialization: 'Psychiatrist',
      qualification: 'MBBS, MD (Psychiatry)',
      experience: 11,
      fee: 1000,
      clinicId: clinic1.id,
    },
    {
      name: 'Dr. Meera Iyer',
      mobile: '9999999992',
      email: 'meera.iyer@test.com',
      specialization: 'ENT',
      qualification: 'MBBS, MS (ENT)',
      experience: 9,
      fee: 700,
      clinicId: clinic2.id,
    },
  ];

  for (const doctorData of doctors) {
    // Create user account for doctor
    const doctorUser = await prisma.user.upsert({
      where: { mobile: doctorData.mobile },
      update: {},
      create: {
        mobile: doctorData.mobile,
        email: doctorData.email,
        name: doctorData.name,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        isPhoneVerified: true,
        isEmailVerified: true,
        isActive: true,
        authProvider: 'TEST',
      },
    });

    // Create doctor profile
    const doctorProfile = await prisma.doctorProfile.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        approvalStatus: 'VERIFIED',
        qualification: doctorData.qualification,
        specialization: doctorData.specialization,
        experienceYears: doctorData.experience,
        consultationFee: doctorData.fee,
        onlineAvailable: true,
        offlineAvailable: true,
        bio: `Experienced ${doctorData.specialization} with ${doctorData.experience} years of practice. Dedicated to providing quality healthcare.`,
        areasOfExpertise: [doctorData.specialization],
        languagesKnown: ['English', 'Hindi'],
        marketplaceVisible: true,
        profileStatus: 'COMPLETE',
        verificationStatus: 'VERIFIED',
        medicalRegistrationNumber: `MR${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        avgConsultationMins: 15,
      },
    });

    // Link doctor to clinic
    await prisma.doctorClinic.upsert({
      where: {
        doctorId_clinicId: {
          doctorId: doctorProfile.id,
          clinicId: doctorData.clinicId,
        },
      },
      update: {},
      create: {
        doctorId: doctorProfile.id,
        clinicId: doctorData.clinicId,
        inviteStatus: 'ACCEPTED',
        roleAtClinic: 'CONSULTANT',
        consultationFee: doctorData.fee,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '09:00',
        endTime: '18:00',
        avgConsultationMins: 15,
        isActive: true,
        joinedAt: new Date(),
      },
    });

    console.log(`✅ Created ${doctorData.name} (${doctorData.specialization}) at ${doctorData.clinicId === clinic1.id ? 'Clinic 1' : 'Clinic 2'}`);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 2 Test Clinics created');
  console.log('   - 10 Doctors created across all specializations');
  console.log('   - All accounts are VERIFIED and ACTIVE');
  console.log('\n🔐 Test OTP Login:');
  console.log('   Clinic 1: 9639639639 / test1@gmail.com (OTP: 123456)');
  console.log('   Clinic 2: 9879879879 / test2@gmail.com (OTP: 123456)');
  console.log('\n💡 Tip: Make sure TEST_OTP_NUMBERS includes these numbers in your .env');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
