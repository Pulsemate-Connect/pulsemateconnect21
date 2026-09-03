/**
 * Seed Demo Clinic with Doctors and Receptionist
 * 
 * Creates:
 * - 1 Clinic Owner
 * - 1 Approved Clinic (PulseMate Demo Clinic)
 * - 2 Doctors (Dr. Rajesh Kumar, Dr. Priya Sharma)
 * - 1 Receptionist (Sneha Patel)
 * 
 * All test numbers use OTP: 123456
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test credentials - all use OTP 123456
const DEMO_DATA = {
  clinicOwner: {
    name: 'Amit Verma',
    mobile: '+919876543210',
    email: 'clinic.owner@pulsemateconnect.in',
    password: 'Demo@123',  // Optional password login
  },
  clinic: {
    name: 'PulseMate Demo Clinic',
    phone: '+919876543210',
    address: '123 MG Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    landmark: 'Near Metro Station',
    latitude: 12.9716,
    longitude: 77.5946,
    clinicType: 'MULTI_SPECIALTY',
    specialties: ['General Medicine', 'Pediatrics', 'Dermatology', 'Orthopedics'],
    description: 'A modern multi-specialty clinic with experienced doctors and state-of-the-art facilities.',
    openingTime: '09:00',
    closingTime: '21:00',
    emergencyContactNumber: '+919876543210',
    facilities: ['Pharmacy', 'Lab', 'X-Ray', 'ECG', 'Ultrasound'],
    languagesSpoken: ['English', 'Hindi', 'Kannada', 'Tamil'],
    paymentMethods: ['CASH', 'UPI', 'CARD'],
  },
  doctors: [
    {
      name: 'Dr. Rajesh Kumar',
      mobile: '+919876543211',
      email: 'dr.rajesh@pulsemateconnect.in',
      password: 'Doctor@123',
      profile: {
        qualification: 'MBBS, MD (General Medicine)',
        specialization: 'General Physician',
        experienceYears: 15,
        education: 'MBBS from AIIMS Delhi, MD from JIPMER Puducherry',
        consultationFee: 500,
        bio: 'Experienced general physician with 15 years of practice. Specializes in diabetes, hypertension, and lifestyle diseases.',
        areasOfExpertise: ['Diabetes Management', 'Hypertension', 'Thyroid Disorders', 'Lifestyle Diseases'],
        languagesKnown: ['English', 'Hindi', 'Kannada'],
        gender: 'MALE',
        medicalRegistrationNumber: 'KMC12345',
        licenseNumber: 'KMC/2008/12345',
        avgConsultationMins: 15,
        onlineAvailable: true,
        offlineAvailable: true,
      },
    },
    {
      name: 'Dr. Priya Sharma',
      mobile: '+919876543212',
      email: 'dr.priya@pulsemateconnect.in',
      password: 'Doctor@123',
      profile: {
        qualification: 'MBBS, MD (Pediatrics)',
        specialization: 'Pediatrician',
        experienceYears: 10,
        education: 'MBBS from CMC Vellore, MD Pediatrics from St. Johns Medical College',
        consultationFee: 600,
        bio: 'Caring pediatrician specializing in child health, vaccinations, and growth monitoring.',
        areasOfExpertise: ['Child Health', 'Vaccinations', 'Growth Monitoring', 'Newborn Care'],
        languagesKnown: ['English', 'Hindi', 'Tamil'],
        gender: 'FEMALE',
        medicalRegistrationNumber: 'KMC54321',
        licenseNumber: 'KMC/2013/54321',
        avgConsultationMins: 20,
        onlineAvailable: true,
        offlineAvailable: true,
      },
    },
  ],
  receptionist: {
    name: 'Sneha Patel',
    mobile: '+919876543213',
    email: 'sneha.reception@pulsemateconnect.in',
    password: 'Reception@123',
  },
};

async function main() {
  console.log('🌱 Starting demo clinic seed...\n');

  try {
    // ============================================================================
    // 1. CREATE CLINIC OWNER
    // ============================================================================
    console.log('👤 Creating clinic owner...');
    
    const existingOwner = await prisma.user.findUnique({
      where: { mobile: DEMO_DATA.clinicOwner.mobile },
    });

    let clinicOwner;
    if (existingOwner) {
      console.log('   ✅ Clinic owner already exists');
      clinicOwner = existingOwner;
    } else {
      const passwordHash = await bcrypt.hash(DEMO_DATA.clinicOwner.password, 10);
      clinicOwner = await prisma.user.create({
        data: {
          name: DEMO_DATA.clinicOwner.name,
          mobile: DEMO_DATA.clinicOwner.mobile,
          email: DEMO_DATA.clinicOwner.email,
          passwordHash,
          role: 'CLINIC_OWNER',
          primaryRole: 'CLINIC_OWNER',
          roles: ['CLINIC_OWNER'],
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
        },
      });
      console.log(`   ✅ Created clinic owner: ${clinicOwner.name}`);
    }

    // ============================================================================
    // 2. CREATE CLINIC
    // ============================================================================
    console.log('\n🏥 Creating clinic...');
    
    const existingClinic = await prisma.clinic.findFirst({
      where: { 
        ownerId: clinicOwner.id,
        name: DEMO_DATA.clinic.name,
      },
    });

    let clinic;
    if (existingClinic) {
      console.log('   ✅ Clinic already exists');
      clinic = existingClinic;
    } else {
      clinic = await prisma.clinic.create({
        data: {
          ...DEMO_DATA.clinic,
          ownerId: clinicOwner.id,
          approvalStatus: 'VERIFIED',
          isVerified: true,
          isActive: true,
          ownerMobileVerified: true,
          ownerEmailVerified: true,
          submittedAt: new Date(),
          verifiedAt: new Date(),
        },
      });
      console.log(`   ✅ Created clinic: ${clinic.name}`);
    }

    // ============================================================================
    // 3. CREATE DOCTORS
    // ============================================================================
    console.log('\n👨‍⚕️ Creating doctors...');
    
    const doctors = [];
    for (const doctorData of DEMO_DATA.doctors) {
      const existingDoctor = await prisma.user.findUnique({
        where: { mobile: doctorData.mobile },
        include: { doctorProfile: true },
      });

      let doctor;
      let doctorProfile;
      if (existingDoctor) {
        console.log(`   ✅ Doctor already exists: ${doctorData.name}`);
        doctor = existingDoctor;
        doctorProfile = existingDoctor.doctorProfile;
      } else {
        const passwordHash = await bcrypt.hash(doctorData.password, 10);
        doctor = await prisma.user.create({
          data: {
            name: doctorData.name,
            mobile: doctorData.mobile,
            email: doctorData.email,
            passwordHash,
            role: 'DOCTOR',
            primaryRole: 'DOCTOR',
            roles: ['DOCTOR'],
            approvalStatus: 'VERIFIED',
            isPhoneVerified: true,
            isEmailVerified: true,
            isActive: true,
            doctorProfile: {
              create: {
                ...doctorData.profile,
                approvalStatus: 'VERIFIED',
                marketplaceVisible: true,
                profileStatus: 'COMPLETE',
                verificationStatus: 'VERIFIED',
                profileCompletionPercentage: 100,
              },
            },
          },
          include: { doctorProfile: true },
        });
        doctorProfile = doctor.doctorProfile;
        console.log(`   ✅ Created doctor: ${doctor.name}`);
      }
      doctors.push(doctor);

      // Link doctor to clinic (use doctorProfile.id, not user.id)
      const existingLink = await prisma.doctorClinic.findFirst({
        where: {
          clinicId: clinic.id,
          doctorId: doctorProfile.id,
        },
      });

      if (!existingLink) {
        await prisma.doctorClinic.create({
          data: {
            clinicId: clinic.id,
            doctorId: doctorProfile.id,
            inviteStatus: 'ACCEPTED',
            isActive: true,
          },
        });
        console.log(`   ✅ Linked ${doctor.name} to ${clinic.name}`);
      }
    }

    // ============================================================================
    // 4. CREATE RECEPTIONIST
    // ============================================================================
    console.log('\n📋 Creating receptionist...');
    
    const existingReceptionist = await prisma.user.findUnique({
      where: { mobile: DEMO_DATA.receptionist.mobile },
    });

    let receptionist;
    if (existingReceptionist) {
      console.log('   ✅ Receptionist already exists');
      receptionist = existingReceptionist;
    } else {
      const passwordHash = await bcrypt.hash(DEMO_DATA.receptionist.password, 10);
      receptionist = await prisma.user.create({
        data: {
          name: DEMO_DATA.receptionist.name,
          mobile: DEMO_DATA.receptionist.mobile,
          email: DEMO_DATA.receptionist.email,
          passwordHash,
          role: 'RECEPTIONIST',
          primaryRole: 'RECEPTIONIST',
          roles: ['RECEPTIONIST'],
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          receptionistProfile: {
            create: {
              assignedClinicId: clinic.id,
              createdByOwnerId: clinicOwner.id,
            },
          },
        },
      });
      console.log(`   ✅ Created receptionist: ${receptionist.name}`);
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMO CLINIC SETUP COMPLETE!');
    console.log('='.repeat(80));
    console.log('\n📋 TEST CREDENTIALS (All use OTP: 123456)\n');
    
    console.log('🏥 CLINIC OWNER:');
    console.log(`   Name:     ${DEMO_DATA.clinicOwner.name}`);
    console.log(`   Mobile:   ${DEMO_DATA.clinicOwner.mobile}`);
    console.log(`   Email:    ${DEMO_DATA.clinicOwner.email}`);
    console.log(`   Password: ${DEMO_DATA.clinicOwner.password}`);
    console.log(`   OTP:      123456`);
    
    console.log('\n👨‍⚕️ DOCTOR 1:');
    console.log(`   Name:     ${DEMO_DATA.doctors[0].name}`);
    console.log(`   Mobile:   ${DEMO_DATA.doctors[0].mobile}`);
    console.log(`   Email:    ${DEMO_DATA.doctors[0].email}`);
    console.log(`   Password: ${DEMO_DATA.doctors[0].password}`);
    console.log(`   OTP:      123456`);
    console.log(`   Specialty: ${DEMO_DATA.doctors[0].profile.specialization}`);
    
    console.log('\n👩‍⚕️ DOCTOR 2:');
    console.log(`   Name:     ${DEMO_DATA.doctors[1].name}`);
    console.log(`   Mobile:   ${DEMO_DATA.doctors[1].mobile}`);
    console.log(`   Email:    ${DEMO_DATA.doctors[1].email}`);
    console.log(`   Password: ${DEMO_DATA.doctors[1].password}`);
    console.log(`   OTP:      123456`);
    console.log(`   Specialty: ${DEMO_DATA.doctors[1].profile.specialization}`);
    
    console.log('\n📋 RECEPTIONIST:');
    console.log(`   Name:     ${DEMO_DATA.receptionist.name}`);
    console.log(`   Mobile:   ${DEMO_DATA.receptionist.mobile}`);
    console.log(`   Email:    ${DEMO_DATA.receptionist.email}`);
    console.log(`   Password: ${DEMO_DATA.receptionist.password}`);
    console.log(`   OTP:      123456`);
    
    console.log('\n🏥 CLINIC:');
    console.log(`   Name:     ${clinic.name}`);
    console.log(`   Location: ${clinic.address}, ${clinic.city}`);
    console.log(`   Status:   VERIFIED & ACTIVE`);
    console.log(`   Doctors:  2 (Linked)`);
    
    console.log('\n' + '='.repeat(80));
    console.log('📱 HOW TO TEST:');
    console.log('='.repeat(80));
    console.log('\n1. LOGIN WITH OTP:');
    console.log('   - Enter any test mobile number above');
    console.log('   - OTP will be: 123456');
    console.log('   - Works in both testMode and production');
    
    console.log('\n2. LOGIN WITH PASSWORD:');
    console.log('   - Email: Any email above');
    console.log('   - Password: Demo@123 (owner) or Doctor@123 or Reception@123');
    
    console.log('\n3. FIND DOCTORS:');
    console.log('   - Search for "PulseMate Demo Clinic"');
    console.log('   - Or browse doctors in Bangalore');
    
    console.log('\n4. BOOK APPOINTMENT:');
    console.log('   - Choose Dr. Rajesh Kumar (General Physician)');
    console.log('   - Or Dr. Priya Sharma (Pediatrician)');
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error seeding demo clinic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
