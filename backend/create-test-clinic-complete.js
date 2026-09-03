#!/usr/bin/env node
/**
 * Create Complete Test Clinic Setup
 * 
 * Creates:
 * - 1 Clinic Owner
 * - 1 Clinic (verified)
 * - 2 Doctors with profiles
 * - 1 Receptionist
 * - Clinic Sessions (Morning & Evening)
 * - Doctor Availability (9 AM - 10 PM)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCompleteClinic() {
  console.log('🏥 Creating Complete Test Clinic Setup\n');
  console.log('='.repeat(70));

  try {
    // ============================================================
    // 1. CREATE CLINIC OWNER
    // ============================================================
    console.log('\n👤 STEP 1: Creating Clinic Owner...\n');

    const ownerPassword = await bcrypt.hash('Owner123!', 12);
    
    const clinicOwner = await prisma.user.upsert({
      where: { email: 'clinic.owner@test.com' },
      update: {
        name: 'Dr. Rajesh Kumar',
        mobile: '9876543210',
        passwordHash: ownerPassword,
        role: 'CLINIC_OWNER',
        roles: ['CLINIC_OWNER'],
        primaryRole: 'CLINIC_OWNER',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
      create: {
        name: 'Dr. Rajesh Kumar',
        email: 'clinic.owner@test.com',
        mobile: '9876543210',
        passwordHash: ownerPassword,
        role: 'CLINIC_OWNER',
        roles: ['CLINIC_OWNER'],
        primaryRole: 'CLINIC_OWNER',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
    });

    console.log('   ✅ Clinic Owner Created:');
    console.log(`      Name: Dr. Rajesh Kumar`);
    console.log(`      Email: clinic.owner@test.com`);
    console.log(`      Password: Owner123!`);
    console.log(`      Mobile: 9876543210`);
    console.log(`      User ID: ${clinicOwner.id}`);

    // Create clinic owner profile if doesn't exist
    await prisma.clinicOwnerProfile.upsert({
      where: { userId: clinicOwner.id },
      update: {},
      create: { userId: clinicOwner.id },
    });

    // ============================================================
    // 2. CREATE CLINIC
    // ============================================================
    console.log('\n🏥 STEP 2: Creating Clinic...\n');

    const clinic = await prisma.clinic.upsert({
      where: { id: 'test-clinic-complete-001' },
      update: {
        name: 'PulseMate Multi-Specialty Clinic',
        ownerId: clinicOwner.id,
        phone: '08012345678',
        address: '123, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        latitude: 12.9352,
        longitude: 77.6245,
        isVerified: true,
        approvalStatus: 'VERIFIED',
        isActive: true,
        openingTime: '09:00',
        closingTime: '22:00',
        description: 'Full-service multi-specialty clinic with experienced doctors',
        specialties: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics'],
        consultationModes: ['OFFLINE', 'ONLINE'],
        avgConsultationMinutes: 15,
        appointmentSlotMinutes: 15,
        dailyPatientCapacity: 50,
        facilities: ['X-Ray', 'ECG', 'Lab Tests', 'Pharmacy', 'Ambulance'],
        languagesSpoken: ['English', 'Hindi', 'Kannada'],
        paymentMethods: ['CASH', 'UPI', 'CARD', 'RAZORPAY'],
      },
      create: {
        id: 'test-clinic-complete-001',
        name: 'PulseMate Multi-Specialty Clinic',
        ownerId: clinicOwner.id,
        phone: '08012345678',
        address: '123, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        latitude: 12.9352,
        longitude: 77.6245,
        isVerified: true,
        approvalStatus: 'VERIFIED',
        isActive: true,
        openingTime: '09:00',
        closingTime: '22:00',
        description: 'Full-service multi-specialty clinic with experienced doctors',
        specialties: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics'],
        consultationModes: ['OFFLINE', 'ONLINE'],
        avgConsultationMinutes: 15,
        appointmentSlotMinutes: 15,
        dailyPatientCapacity: 50,
        facilities: ['X-Ray', 'ECG', 'Lab Tests', 'Pharmacy', 'Ambulance'],
        languagesSpoken: ['English', 'Hindi', 'Kannada'],
        paymentMethods: ['CASH', 'UPI', 'CARD', 'RAZORPAY'],
      },
    });

    console.log('   ✅ Clinic Created:');
    console.log(`      Name: ${clinic.name}`);
    console.log(`      Location: ${clinic.city}, ${clinic.state}`);
    console.log(`      Timing: ${clinic.openingTime} - ${clinic.closingTime}`);
    console.log(`      Status: VERIFIED ✅`);
    console.log(`      Clinic ID: ${clinic.id}`);

    // ============================================================
    // 3. CREATE CLINIC SESSIONS (Morning & Evening)
    // ============================================================
    console.log('\n⏰ STEP 3: Creating Clinic Sessions...\n');

    const morningSession = await prisma.clinicSession.upsert({
      where: { 
        clinicId_sessionType: {
          clinicId: clinic.id,
          sessionType: 'MORNING',
        }
      },
      update: {
        name: 'Morning Session',
        startTime: '09:00',
        endTime: '13:00',
        maxPatients: 20,
        avgConsultationMins: 15,
        enabled: true,
        sortOrder: 1,
      },
      create: {
        clinicId: clinic.id,
        sessionType: 'MORNING',
        name: 'Morning Session',
        startTime: '09:00',
        endTime: '13:00',
        maxPatients: 20,
        avgConsultationMins: 15,
        enabled: true,
        sortOrder: 1,
      },
    });

    const eveningSession = await prisma.clinicSession.upsert({
      where: { 
        clinicId_sessionType: {
          clinicId: clinic.id,
          sessionType: 'EVENING',
        }
      },
      update: {
        name: 'Evening Session',
        startTime: '17:00',
        endTime: '22:00',
        maxPatients: 30,
        avgConsultationMins: 15,
        enabled: true,
        sortOrder: 3,
      },
      create: {
        clinicId: clinic.id,
        sessionType: 'EVENING',
        name: 'Evening Session',
        startTime: '17:00',
        endTime: '22:00',
        maxPatients: 30,
        avgConsultationMins: 15,
        enabled: true,
        sortOrder: 3,
      },
    });

    console.log('   ✅ Morning Session: 09:00 AM - 01:00 PM (Max: 20 patients)');
    console.log('   ✅ Evening Session: 05:00 PM - 10:00 PM (Max: 30 patients)');

    // ============================================================
    // 4. CREATE DOCTOR 1 (Cardiologist)
    // ============================================================
    console.log('\n👨‍⚕️ STEP 4: Creating Doctor 1 (Cardiologist)...\n');

    const doctor1Password = await bcrypt.hash('Doctor123!', 12);
    
    const doctor1User = await prisma.user.upsert({
      where: { email: 'dr.sharma@test.com' },
      update: {
        name: 'Dr. Amit Sharma',
        mobile: '9876543201',
        passwordHash: doctor1Password,
        role: 'DOCTOR',
        roles: ['DOCTOR'],
        primaryRole: 'DOCTOR',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
      create: {
        name: 'Dr. Amit Sharma',
        email: 'dr.sharma@test.com',
        mobile: '9876543201',
        passwordHash: doctor1Password,
        role: 'DOCTOR',
        roles: ['DOCTOR'],
        primaryRole: 'DOCTOR',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
    });

    const doctor1Profile = await prisma.doctorProfile.upsert({
      where: { userId: doctor1User.id },
      update: {
        qualification: 'MBBS, MD (Cardiology)',
        specialization: 'Cardiology',
        experienceYears: 15,
        consultationFee: 800,
        onlineAvailable: true,
        offlineAvailable: true,
        avgConsultationMins: 20,
        approvalStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        verificationStatus: 'VERIFIED',
        marketplaceVisible: true,
        bio: 'Senior Cardiologist with 15 years of experience in treating heart conditions',
        areasOfExpertise: ['Heart Disease', 'Hypertension', 'ECG', 'Angiography'],
        languagesKnown: ['English', 'Hindi', 'Kannada'],
        gender: 'Male',
      },
      create: {
        userId: doctor1User.id,
        qualification: 'MBBS, MD (Cardiology)',
        specialization: 'Cardiology',
        experienceYears: 15,
        consultationFee: 800,
        onlineAvailable: true,
        offlineAvailable: true,
        avgConsultationMins: 20,
        approvalStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        verificationStatus: 'VERIFIED',
        marketplaceVisible: true,
        bio: 'Senior Cardiologist with 15 years of experience in treating heart conditions',
        areasOfExpertise: ['Heart Disease', 'Hypertension', 'ECG', 'Angiography'],
        languagesKnown: ['English', 'Hindi', 'Kannada'],
        gender: 'Male',
      },
    });

    // Associate doctor1 with clinic
    await prisma.doctorClinic.upsert({
      where: {
        doctorId_clinicId: {
          doctorId: doctor1Profile.id,
          clinicId: clinic.id,
        }
      },
      update: {
        inviteStatus: 'ACCEPTED',
        roleAtClinic: 'CONSULTANT',
        consultationFee: 800,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '09:00',
        endTime: '13:00',
        avgConsultationMins: 20,
        isActive: true,
        joinedAt: new Date(),
      },
      create: {
        doctorId: doctor1Profile.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        roleAtClinic: 'CONSULTANT',
        consultationFee: 800,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '09:00',
        endTime: '13:00',
        avgConsultationMins: 20,
        isActive: true,
        joinedAt: new Date(),
      },
    });

    console.log('   ✅ Doctor 1 Created:');
    console.log(`      Name: Dr. Amit Sharma`);
    console.log(`      Email: dr.sharma@test.com`);
    console.log(`      Password: Doctor123!`);
    console.log(`      Specialization: Cardiology`);
    console.log(`      Fee: ₹800`);
    console.log(`      Timing: 09:00 AM - 01:00 PM`);

    // ============================================================
    // 5. CREATE DOCTOR 2 (Orthopedic)
    // ============================================================
    console.log('\n👨‍⚕️ STEP 5: Creating Doctor 2 (Orthopedic)...\n');

    const doctor2Password = await bcrypt.hash('Doctor123!', 12);
    
    const doctor2User = await prisma.user.upsert({
      where: { email: 'dr.patel@test.com' },
      update: {
        name: 'Dr. Priya Patel',
        mobile: '9876543202',
        passwordHash: doctor2Password,
        role: 'DOCTOR',
        roles: ['DOCTOR'],
        primaryRole: 'DOCTOR',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
      create: {
        name: 'Dr. Priya Patel',
        email: 'dr.patel@test.com',
        mobile: '9876543202',
        passwordHash: doctor2Password,
        role: 'DOCTOR',
        roles: ['DOCTOR'],
        primaryRole: 'DOCTOR',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
    });

    const doctor2Profile = await prisma.doctorProfile.upsert({
      where: { userId: doctor2User.id },
      update: {
        qualification: 'MBBS, MS (Orthopedics)',
        specialization: 'Orthopedics',
        experienceYears: 12,
        consultationFee: 700,
        onlineAvailable: true,
        offlineAvailable: true,
        avgConsultationMins: 15,
        approvalStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        verificationStatus: 'VERIFIED',
        marketplaceVisible: true,
        bio: 'Experienced Orthopedic Surgeon specializing in joint replacement and sports injuries',
        areasOfExpertise: ['Joint Pain', 'Fractures', 'Sports Injuries', 'Arthritis'],
        languagesKnown: ['English', 'Hindi', 'Gujarati'],
        gender: 'Female',
      },
      create: {
        userId: doctor2User.id,
        qualification: 'MBBS, MS (Orthopedics)',
        specialization: 'Orthopedics',
        experienceYears: 12,
        consultationFee: 700,
        onlineAvailable: true,
        offlineAvailable: true,
        avgConsultationMins: 15,
        approvalStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        verificationStatus: 'VERIFIED',
        marketplaceVisible: true,
        bio: 'Experienced Orthopedic Surgeon specializing in joint replacement and sports injuries',
        areasOfExpertise: ['Joint Pain', 'Fractures', 'Sports Injuries', 'Arthritis'],
        languagesKnown: ['English', 'Hindi', 'Gujarati'],
        gender: 'Female',
      },
    });

    // Associate doctor2 with clinic
    await prisma.doctorClinic.upsert({
      where: {
        doctorId_clinicId: {
          doctorId: doctor2Profile.id,
          clinicId: clinic.id,
        }
      },
      update: {
        inviteStatus: 'ACCEPTED',
        roleAtClinic: 'CONSULTANT',
        consultationFee: 700,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '17:00',
        endTime: '22:00',
        avgConsultationMins: 15,
        isActive: true,
        joinedAt: new Date(),
      },
      create: {
        doctorId: doctor2Profile.id,
        clinicId: clinic.id,
        inviteStatus: 'ACCEPTED',
        roleAtClinic: 'CONSULTANT',
        consultationFee: 700,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '17:00',
        endTime: '22:00',
        avgConsultationMins: 15,
        isActive: true,
        joinedAt: new Date(),
      },
    });

    console.log('   ✅ Doctor 2 Created:');
    console.log(`      Name: Dr. Priya Patel`);
    console.log(`      Email: dr.patel@test.com`);
    console.log(`      Password: Doctor123!`);
    console.log(`      Specialization: Orthopedics`);
    console.log(`      Fee: ₹700`);
    console.log(`      Timing: 05:00 PM - 10:00 PM`);

    // ============================================================
    // 6. CREATE RECEPTIONIST
    // ============================================================
    console.log('\n👩‍💼 STEP 6: Creating Receptionist...\n');

    const receptionPassword = await bcrypt.hash('Reception123!', 12);
    
    const receptionUser = await prisma.user.upsert({
      where: { email: 'reception@test.com' },
      update: {
        name: 'Sneha Reddy',
        mobile: '9876543203',
        passwordHash: receptionPassword,
        role: 'RECEPTIONIST',
        roles: ['RECEPTIONIST'],
        primaryRole: 'RECEPTIONIST',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
      create: {
        name: 'Sneha Reddy',
        email: 'reception@test.com',
        mobile: '9876543203',
        passwordHash: receptionPassword,
        role: 'RECEPTIONIST',
        roles: ['RECEPTIONIST'],
        primaryRole: 'RECEPTIONIST',
        isActive: true,
        approvalStatus: 'VERIFIED',
        isEmailVerified: true,
        isPhoneVerified: true,
        authProvider: 'EMAIL_PASSWORD',
      },
    });

    await prisma.receptionistProfile.upsert({
      where: { userId: receptionUser.id },
      update: {
        assignedClinicId: clinic.id,
        createdByOwnerId: clinicOwner.id,
      },
      create: {
        userId: receptionUser.id,
        assignedClinicId: clinic.id,
        createdByOwnerId: clinicOwner.id,
      },
    });

    // Add to clinic staff
    await prisma.clinicStaff.upsert({
      where: {
        clinicId_userId: {
          clinicId: clinic.id,
          userId: receptionUser.id,
        }
      },
      update: {
        role: 'RECEPTIONIST',
        isActive: true,
      },
      create: {
        clinicId: clinic.id,
        userId: receptionUser.id,
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });

    console.log('   ✅ Receptionist Created:');
    console.log(`      Name: Sneha Reddy`);
    console.log(`      Email: reception@test.com`);
    console.log(`      Password: Reception123!`);
    console.log(`      Assigned Clinic: ${clinic.name}`);

    // ============================================================
    // 7. CREATE DOCTOR AVAILABILITY (9 AM - 10 PM)
    // ============================================================
    console.log('\n📅 STEP 7: Creating Doctor Availability Schedules...\n');

    // dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNumbers = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Doctor 1: Morning (9 AM - 1 PM)
    for (let i = 0; i < dayNumbers.length; i++) {
      await prisma.doctorAvailability.upsert({
        where: {
          doctorId_clinicId_dayOfWeek: {
            doctorId: doctor1Profile.id,
            clinicId: clinic.id,
            dayOfWeek: dayNumbers[i],
          }
        },
        update: {
          startTime: '09:00',
          endTime: '13:00',
          slotDurationMin: 20,
          maxPatients: 12,
          isActive: true,
        },
        create: {
          doctorId: doctor1Profile.id,
          clinicId: clinic.id,
          dayOfWeek: dayNumbers[i],
          startTime: '09:00',
          endTime: '13:00',
          slotDurationMin: 20,
          maxPatients: 12,
          isActive: true,
        },
      });
    }

    console.log('   ✅ Dr. Amit Sharma - Mon-Sat: 09:00 AM - 01:00 PM');

    // Doctor 2: Evening (5 PM - 10 PM)
    for (let i = 0; i < dayNumbers.length; i++) {
      await prisma.doctorAvailability.upsert({
        where: {
          doctorId_clinicId_dayOfWeek: {
            doctorId: doctor2Profile.id,
            clinicId: clinic.id,
            dayOfWeek: dayNumbers[i],
          }
        },
        update: {
          startTime: '17:00',
          endTime: '22:00',
          slotDurationMin: 15,
          maxPatients: 20,
          isActive: true,
        },
        create: {
          doctorId: doctor2Profile.id,
          clinicId: clinic.id,
          dayOfWeek: dayNumbers[i],
          startTime: '17:00',
          endTime: '22:00',
          slotDurationMin: 15,
          maxPatients: 20,
          isActive: true,
        },
      });
    }

    console.log('   ✅ Dr. Priya Patel - Mon-Sat: 05:00 PM - 10:00 PM');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ COMPLETE TEST CLINIC SETUP CREATED SUCCESSFULLY!\n');
    console.log('='.repeat(70));
    console.log('\n📋 SUMMARY:\n');
    
    console.log('🏥 CLINIC:');
    console.log(`   Name: ${clinic.name}`);
    console.log(`   Location: ${clinic.address}, ${clinic.city}`);
    console.log(`   Status: ✅ VERIFIED`);
    console.log(`   Clinic ID: ${clinic.id}`);
    console.log('');

    console.log('⏰ SESSIONS:');
    console.log(`   Morning: 09:00 AM - 01:00 PM (Max: 20 patients)`);
    console.log(`   Evening: 05:00 PM - 10:00 PM (Max: 30 patients)`);
    console.log('');

    console.log('👥 STAFF:');
    console.log('');
    console.log('   1. Clinic Owner:');
    console.log('      Name: Dr. Rajesh Kumar');
    console.log('      Email: clinic.owner@test.com');
    console.log('      Password: Owner123!');
    console.log('      Mobile: 9876543210');
    console.log('');
    console.log('   2. Doctor 1 (Cardiologist):');
    console.log('      Name: Dr. Amit Sharma');
    console.log('      Email: dr.sharma@test.com');
    console.log('      Password: Doctor123!');
    console.log('      Timing: 09:00 AM - 01:00 PM');
    console.log('      Fee: ₹800');
    console.log('');
    console.log('   3. Doctor 2 (Orthopedic):');
    console.log('      Name: Dr. Priya Patel');
    console.log('      Email: dr.patel@test.com');
    console.log('      Password: Doctor123!');
    console.log('      Timing: 05:00 PM - 10:00 PM');
    console.log('      Fee: ₹700');
    console.log('');
    console.log('   4. Receptionist:');
    console.log('      Name: Sneha Reddy');
    console.log('      Email: reception@test.com');
    console.log('      Password: Reception123!');
    console.log('');

    console.log('🌐 LOGIN URLS:');
    console.log('   Production: https://pulsemateconnect.in');
    console.log('   Local: http://localhost:3000');
    console.log('');

    console.log('✅ All accounts are ACTIVE and VERIFIED');
    console.log('✅ Ready for testing appointments and bookings!');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error creating test clinic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteClinic()
  .then(() => {
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
