/**
 * Create Complete Test Clinic with Verified Email and Mobile
 * This creates a clinic ready for admin verification
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testClinicData = {
  // Owner details
  owner: {
    name: 'Test Clinic Owner',
    email: 'testclinic@gmail.com',
    mobile: '+919876543210',
    password: process.env.TEST_CLINIC_PASSWORD || 'TestClinic@123',
  },
  
  // Clinic details
  clinic: {
    name: 'Test Medical Clinic',
    phone: '+919876543211',
    address: '123 Test Street, Medical District',
    city: 'Bangalore',
    state: 'Karnataka',
    district: 'Bangalore Urban',
    pincode: '560001',
    landmark: 'Near Test Hospital',
    clinicType: 'GENERAL_CLINIC',
    description: 'A test clinic for verification purposes',
    
    // License and documents
    clinicRegistrationNumber: 'TEST-REG-2024-001',
    licenseDocumentUrl: 'https://example.com/test-license.pdf',
    
    // Opening hours
    openingTime: '09:00',
    closingTime: '18:00',
    
    // Additional info
    specialties: ['General Medicine', 'Pediatrics'],
    facilities: ['Consultation Room', 'Pharmacy'],
    languagesSpoken: ['English', 'Hindi', 'Kannada'],
    consultationModes: ['OFFLINE', 'ONLINE'],
    paymentMethods: ['CASH', 'UPI', 'CARD'],
  }
};

async function createTestClinic() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  Creating Test Clinic for Admin Verification');
  console.log('════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create or update user
    console.log('Step 1: Creating clinic owner account...');
    const passwordHash = await bcrypt.hash(testClinicData.owner.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: testClinicData.owner.email },
      update: {
        name: testClinicData.owner.name,
        mobile: testClinicData.owner.mobile,
        passwordHash,
        role: 'CLINIC_OWNER',
        approvalStatus: 'PENDING', // Will be VERIFIED after admin approval
        authProvider: 'EMAIL_PASSWORD',
        isActive: true,
        isEmailVerified: true, // ✅ Email verified via OTP
        isPhoneVerified: true, // ✅ Mobile verified via OTP
      },
      create: {
        name: testClinicData.owner.name,
        email: testClinicData.owner.email,
        mobile: testClinicData.owner.mobile,
        passwordHash,
        role: 'CLINIC_OWNER',
        approvalStatus: 'PENDING',
        authProvider: 'EMAIL_PASSWORD',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    console.log(`  ✓ User created: ${user.id}`);
    console.log(`  ✓ Email: ${user.email}`);
    console.log(`  ✓ Mobile: ${user.mobile}`);
    console.log(`  ✓ Email Verified: ${user.isEmailVerified}`);
    console.log(`  ✓ Phone Verified: ${user.isPhoneVerified}\n`);

    // Step 2: Create clinic owner profile
    console.log('Step 2: Creating clinic owner profile...');
    
    const ownerProfile = await prisma.clinicOwnerProfile.upsert({
      where: { userId: user.id },
      update: {
        profileCompleted: true,
      },
      create: {
        userId: user.id,
        profileCompleted: true,
      },
    });

    console.log(`  ✓ Owner profile created: ${ownerProfile.id}\n`);

    // Step 3: Create clinic
    console.log('Step 3: Creating clinic...');
    
    // Check if clinic already exists for this owner
    const existingClinic = await prisma.clinic.findFirst({
      where: { ownerId: user.id },
    });

    let clinic;
    if (existingClinic) {
      // Update existing clinic
      clinic = await prisma.clinic.update({
        where: { id: existingClinic.id },
        data: {
          name: testClinicData.clinic.name,
          phone: testClinicData.clinic.phone,
          address: testClinicData.clinic.address,
          city: testClinicData.clinic.city,
          state: testClinicData.clinic.state,
          district: testClinicData.clinic.district,
          pincode: testClinicData.clinic.pincode,
          landmark: testClinicData.clinic.landmark,
          clinicType: testClinicData.clinic.clinicType,
          description: testClinicData.clinic.description,
          clinicRegistrationNumber: testClinicData.clinic.clinicRegistrationNumber,
          licenseDocumentUrl: testClinicData.clinic.licenseDocumentUrl,
          openingTime: testClinicData.clinic.openingTime,
          closingTime: testClinicData.clinic.closingTime,
          specialties: testClinicData.clinic.specialties,
          facilities: testClinicData.clinic.facilities,
          languagesSpoken: testClinicData.clinic.languagesSpoken,
          consultationModes: testClinicData.clinic.consultationModes,
          paymentMethods: testClinicData.clinic.paymentMethods,
          approvalStatus: 'PENDING', // Ready for admin verification
          isVerified: false,
          isActive: true,
          submittedAt: new Date(),
          ownerMobileVerified: true, // ✅ Mobile OTP verified
          ownerEmailVerified: true,  // ✅ Email OTP verified
          mobileOtpVerifiedAt: new Date(),
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`  ✓ Clinic updated: ${clinic.id}`);
    } else {
      // Create new clinic
      clinic = await prisma.clinic.create({
        data: {
          ownerId: user.id,
          name: testClinicData.clinic.name,
          phone: testClinicData.clinic.phone,
          address: testClinicData.clinic.address,
          city: testClinicData.clinic.city,
          state: testClinicData.clinic.state,
          district: testClinicData.clinic.district,
          pincode: testClinicData.clinic.pincode,
          landmark: testClinicData.clinic.landmark,
          clinicType: testClinicData.clinic.clinicType,
          description: testClinicData.clinic.description,
          clinicRegistrationNumber: testClinicData.clinic.clinicRegistrationNumber,
          licenseDocumentUrl: testClinicData.clinic.licenseDocumentUrl,
          openingTime: testClinicData.clinic.openingTime,
          closingTime: testClinicData.clinic.closingTime,
          specialties: testClinicData.clinic.specialties,
          facilities: testClinicData.clinic.facilities,
          languagesSpoken: testClinicData.clinic.languagesSpoken,
          consultationModes: testClinicData.clinic.consultationModes,
          paymentMethods: testClinicData.clinic.paymentMethods,
          approvalStatus: 'PENDING',
          isVerified: false,
          isActive: true,
          submittedAt: new Date(),
          ownerMobileVerified: true,
          ownerEmailVerified: true,
          mobileOtpVerifiedAt: new Date(),
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`  ✓ Clinic created: ${clinic.id}`);
    }

    console.log(`  ✓ Clinic Name: ${clinic.name}`);
    console.log(`  ✓ Status: ${clinic.approvalStatus}`);
    console.log(`  ✓ Mobile Verified: ${clinic.ownerMobileVerified}`);
    console.log(`  ✓ Email Verified: ${clinic.ownerEmailVerified}\n`);

    // Step 4: Update owner profile with primary clinic
    console.log('Step 4: Setting primary clinic...');
    
    await prisma.clinicOwnerProfile.update({
      where: { userId: user.id },
      data: {
        primaryClinicId: clinic.id,
        totalClinics: 1,
      },
    });

    console.log(`  ✓ Primary clinic set\n`);

    // Summary
    console.log('════════════════════════════════════════════════════');
    console.log('  ✅ Test Clinic Created Successfully!');
    console.log('════════════════════════════════════════════════════\n');

    console.log('📋 Clinic Owner Login Credentials:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Email:    ${testClinicData.owner.email}`);
    console.log(`Password: [SET - Check TEST_CLINIC_PASSWORD env var]`);
    console.log(`Mobile:   ${testClinicData.owner.mobile}`);
    console.log('─────────────────────────────────────────────────────\n');

    console.log('🏥 Clinic Details:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Name:     ${clinic.name}`);
    console.log(`Status:   ${clinic.approvalStatus} (Ready for admin verification)`);
    console.log(`City:     ${clinic.city}, ${clinic.state}`);
    console.log(`Address:  ${clinic.address}`);
    console.log('─────────────────────────────────────────────────────\n');

    console.log('✅ Verification Status:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Email Verified:  ✅ ${user.isEmailVerified ? 'YES' : 'NO'}`);
    console.log(`Mobile Verified: ✅ ${user.isPhoneVerified ? 'YES' : 'NO'}`);
    console.log(`Submitted At:    ✅ ${clinic.submittedAt?.toISOString()}`);
    console.log('─────────────────────────────────────────────────────\n');

    console.log('🔍 Next Steps:');
    console.log('─────────────────────────────────────────────────────');
    console.log('1. Login as admin at: http://localhost:3000/admin');
    console.log('2. Go to "Clinic Verifications" or "Pending Approvals"');
    console.log(`3. Find clinic: "${clinic.name}"`);
    console.log('4. Review details and approve/reject');
    console.log('─────────────────────────────────────────────────────\n');

    console.log('📱 Test OTP Numbers (for development):');
    console.log('─────────────────────────────────────────────────────');
    console.log('Mobile: 9999999999, 8888888888, 7777777777');
    console.log('OTP:    123456');
    console.log('Email:  test@gmail.com, testclinic@gmail.com');
    console.log('─────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Error creating test clinic:', error.message);
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestClinic()
  .then(() => {
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
