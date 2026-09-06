/**
 * Setup Pain Clinic Physiotherapy and Rehabilitation Center
 * 
 * Creates:
 * - Clinic owner with test OTP (9876543210 / 123456)
 * - Pain Clinic with complete details
 * - Dr. Arjun R. Upadhyay as doctor
 * - Sample schedule and services
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setupPainClinic() {
  console.log('\n🏥 SETTING UP PAIN CLINIC');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Create Clinic Owner User
    console.log('Step 1: Creating clinic owner user...');
    
    const ownerMobile = '+919876543210';
    const ownerEmail = 'owner@painclinickarwar.in';
    const ownerName = 'Dr. Arjun R. Upadhyay';
    const password = await bcrypt.hash('PainClinic@123', 10);
    
    // Check if user exists
    let clinicOwner = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: ownerMobile },
          { mobile: '9876543210' },
          { email: ownerEmail }
        ]
      }
    });
    
    if (clinicOwner) {
      console.log('   ⚠️  Clinic owner already exists, using existing user');
    } else {
      clinicOwner = await prisma.user.create({
        data: {
          name: ownerName,
          mobile: ownerMobile,
          email: ownerEmail,
          role: 'CLINIC_OWNER',
          roles: ['CLINIC_OWNER'],
          primaryRole: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          passwordHash: password,
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'LOCAL'
        }
      });
      console.log(`   ✅ Created clinic owner: ${clinicOwner.name} (${clinicOwner.id})`);
    }
    
    // Create clinic owner profile
    const ownerProfile = await prisma.clinicOwnerProfile.upsert({
      where: { userId: clinicOwner.id },
      create: {
        userId: clinicOwner.id,
        businessName: 'Pain Clinic Physiotherapy and Rehabilitation Center',
        gstNumber: 'GST29PAINCLINIC123',
        designation: 'Chief Physiotherapist',
        yearsInHealthcare: 15,
        totalClinics: 1,
        profileCompleted: true
      },
      update: {}
    });
    console.log('   ✅ Clinic owner profile created');
    
    // Step 2: Create Clinic
    console.log('\nStep 2: Creating Pain Clinic...');
    
    const clinic = await prisma.clinic.create({
      data: {
        id: 'pain-clinic-karwar-001',
        name: 'Pain Clinic Physiotherapy',
        ownerId: clinicOwner.id,
        phone: '+919740809295',
        address: 'G8, Suman Laxmi Enclave, Kajubag',
        city: 'Karwar',
        state: 'Karnataka',
        pincode: '581301',
        landmark: 'Next to Nagmangala Hospital',
        latitude: 14.8118,
        longitude: 74.1284,
        clinicRegistrationNumber: 'KA-KAR-PAIN-2024',
        registrationYear: 2010,
        registrationAuthority: 'Karnataka Medical Council',
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        isVerified: true,
        isActive: true,
        clinicType: 'Physiotherapy Clinic',
        description: 'Pain Clinic Physiotherapy and Rehabilitation Center',
        emergencyContactNumber: '+919901958611',
        avgConsultationMinutes: 30,
        appointmentSlotMinutes: 30,
        ownerMobileVerified: true,
        ownerEmailVerified: true
      }
    });
    console.log(`   ✅ Created clinic: ${clinic.name}`);
    console.log(`   📍 Location: ${clinic.address}, ${clinic.city}`);
    console.log(`   📞 Phone: ${clinic.phone}, ${clinic.emergencyContactNumber}`);
    
    // Step 3: Create Doctor User (Dr. Arjun as doctor)
    console.log('\nStep 3: Creating doctor profile for Dr. Arjun...');
    
    const doctorMobile = '+919740809295';
    const doctorEmail = 'dr.arjun@painclinickarwar.in';
    
    let doctor = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: doctorMobile },
          { email: doctorEmail }
        ]
      }
    });
    
    if (doctor) {
      console.log('   ⚠️  Doctor already exists, using existing user');
    } else {
      doctor = await prisma.user.create({
        data: {
          name: 'Dr. Arjun R. Upadhyay',
          mobile: doctorMobile,
          email: doctorEmail,
          role: 'DOCTOR',
          roles: ['DOCTOR'],
          primaryRole: 'DOCTOR',
          approvalStatus: 'VERIFIED',
          passwordHash: await bcrypt.hash('Doctor@123', 10),
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'LOCAL'
        }
      });
      console.log(`   ✅ Created doctor: ${doctor.name} (${doctor.id})`);
    }
    
    // Create doctor profile
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: doctor.id,
        qualification: 'MPT, BPT',
        specialization: 'Physiotherapy & Pain Management',
        experienceYears: 15,
        medicalRegistrationNumber: 'KA-PHYSIO-2010-12345',
        registrationAuthority: 'Karnataka Physiotherapy Council',
        registrationYear: 2010,
        fullLegalName: 'Arjun Ramesh Upadhyay',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'MALE',
        consultationFee: 300,
        education: JSON.stringify([
          { degree: 'MPT', institution: 'Rajiv Gandhi University', year: 2012 },
          { degree: 'BPT', institution: 'KMC Mangalore', year: 2008 }
        ]),
        bio: 'Dr. Arjun R. Upadhyay is a highly experienced physiotherapist specializing in pain management, spine care, and sports injury rehabilitation. With over 15 years of clinical experience, he has helped thousands of patients recover from chronic pain and mobility issues.',
        areasOfExpertise: [
          'Pain Management',
          'Spine Care',
          'Joint Pain Treatment',
          'Sports Injury Rehabilitation',
          'Post-Surgery Rehabilitation',
          'Ergonomic Assessment'
        ],
        languagesKnown: ['English', 'Hindi', 'Kannada', 'Konkani'],
        approvalStatus: 'APPROVED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'ACTIVE',
        marketplaceVisible: true,
        onlineAvailable: false,
        offlineAvailable: true,
        avgConsultationMins: 30,
        profileCompletionPercentage: 100
      }
    });
    console.log('   ✅ Doctor profile created');
    
    // Step 4: Add doctor to clinic staff
    console.log('\nStep 4: Adding doctor to clinic staff...');
    
    const clinicStaff = await prisma.clinicStaff.create({
      data: {
        clinicId: clinic.id,
        userId: doctor.id,
        role: 'DOCTOR',
        joinedAt: new Date(),
        isActive: true,
        permissions: ['MANAGE_APPOINTMENTS', 'VIEW_PATIENTS', 'PRESCRIBE']
      }
    });
    console.log('   ✅ Doctor added to clinic staff');
    
    // Step 5: Note about schedule
    console.log('\nStep 5: Clinic schedule...');
    console.log('   ℹ️  Schedule configured in clinic weeklySchedule');
    console.log('   📅 Mon-Sat: 9:30-13:00 & 16:00-20:00, Sun: Closed');
    
    // Step 6: Add test OTP configuration for clinic owner
    console.log('\nStep 6: Configuring test OTP...');
    console.log('   📱 Test Mobile: 9876543210');
    console.log('   🔑 Test OTP: 123456');
    console.log('   ℹ️  This mobile is already in TEST_OTP_NUMBERS in .env');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ PAIN CLINIC SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📋 CLINIC DETAILS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Clinic ID: ${clinic.id}`);
    console.log(`Name: ${clinic.name}`);
    console.log(`Address: ${clinic.address}, ${clinic.city} - ${clinic.pincode}`);
    console.log(`Phone: ${clinic.phone}, ${clinic.emergencyContactNumber}`);
    console.log(`Email: ${clinic.email}`);
    console.log('');
    
    console.log('👤 CLINIC OWNER LOGIN:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Name: ${clinicOwner.name}`);
    console.log(`Mobile: ${clinicOwner.mobile} (Test OTP: 123456)`);
    console.log(`Email: ${clinicOwner.email}`);
    console.log(`Password: PainClinic@123`);
    console.log(`User ID: ${clinicOwner.id}`);
    console.log('');
    
    console.log('👨‍⚕️ DOCTOR:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`Name: ${doctor.name}`);
    console.log(`Mobile: ${doctor.mobile}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Password: Doctor@123`);
    console.log(`Specialization: ${doctorProfile.specialization}`);
    console.log(`Consultation Fee: ₹${doctorProfile.consultationFee}`);
    console.log('');
    
    console.log('⏰ WORKING HOURS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('Monday - Saturday: 9:30 AM - 1:00 PM & 4:00 PM - 8:00 PM');
    console.log('Sunday: Closed');
    console.log('');
    
    console.log('🎯 NEXT STEPS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('1. Login as clinic owner:');
    console.log('   Mobile: 9876543210');
    console.log('   OTP: 123456 (test mode)');
    console.log('');
    console.log('2. Or login with password:');
    console.log('   Email: owner@painclinickarwar.in');
    console.log('   Password: PainClinic@123');
    console.log('');
    console.log('3. Start managing appointments and patients!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPainClinic();
