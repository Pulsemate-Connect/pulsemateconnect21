/**
 * Real Clinic Data Seed Script
 * Dr. Arjun Upadhyay's Pain Clinic and Spine Clinic
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CLINIC_DATA = {
  // Clinic Owner - Dr. Arjun Upadhyay
  owner: {
    name: 'Dr. Arjun Upadhyay',
    mobile: '9901958611',
    email: 'arjun@spineclinicphysiotherapy.in',
    password: 'Spine@2024',
  },

  // Clinic 1: Pain Clinic Physiotherapy (Kajubag, Karwar)
  painClinic: {
    name: 'Pain Clinic Physiotherapy',
    phone: '9740809295',
    alternatePhone: '9901958611',
    address: 'Suman Laxmi Enclave, Kodibag Road, Kajubag',
    locality: 'Kajubag',
    landmark: 'At Nagmangala Hospital',
    city: 'Karwar',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    pincode: '581301',
    latitude: 14.8142,
    longitude: 74.1297,
    clinicType: 'PHYSIOTHERAPY',
    specialties: ['PHYSIOTHERAPY', 'PAIN_MANAGEMENT', 'SPINE_REHABILITATION'],
    consultationModes: ['IN_PERSON'],
    description: 'Top-rated rehabilitation center specializing in back ache, joint pain, knee injuries, sprains, strains, nerve palsy, women\'s health, geriatric physiotherapy, and spine rehabilitation.',
    facilities: ['WHEELCHAIR_ACCESSIBLE', 'PARKING', 'WAITING_ROOM'],
    languagesSpoken: ['ENGLISH', 'HINDI', 'KANNADA', 'KONKANI'],
    paymentMethods: ['CASH', 'UPI', 'CARD'],
    
    // Timing: Mon-Sat 9:30AM-1PM, 4PM-8PM (Sunday Closed)
    morningStart: '09:30',
    morningEnd: '13:00',
    eveningStart: '16:00',
    eveningEnd: '20:00',
    weeklyOffDays: [0], // Sunday = 0
  },

  // Clinic 2: Spine Clinic Physiotherapy (Majali, Karwar)
  spineClinic: {
    name: 'Spine Clinic Physiotherapy',
    phone: '9901958622',
    alternatePhone: '9901958611',
    address: 'NH-66, Majali',
    locality: 'Majali',
    landmark: 'Near NH-66',
    city: 'Karwar',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    pincode: '581345',
    latitude: 14.8869,
    longitude: 74.1090,
    clinicType: 'PHYSIOTHERAPY',
    specialties: ['PHYSIOTHERAPY', 'SPINE_REHABILITATION', 'SPORTS_MEDICINE', 'NEURO_REHABILITATION'],
    consultationModes: ['IN_PERSON'],
    description: 'Specialized rehabilitation center for spine, sports, and neurological conditions. Expert care for back and neck pain, spine rehabilitation, sports injury rehab, and neuro physiotherapy.',
    facilities: ['WHEELCHAIR_ACCESSIBLE', 'PARKING', 'WAITING_ROOM', 'EXERCISE_AREA'],
    languagesSpoken: ['ENGLISH', 'HINDI', 'KANNADA', 'KONKANI'],
    paymentMethods: ['CASH', 'UPI', 'CARD'],
    
    // Timing: Mon-Sat 9:30AM-2PM, 3PM-6:30PM (Sunday Closed)
    morningStart: '09:30',
    morningEnd: '14:00',
    eveningStart: '15:00',
    eveningEnd: '18:30',
    weeklyOffDays: [0], // Sunday = 0
  },

  // Dr. Arjun Upadhyay - Doctor Profile
  doctorProfile: {
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
    
    // Pain Clinic Availability (Mon-Sat, 9:30AM-1PM, 4PM-8PM)
    painClinicDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    painClinicMorning: { start: '09:30', end: '13:00' },
    painClinicEvening: { start: '16:00', end: '20:00' },
    
    // Spine Clinic Availability (Mon-Sat, 9:30AM-2PM, 3PM-6:30PM)
    spineClinicDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    spineClinicMorning: { start: '09:30', end: '14:00' },
    spineClinicEvening: { start: '15:00', end: '18:30' },
  }
};

async function main() {
  console.log('\n🏥 Creating Dr. Arjun Upadhyay\'s Clinics...\n');

  const hashedPassword = await bcrypt.hash(CLINIC_DATA.owner.password, 10);

  try {
    // Step 1: Create or Find Clinic Owner
    console.log('👤 Step 1: Creating/finding clinic owner...');
    
    let owner = await prisma.user.findUnique({
      where: { mobile: CLINIC_DATA.owner.mobile }
    });

    if (owner) {
      console.log(`  ℹ️  User already exists: ${owner.name} (${owner.mobile})`);
      console.log(`  🔄 Updating user details...`);
      
      owner = await prisma.user.update({
        where: { id: owner.id },
        data: {
          name: CLINIC_DATA.owner.name,
          email: CLINIC_DATA.owner.email,
          passwordHash: hashedPassword,
          role: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
        }
      });
      
      console.log(`  ✅ Updated: ${owner.name}`);
    } else {
      owner = await prisma.user.create({
        data: {
          name: CLINIC_DATA.owner.name,
          mobile: CLINIC_DATA.owner.mobile,
          email: CLINIC_DATA.owner.email,
          passwordHash: hashedPassword,
          role: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          isActive: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          authProvider: 'EMAIL_PASSWORD',
        }
      });
      
      console.log(`  ✅ Created: ${owner.name}`);
    }

    // Step 2: Create Pain Clinic
    console.log('\n🏥 Step 2: Creating Pain Clinic Physiotherapy...');
    
    const painClinic = await prisma.clinic.create({
      data: {
        name: CLINIC_DATA.painClinic.name,
        ownerId: owner.id,
        phone: CLINIC_DATA.painClinic.phone,
        emergencyContactNumber: CLINIC_DATA.painClinic.alternatePhone,
        address: CLINIC_DATA.painClinic.address,
        city: CLINIC_DATA.painClinic.city,
        district: CLINIC_DATA.painClinic.district,
        state: CLINIC_DATA.painClinic.state,
        pincode: CLINIC_DATA.painClinic.pincode,
        landmark: CLINIC_DATA.painClinic.landmark,
        latitude: CLINIC_DATA.painClinic.latitude,
        longitude: CLINIC_DATA.painClinic.longitude,
        clinicType: CLINIC_DATA.painClinic.clinicType,
        specialties: CLINIC_DATA.painClinic.specialties,
        consultationModes: CLINIC_DATA.painClinic.consultationModes,
        description: CLINIC_DATA.painClinic.description,
        facilities: CLINIC_DATA.painClinic.facilities,
        languagesSpoken: CLINIC_DATA.painClinic.languagesSpoken,
        paymentMethods: CLINIC_DATA.painClinic.paymentMethods,
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        submittedAt: new Date(),
        verifiedAt: new Date(),
        openingTime: CLINIC_DATA.painClinic.morningStart,
        closingTime: CLINIC_DATA.painClinic.eveningEnd,
      }
    });

    console.log(`  ✅ Created: ${painClinic.name}`);
    console.log(`     Address: ${painClinic.address}, ${painClinic.city}`);
    console.log(`     Phone: ${painClinic.phone}`);

    // Step 3: Create Spine Clinic
    console.log('\n🏥 Step 3: Creating Spine Clinic Physiotherapy...');
    
    const spineClinic = await prisma.clinic.create({
      data: {
        name: CLINIC_DATA.spineClinic.name,
        ownerId: owner.id,
        phone: CLINIC_DATA.spineClinic.phone,
        emergencyContactNumber: CLINIC_DATA.spineClinic.alternatePhone,
        address: CLINIC_DATA.spineClinic.address,
        city: CLINIC_DATA.spineClinic.city,
        district: CLINIC_DATA.spineClinic.district,
        state: CLINIC_DATA.spineClinic.state,
        pincode: CLINIC_DATA.spineClinic.pincode,
        landmark: CLINIC_DATA.spineClinic.landmark,
        latitude: CLINIC_DATA.spineClinic.latitude,
        longitude: CLINIC_DATA.spineClinic.longitude,
        clinicType: CLINIC_DATA.spineClinic.clinicType,
        specialties: CLINIC_DATA.spineClinic.specialties,
        consultationModes: CLINIC_DATA.spineClinic.consultationModes,
        description: CLINIC_DATA.spineClinic.description,
        facilities: CLINIC_DATA.spineClinic.facilities,
        languagesSpoken: CLINIC_DATA.spineClinic.languagesSpoken,
        paymentMethods: CLINIC_DATA.spineClinic.paymentMethods,
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        submittedAt: new Date(),
        verifiedAt: new Date(),
        openingTime: CLINIC_DATA.spineClinic.morningStart,
        closingTime: CLINIC_DATA.spineClinic.eveningEnd,
      }
    });

    console.log(`  ✅ Created: ${spineClinic.name}`);
    console.log(`     Address: ${spineClinic.address}, ${spineClinic.city}`);
    console.log(`     Phone: ${spineClinic.phone}`);

    // Step 4: Create Clinic Owner Profile
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
        specialization: CLINIC_DATA.doctorProfile.specialization,
        qualification: CLINIC_DATA.doctorProfile.qualification,
        experienceYears: CLINIC_DATA.doctorProfile.experienceYears,
        consultationFee: CLINIC_DATA.doctorProfile.consultationFee,
        avgConsultationMins: CLINIC_DATA.doctorProfile.avgConsultationMins,
        medicalRegistrationNumber: CLINIC_DATA.doctorProfile.medicalRegistrationNumber,
        bio: CLINIC_DATA.doctorProfile.bio,
        areasOfExpertise: CLINIC_DATA.doctorProfile.areasOfExpertise,
        approvalStatus: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        profileStatus: 'COMPLETE',
        offlineAvailable: true,
        onlineAvailable: false,
      }
    });

    console.log(`  ✅ Doctor profile created`);
    console.log(`     Specialization: ${doctorProfile.specialization}`);
    console.log(`     Qualification: ${doctorProfile.qualification}`);

    // Step 6: Link Doctor to Pain Clinic
    console.log('\n🔗 Step 6: Linking doctor to Pain Clinic...');
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorProfile.id,
        clinicId: painClinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: CLINIC_DATA.doctorProfile.consultationFee,
        availableDays: [],
        startTime: CLINIC_DATA.doctorProfile.painClinicMorning.start,
        endTime: CLINIC_DATA.doctorProfile.painClinicEvening.end,
        avgConsultationMins: CLINIC_DATA.doctorProfile.avgConsultationMins,
        isActive: true,
        joinedAt: new Date(),
      }
    });

    // Pain Clinic Availability - Morning & Evening (Mon-Sat)
    for (const day of CLINIC_DATA.doctorProfile.painClinicDays) {
      // Morning session
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: painClinic.id,
          dayOfWeek: day,
          startTime: CLINIC_DATA.doctorProfile.painClinicMorning.start,
          endTime: CLINIC_DATA.doctorProfile.painClinicMorning.end,
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 12,
        }
      });
      
      // Evening session
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: painClinic.id,
          dayOfWeek: day,
          startTime: CLINIC_DATA.doctorProfile.painClinicEvening.start,
          endTime: CLINIC_DATA.doctorProfile.painClinicEvening.end,
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 16,
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

    console.log(`  ✅ Doctor linked to Pain Clinic`);
    console.log(`     Availability: Mon-Sat, 9:30AM-1PM, 4PM-8PM`);

    // Step 7: Link Doctor to Spine Clinic
    console.log('\n🔗 Step 7: Linking doctor to Spine Clinic...');
    
    await prisma.doctorClinic.create({
      data: {
        doctorId: doctorProfile.id,
        clinicId: spineClinic.id,
        inviteStatus: 'ACCEPTED',
        consultationFee: CLINIC_DATA.doctorProfile.consultationFee,
        availableDays: [],
        startTime: CLINIC_DATA.doctorProfile.spineClinicMorning.start,
        endTime: CLINIC_DATA.doctorProfile.spineClinicEvening.end,
        avgConsultationMins: CLINIC_DATA.doctorProfile.avgConsultationMins,
        isActive: true,
        joinedAt: new Date(),
      }
    });

    // Spine Clinic Availability - Morning & Evening (Mon-Sat)
    for (const day of CLINIC_DATA.doctorProfile.spineClinicDays) {
      // Morning session
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: spineClinic.id,
          dayOfWeek: day,
          startTime: CLINIC_DATA.doctorProfile.spineClinicMorning.start,
          endTime: CLINIC_DATA.doctorProfile.spineClinicMorning.end,
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 18,
        }
      });
      
      // Evening session
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doctorProfile.id,
          clinicId: spineClinic.id,
          dayOfWeek: day,
          startTime: CLINIC_DATA.doctorProfile.spineClinicEvening.start,
          endTime: CLINIC_DATA.doctorProfile.spineClinicEvening.end,
          isActive: true,
          slotDurationMin: 30,
          maxPatients: 14,
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

    console.log(`  ✅ Doctor linked to Spine Clinic`);
    console.log(`     Availability: Mon-Sat, 9:30AM-2PM, 3PM-6:30PM`);

    // Step 8: Create Clinic Sessions
    console.log('\n⏰ Step 8: Creating clinic sessions...');
    
    // Pain Clinic Sessions
    await prisma.clinicSession.create({
      data: {
        clinicId: painClinic.id,
        sessionType: 'MORNING',
        name: 'Morning Session',
        startTime: CLINIC_DATA.painClinic.morningStart,
        endTime: CLINIC_DATA.painClinic.morningEnd,
        maxPatients: 12,
        avgConsultationMins: 30,
        enabled: true,
        sortOrder: 1,
      }
    });

    await prisma.clinicSession.create({
      data: {
        clinicId: painClinic.id,
        sessionType: 'EVENING',
        name: 'Evening Session',
        startTime: CLINIC_DATA.painClinic.eveningStart,
        endTime: CLINIC_DATA.painClinic.eveningEnd,
        maxPatients: 16,
        avgConsultationMins: 30,
        enabled: true,
        sortOrder: 2,
      }
    });

    // Spine Clinic Sessions
    await prisma.clinicSession.create({
      data: {
        clinicId: spineClinic.id,
        sessionType: 'MORNING',
        name: 'Morning Session',
        startTime: CLINIC_DATA.spineClinic.morningStart,
        endTime: CLINIC_DATA.spineClinic.morningEnd,
        maxPatients: 18,
        avgConsultationMins: 30,
        enabled: true,
        sortOrder: 1,
      }
    });

    await prisma.clinicSession.create({
      data: {
        clinicId: spineClinic.id,
        sessionType: 'EVENING',
        name: 'Evening Session',
        startTime: CLINIC_DATA.spineClinic.eveningStart,
        endTime: CLINIC_DATA.spineClinic.eveningEnd,
        maxPatients: 14,
        avgConsultationMins: 30,
        enabled: true,
        sortOrder: 2,
      }
    });

    console.log(`  ✅ Sessions created for both clinics`);

    console.log('\n✅ Clinics created successfully!\n');

    // Print credentials
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('👨‍⚕️ DR. ARJUN UPADHYAY (Clinic Owner & Doctor)');
    console.log(`   Email: ${CLINIC_DATA.owner.email}`);
    console.log(`   Mobile: ${CLINIC_DATA.owner.mobile}`);
    console.log(`   Password: ${CLINIC_DATA.owner.password}`);
    console.log(`   OTP (for mobile login): 123456`);
    
    console.log('\n🏥 PAIN CLINIC PHYSIOTHERAPY');
    console.log(`   Name: ${painClinic.name}`);
    console.log(`   Location: Kajubag, Karwar`);
    console.log(`   Phone: ${CLINIC_DATA.painClinic.phone}`);
    console.log(`   Timings: Mon-Sat, 9:30 AM - 1:00 PM, 4:00 PM - 8:00 PM`);
    console.log(`   Sunday: Closed`);
    
    console.log('\n🏥 SPINE CLINIC PHYSIOTHERAPY');
    console.log(`   Name: ${spineClinic.name}`);
    console.log(`   Location: Majali, Karwar`);
    console.log(`   Phone: ${CLINIC_DATA.spineClinic.phone}`);
    console.log(`   Timings: Mon-Sat, 9:30 AM - 2:00 PM, 3:00 PM - 6:30 PM`);
    console.log(`   Sunday: Closed`);
    
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating clinics:', error);
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
