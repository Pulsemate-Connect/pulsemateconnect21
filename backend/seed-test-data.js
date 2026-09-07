/**
 * Comprehensive Test Data Seed Script
 * Creates 2 clinics, 4 doctors, 2 receptionists with complete setup
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_DATA = {
  // 2 Clinic Owners
  clinicOwners: [
    {
      name: 'Test Clinic Owner 1',
      mobile: '9999999991',
      email: 'clinic1@test.com',
      password: 'Test@123',
      clinic: {
        name: 'Test Medical Center',
        phone: '8888888881',
        address: 'Test Street, Building A',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        latitude: 19.0760,
        longitude: 72.8777,
        clinicType: 'MULTI_SPECIALTY',
        specialties: ['GENERAL_MEDICINE', 'CARDIOLOGY'],
        consultationModes: ['IN_PERSON', 'VIDEO_CALL'],
        openingTime: '09:00',
        closingTime: '18:00',
      }
    },
    {
      name: 'Test Clinic Owner 2',
      mobile: '9999999992',
      email: 'clinic2@test.com',
      password: 'Test@123',
      clinic: {
        name: 'Test Wellness Clinic',
        phone: '8888888882',
        address: 'Test Avenue, Building B',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        latitude: 28.7041,
        longitude: 77.1025,
        clinicType: 'SPECIALTY',
        specialties: ['PHYSIOTHERAPY', 'ORTHOPEDICS'],
        consultationModes: ['IN_PERSON'],
        openingTime: '08:00',
        closingTime: '20:00',
      }
    }
  ],

  // 4 Doctors (2 per clinic)
  doctors: [
    {
      name: 'Dr. Test Kumar',
      mobile: '9999999993',
      email: 'doctor1@test.com',
      password: 'Test@123',
      profile: {
        specialization: 'GENERAL_MEDICINE',
        qualification: 'MBBS, MD',
        experienceYears: 10,
        consultationFee: 500,
        avgConsultationMins: 15,
        medicalRegistrationNumber: 'TEST-DOC-001',
      },
      clinicIndex: 0,
      availabilityDays: [1, 2, 3, 4, 5], // Monday-Friday
      startTime: '09:00',
      endTime: '13:00',
    },
    {
      name: 'Dr. Test Sharma',
      mobile: '9999999994',
      email: 'doctor2@test.com',
      password: 'Test@123',
      profile: {
        specialization: 'CARDIOLOGY',
        qualification: 'MBBS, MD (Cardiology)',
        experienceYears: 15,
        consultationFee: 800,
        avgConsultationMins: 20,
        medicalRegistrationNumber: 'TEST-DOC-002',
      },
      clinicIndex: 0,
      availabilityDays: [1, 3, 5, 6], // Mon, Wed, Fri, Sat
      startTime: '14:00',
      endTime: '18:00',
    },
    {
      name: 'Dr. Test Patel',
      mobile: '9999999995',
      email: 'doctor3@test.com',
      password: 'Test@123',
      profile: {
        specialization: 'PHYSIOTHERAPY',
        qualification: 'BPT, MPT',
        experienceYears: 8,
        consultationFee: 400,
        avgConsultationMins: 30,
        medicalRegistrationNumber: 'TEST-DOC-003',
      },
      clinicIndex: 1,
      availabilityDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
      startTime: '08:00',
      endTime: '14:00',
    },
    {
      name: 'Dr. Test Reddy',
      mobile: '9999999996',
      email: 'doctor4@test.com',
      password: 'Test@123',
      profile: {
        specialization: 'ORTHOPEDICS',
        qualification: 'MBBS, MS (Ortho)',
        experienceYears: 12,
        consultationFee: 700,
        avgConsultationMins: 20,
        medicalRegistrationNumber: 'TEST-DOC-004',
      },
      clinicIndex: 1,
      availabilityDays: [2, 3, 4, 6, 0], // Tue, Wed, Thu, Sat, Sun
      startTime: '15:00',
      endTime: '20:00',
    }
  ],

  // 2 Receptionists (1 per clinic)
  receptionists: [
    {
      name: 'Test Receptionist 1',
      mobile: '9999999997',
      email: 'reception1@test.com',
      password: 'Test@123',
      clinicIndex: 0,
    },
    {
      name: 'Test Receptionist 2',
      mobile: '9999999998',
      email: 'reception2@test.com',
      password: 'Test@123',
      clinicIndex: 1,
    }
  ],

  // Test OTP numbers
  testOtpNumbers: ['9999999991', '9999999992', '9999999993', '9999999994', '9999999995', '9999999996', '9999999997', '9999999998']
};

async function main() {
  console.log('\n🌱 Starting test data seeding...\n');

  const hashedPassword = await bcrypt.hash('Test@123', 10);
  const createdClinics = [];
  const createdDoctors = [];

  try {
    // Step 1: Create Clinic Owners and Clinics
    console.log('📋 Step 1: Creating clinic owners and clinics...');
    
    for (const ownerData of TEST_DATA.clinicOwners) {
      // Create clinic owner user
      const owner = await prisma.user.create({
        data: {
          name: ownerData.name,
          mobile: ownerData.mobile,
          email: ownerData.email,
          passwordHash: hashedPassword,
          role: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'EMAIL_PASSWORD',
        }
      });

      // Create clinic
      const clinic = await prisma.clinic.create({
        data: {
          ...ownerData.clinic,
          ownerId: owner.id,
          approvalStatus: 'VERIFIED',
          isVerified: true,
          isActive: true,
          submittedAt: new Date(),
          verifiedAt: new Date(),
        }
      });

      // Create clinic owner profile
      await prisma.clinicOwnerProfile.create({
        data: {
          userId: owner.id,
          primaryClinicId: clinic.id,
        }
      });

      createdClinics.push(clinic);
      console.log(`  ✅ Created: ${clinic.name} (Owner: ${owner.name})`);
    }

    // Step 2: Create Doctors with availability
    console.log('\n👨‍⚕️ Step 2: Creating doctors with availability...');
    
    for (const doctorData of TEST_DATA.doctors) {
      const clinic = createdClinics[doctorData.clinicIndex];

      // Create doctor user
      const doctor = await prisma.user.create({
        data: {
          name: doctorData.name,
          mobile: doctorData.mobile,
          email: doctorData.email,
          passwordHash: hashedPassword,
          role: 'DOCTOR',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'EMAIL_PASSWORD',
        }
      });

      // Create doctor profile
      const doctorProfile = await prisma.doctorProfile.create({
        data: {
          userId: doctor.id,
          ...doctorData.profile,
          approvalStatus: 'VERIFIED',
          verificationStatus: 'VERIFIED',
          profileStatus: 'COMPLETE',
        }
      });

      // Link doctor to clinic
      await prisma.doctorClinic.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          consultationFee: doctorData.profile.consultationFee,
          availableDays: [], // Not used in schema
          startTime: doctorData.startTime,
          endTime: doctorData.endTime,
          avgConsultationMins: doctorData.profile.avgConsultationMins,
          isActive: true,
          joinedAt: new Date(),
        }
      });

      // Create doctor availability for each day (dayOfWeek is Int: 0=Sun, 1=Mon, ..., 6=Sat)
      for (const day of doctorData.availabilityDays) {
        await prisma.doctorAvailability.create({
          data: {
            doctorId: doctorProfile.id,
            clinicId: clinic.id,
            dayOfWeek: day,
            startTime: doctorData.startTime,
            endTime: doctorData.endTime,
            isActive: true,
          }
        });
      }

      // Add doctor as clinic staff
      await prisma.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: doctor.id,
          role: 'DOCTOR',
          isActive: true,
        }
      });

      createdDoctors.push({ doctor, profile: doctorProfile, clinic });
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const availableDayNames = doctorData.availabilityDays.map(d => dayNames[d]).join(', ');
      console.log(`  ✅ Created: ${doctor.name} at ${clinic.name}`);
      console.log(`     Available: ${availableDayNames}, ${doctorData.startTime}-${doctorData.endTime}`);
    }

    // Step 3: Create Receptionists
    console.log('\n👥 Step 3: Creating receptionists...');
    
    for (const receptionistData of TEST_DATA.receptionists) {
      const clinic = createdClinics[receptionistData.clinicIndex];
      const owner = await prisma.user.findUnique({
        where: { id: clinic.ownerId }
      });

      // Create receptionist user
      const receptionist = await prisma.user.create({
        data: {
          name: receptionistData.name,
          mobile: receptionistData.mobile,
          email: receptionistData.email,
          passwordHash: hashedPassword,
          role: 'RECEPTIONIST',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'EMAIL_PASSWORD',
        }
      });

      // Create receptionist profile
      await prisma.receptionistProfile.create({
        data: {
          userId: receptionist.id,
          assignedClinicId: clinic.id,
          createdByOwnerId: owner.id,
        }
      });

      // Add receptionist as clinic staff
      await prisma.clinicStaff.create({
        data: {
          clinicId: clinic.id,
          userId: receptionist.id,
          role: 'RECEPTIONIST',
          isActive: true,
        }
      });

      console.log(`  ✅ Created: ${receptionist.name} at ${clinic.name}`);
    }

    // Step 4: Create clinic sessions
    console.log('\n⏰ Step 4: Creating clinic sessions...');
    
    for (const clinic of createdClinics) {
      // Morning session
      await prisma.clinicSession.create({
        data: {
          clinicId: clinic.id,
          sessionType: 'MORNING',
          name: 'Morning Session',
          startTime: '09:00',
          endTime: '13:00',
          maxPatients: 20,
          avgConsultationMins: 15,
          enabled: true,
          sortOrder: 1,
        }
      });

      // Evening session
      await prisma.clinicSession.create({
        data: {
          clinicId: clinic.id,
          sessionType: 'EVENING',
          name: 'Evening Session',
          startTime: '14:00',
          endTime: '18:00',
          maxPatients: 20,
          avgConsultationMins: 15,
          enabled: true,
          sortOrder: 2,
        }
      });

      console.log(`  ✅ Created sessions for: ${clinic.name}`);
    }

    console.log('\n✅ Test data seeding completed successfully!\n');

    // Print credentials
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 TEST CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🔐 DEFAULT PASSWORD FOR ALL ACCOUNTS: Test@123\n');

    console.log('🏥 CLINIC OWNERS:');
    TEST_DATA.clinicOwners.forEach((owner, i) => {
      console.log(`\n  ${i + 1}. ${owner.name}`);
      console.log(`     Email: ${owner.email}`);
      console.log(`     Mobile: ${owner.mobile}`);
      console.log(`     OTP: 123456 (test number)`);
      console.log(`     Clinic: ${owner.clinic.name}`);
    });

    console.log('\n\n👨‍⚕️ DOCTORS:');
    TEST_DATA.doctors.forEach((doctor, i) => {
      console.log(`\n  ${i + 1}. ${doctor.name}`);
      console.log(`     Email: ${doctor.email}`);
      console.log(`     Mobile: ${doctor.mobile}`);
      console.log(`     OTP: 123456 (test number)`);
      console.log(`     Specialization: ${doctor.profile.specialization}`);
      console.log(`     Clinic: ${TEST_DATA.clinicOwners[doctor.clinicIndex].clinic.name}`);
      console.log(`     Fee: ₹${doctor.profile.consultationFee}`);
    });

    console.log('\n\n👥 RECEPTIONISTS:');
    TEST_DATA.receptionists.forEach((receptionist, i) => {
      console.log(`\n  ${i + 1}. ${receptionist.name}`);
      console.log(`     Email: ${receptionist.email}`);
      console.log(`     Mobile: ${receptionist.mobile}`);
      console.log(`     OTP: 123456 (test number)`);
      console.log(`     Clinic: ${TEST_DATA.clinicOwners[receptionist.clinicIndex].clinic.name}`);
    });

    console.log('\n\n📱 TEST OTP CONFIGURATION:');
    console.log('   All test numbers will receive OTP: 123456');
    console.log('   Test numbers: ' + TEST_DATA.testOtpNumbers.join(', '));

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
