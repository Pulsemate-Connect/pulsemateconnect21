/**
 * Cleanup and Create Dr. Arjun's Clinics
 * First cleans up any existing data, then seeds fresh
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const MOBILE = '9901958611';

async function cleanup() {
  console.log('\n🧹 Cleaning up existing data...\n');

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { mobile: MOBILE },
      include: {
        ownedClinics: true,
        doctorProfile: true,
      }
    });

    if (!user) {
      console.log('  ℹ️  No existing user found.');
      return null;
    }

    console.log(`  Found user: ${user.name} (${user.mobile})`);

    // Delete related data
    if (user.doctorProfile) {
      const doctorId = user.doctorProfile.id;
      
      console.log('  Deleting doctor availability...');
      await prisma.doctorAvailability.deleteMany({ where: { doctorId } });
      
      console.log('  Deleting doctor-clinic links...');
      await prisma.doctorClinic.deleteMany({ where: { doctorId } });
      
      console.log('  Deleting clinic staff records...');
      await prisma.clinicStaff.deleteMany({ where: { userId: user.id } });
      
      console.log('  Deleting doctor profile...');
      await prisma.doctorProfile.delete({ where: { id: doctorId } });
    }

    // Delete clinic owner profile
    const ownerProfile = await prisma.clinicOwnerProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (ownerProfile) {
      console.log('  Deleting clinic owner profile...');
      await prisma.clinicOwnerProfile.delete({ where: { id: ownerProfile.id } });
    }

    // Delete clinics and their sessions
    if (user.ownedClinics && user.ownedClinics.length > 0) {
      for (const clinic of user.ownedClinics) {
        console.log(`  Deleting sessions for clinic: ${clinic.name}...`);
        await prisma.clinicSession.deleteMany({ where: { clinicId: clinic.id } });
        
        console.log(`  Deleting clinic: ${clinic.name}...`);
        await prisma.clinic.delete({ where: { id: clinic.id } });
      }
    }

    console.log('  ✅ Cleanup complete\n');
    return user;
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

async function seedClinics(existingUser) {
  console.log('🏥 Creating Dr. Arjun Upadhyay\'s Clinics...\n');

  const hashedPassword = await bcrypt.hash('Spine@2024', 10);

  try {
    // Step 1: Create/Update Owner
    console.log('👤 Step 1: Setting up clinic owner...');
    
    const owner = existingUser 
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: 'Dr. Arjun Upadhyay',
            email: 'arjun@spineclinicphysiotherapy.in',
            passwordHash: hashedPassword,
            role: 'CLINIC_OWNER',
            approvalStatus: 'VERIFIED',
            isActive: true,
            isPhoneVerified: true,
            isEmailVerified: true,
          }
        })
      : await prisma.user.create({
          data: {
            name: 'Dr. Arjun Upadhyay',
            mobile: MOBILE,
            email: 'arjun@spineclinicphysiotherapy.in',
            passwordHash: hashedPassword,
            role: 'CLINIC_OWNER',
            approvalStatus: 'VERIFIED',
            isActive: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            authProvider: 'EMAIL_PASSWORD',
          }
        });

    console.log(`  ✅ Owner ready: ${owner.name}`);

    // Step 2: Create Pain Clinic
    console.log('\n🏥 Step 2: Creating Pain Clinic Physiotherapy...');
    
    const painClinic = await prisma.clinic.create({
      data: {
        name: 'Pain Clinic Physiotherapy',
        ownerId: owner.id,
        phone: '9740809295',
        emergencyContactNumber: '9901958611',
        address: 'Suman Laxmi Enclave, Kodibag Road, Kajubag',
        city: 'Karwar',
        district: 'Uttara Kannada',
        state: 'Karnataka',
        pincode: '581301',
        landmark: 'At Nagmangala Hospital',
        latitude: 14.8142,
        longitude: 74.1297,
        clinicType: 'PHYSIOTHERAPY',
        specialties: ['PHYSIOTHERAPY', 'PAIN_MANAGEMENT', 'SPINE_REHABILITATION'],
        consultationModes: ['IN_PERSON'],
        description: 'Top-rated rehabilitation center specializing in back ache, joint pain, knee injuries, sprains, strains, nerve palsy, women\'s health, geriatric physiotherapy, and spine rehabilitation.',
        facilities: ['WHEELCHAIR_ACCESSIBLE', 'PARKING', 'WAITING_ROOM'],
        languagesSpoken: ['ENGLISH', 'HINDI', 'KANNADA', 'KONKANI'],
        paymentMethods: ['CASH', 'UPI', 'CARD'],
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        submittedAt: new Date(),
        verifiedAt: new Date(),
        openingTime: '09:30',
        closingTime: '20:00',
      }
    });

    console.log(`  ✅ Created: ${painClinic.name}`);
    console.log(`     Address: ${painClinic.address}, ${painClinic.city}`);

    // Step 3: Create Spine Clinic
    console.log('\n🏥 Step 3: Creating Spine Clinic Physiotherapy...');
    
    const spineClinic = await prisma.clinic.create({
      data: {
        name: 'Spine Clinic Physiotherapy',
        ownerId: owner.id,
        phone: '9901958622',
        emergencyContactNumber: '9901958611',
        address: 'NH-66, Majali',
        city: 'Karwar',
        district: 'Uttara Kannada',
        state: 'Karnataka',
        pincode: '581345',
        landmark: 'Near NH-66',
        latitude: 14.8869,
        longitude: 74.1090,
        clinicType: 'PHYSIOTHERAPY',
        specialties: ['PHYSIOTHERAPY', 'SPINE_REHABILITATION', 'SPORTS_MEDICINE', 'NEURO_REHABILITATION'],
        consultationModes: ['IN_PERSON'],
        description: 'Specialized rehabilitation center for spine, sports, and neurological conditions. Expert care for back and neck pain, spine rehabilitation, sports injury rehab, and neuro physiotherapy.',
        facilities: ['WHEELCHAIR_ACCESSIBLE', 'PARKING', 'WAITING_ROOM', 'EXERCISE_AREA'],
        languagesSpoken: ['ENGLISH', 'HINDI', 'KANNADA', 'KONKANI'],
        paymentMethods: ['CASH', 'UPI', 'CARD'],
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        submittedAt: new Date(),
        verifiedAt: new Date(),
        openingTime: '09:30',
        closingTime: '18:30',
      }
    });

    console.log(`  ✅ Created: ${spineClinic.name}`);
    console.log(`     Address: ${spineClinic.address}, ${spineClinic.city}`);

    // Step 4: Create Owner Profile
    console.log('\n👤 Step 4: Creating clinic owner profile...');
    
    await prisma.clinicOwnerProfile.create({
      data: {
        userId: owner.id,
        primaryClinicId: painClinic.id,
      }
    });

    console.log(`  ✅ Clinic owner profile created`);

    // Step 5: Create Doctor Profile
    console.log('\n👨‍⚕️ Step 5: Creating doctor profile...');
    
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: owner.id,
        specialization: 'PHYSIOTHERAPY',
        qualification: 'BPT, MPT (Sports Physiotherapy)',
        experienceYears: 12,
        consultationFee: 500,
        avgConsultationMins: 30,
        medicalRegistrationNumber: 'KAR-PHY-2012-001',
        bio: 'Dr. Arjun Upadhyay is a highly experienced physiotherapist specializing in spine rehabilitation, sports injuries, and neurological rehabilitation. With over 12 years of experience, he provides comprehensive care for back pain, joint pain, sports injuries, and post-surgical rehabilitation.',
        areasOfExpertise: [
          'Spine Rehabilitation',
          'Sports Injury Management',
          'Neuro Physiotherapy',
          'Women\'s Health Physiotherapy',
          'Geriatric Physiotherapy',
          'Pain Management',
          'Post-surgical Rehabilitation'
        ],
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        offlineAvailable: true,
        onlineAvailable: false,
      }
    });

    console.log(`  ✅ Doctor profile created`);

    // Step 6: Link to Pain Clinic
    console.log('\n🔗 Step 6: Linking doctor to Pain Clinic...');
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorProfile.id,
        clinicId: painClinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: 500,
        availableDays: [],
        startTime: '09:30',
        endTime: '20:00',
        avgConsultationMins: 30,
        isActive: true,
        joinedAt: new Date(),
      }
    });

    // Pain Clinic Availability (Mon-Sat: Morning 9:30-13:00, Evening 16:00-20:00)
    const painClinicDays = [1, 2, 3, 4, 5, 6];
    for (const day of painClinicDays) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: painClinic.id,
          dayOfWeek: day,
          startTime: '09:30',
          endTime: '20:00', // Full day availability
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 28, // Morning (12) + Evening (16)
        }
      });
    }

    await prisma.clinicStaff.create({
      data: {
        clinicId: painClinic.id,
        userId: owner.id,
        role: 'DOCTOR',
        isActive: true,
      }
    });

    console.log(`  ✅ Linked to Pain Clinic (Mon-Sat, 9:30AM-1PM, 4PM-8PM)`);

    // Step 7: Link to Spine Clinic
    console.log('\n🔗 Step 7: Linking doctor to Spine Clinic...');
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorProfile.id,
        clinicId: spineClinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: 500,
        availableDays: [],
        startTime: '09:30',
        endTime: '18:30',
        avgConsultationMins: 30,
        isActive: true,
        joinedAt: new Date(),
      }
    });

    // Spine Clinic Availability (Mon-Sat: Morning 9:30-14:00, Evening 15:00-18:30)
    const spineClinicDays = [1, 2, 3, 4, 5, 6];
    for (const day of spineClinicDays) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: spineClinic.id,
          dayOfWeek: day,
          startTime: '09:30',
          endTime: '18:30', // Full day availability
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 32, // Morning (18) + Evening (14)
        }
      });
    }

    await prisma.clinicStaff.create({
      data: {
        clinicId: spineClinic.id,
        userId: owner.id,
        role: 'DOCTOR',
        isActive: true,
      }
    });

    console.log(`  ✅ Linked to Spine Clinic (Mon-Sat, 9:30AM-2PM, 3PM-6:30PM)`);

    // Step 8: Create Sessions
    console.log('\n⏰ Step 8: Creating clinic sessions...');
    
    // Pain Clinic Sessions
    await prisma.clinicSession.createMany({
      data: [
        {
          clinicId: painClinic.id,
          sessionType: 'MORNING',
          name: 'Morning Session',
          startTime: '09:30',
          endTime: '13:00',
          maxPatients: 12,
          avgConsultationMins: 30,
          enabled: true,
          sortOrder: 1,
        },
        {
          clinicId: painClinic.id,
          sessionType: 'EVENING',
          name: 'Evening Session',
          startTime: '16:00',
          endTime: '20:00',
          maxPatients: 16,
          avgConsultationMins: 30,
          enabled: true,
          sortOrder: 2,
        }
      ]
    });

    // Spine Clinic Sessions
    await prisma.clinicSession.createMany({
      data: [
        {
          clinicId: spineClinic.id,
          sessionType: 'MORNING',
          name: 'Morning Session',
          startTime: '09:30',
          endTime: '14:00',
          maxPatients: 18,
          avgConsultationMins: 30,
          enabled: true,
          sortOrder: 1,
        },
        {
          clinicId: spineClinic.id,
          sessionType: 'EVENING',
          name: 'Evening Session',
          startTime: '15:00',
          endTime: '18:30',
          maxPatients: 14,
          avgConsultationMins: 30,
          enabled: true,
          sortOrder: 2,
        }
      ]
    });

    console.log(`  ✅ Sessions created for both clinics`);

    console.log('\n✅ Clinics created successfully!\n');

    // Print credentials
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('👨‍⚕️ DR. ARJUN UPADHYAY (Clinic Owner & Doctor)');
    console.log(`   Email: arjun@spineclinicphysiotherapy.in`);
    console.log(`   Mobile: ${MOBILE}`);
    console.log(`   Password: Spine@2024`);
    console.log(`   OTP (for mobile login): 123456`);
    
    console.log('\n🏥 PAIN CLINIC PHYSIOTHERAPY');
    console.log(`   Name: ${painClinic.name}`);
    console.log(`   Location: Kajubag, Karwar (At Nagmangala Hospital)`);
    console.log(`   Phone: 9740809295`);
    console.log(`   Timings: Mon-Sat, 9:30 AM - 1:00 PM, 4:00 PM - 8:00 PM`);
    console.log(`   Sunday: Closed`);
    
    console.log('\n🏥 SPINE CLINIC PHYSIOTHERAPY');
    console.log(`   Name: ${spineClinic.name}`);
    console.log(`   Location: Majali, Karwar (NH-66)`);
    console.log(`   Phone: 9901958622`);
    console.log(`   Timings: Mon-Sat, 9:30 AM - 2:00 PM, 3:00 PM - 6:30 PM`);
    console.log(`   Sunday: Closed`);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating clinics:', error);
    throw error;
  }
}

async function main() {
  try {
    const existingUser = await cleanup();
    await seedClinics(existingUser);
  } catch (error) {
    console.error('Fatal error:', error);
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
