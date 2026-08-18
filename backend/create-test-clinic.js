/**
 * Create Test Clinic - Admin Approved
 * 
 * This script creates a fully approved test clinic with:
 * - Clinic owner account (VERIFIED status)
 * - Complete clinic profile
 * - All required documents
 * - Admin approved
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestClinic() {
  try {
    console.log('\n🏥 Creating Test Clinic with Admin Approval...\n');

    // Check if test clinic owner already exists
    let owner = await prisma.user.findUnique({
      where: { email: 'testclinic@pulsemateconnect.in' },
      include: {
        ownedClinics: true
      }
    });

    if (owner && owner.ownedClinics.length > 0) {
      console.log('⚠️  Test clinic already exists!');
      console.log('📧 Email: testclinic@pulsemateconnect.in');
      console.log('🔑 Password: TestClinic123!');
      console.log(`🏥 Clinic: ${owner.ownedClinics[0].name}`);
      console.log('\nTo recreate, delete the existing clinic first or use a different email.\n');
      return;
    }

    // Check if owner user exists
    if (!owner) {
      // Create clinic owner user
      const passwordHash = await bcrypt.hash('TestClinic123!', 10);
      
      owner = await prisma.user.create({
        data: {
          name: 'Test Clinic Owner',
          email: 'testclinic@pulsemateconnect.in',
          mobile: '+919876543211',
          role: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED', // ✅ Admin approved
          passwordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: true,
          clinicOwnerProfile: {
            create: {
              profileCompleted: true,
            }
          }
        }
      });

      console.log('✅ Clinic owner created');
      console.log(`   ID: ${owner.id}`);
      console.log(`   Email: ${owner.email}`);
      console.log(`   Mobile: ${owner.mobile}`);
    } else {
      console.log('✅ Using existing clinic owner');
      console.log(`   ID: ${owner.id}`);
      console.log(`   Email: ${owner.email}`);
    }

    // Get admin user for verification
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
      console.error('❌ No admin user found. Please run database reset first.');
      return;
    }

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Test Medical Clinic',
        ownerId: owner.id,
        phone: '+919876543211',
        alternateEmail: 'support@testclinic.com',
        address: '123 Test Street, Medical Complex',
        landmark: 'Near Test Hospital',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        pincode: '400001',
        latitude: 19.0760,
        longitude: 72.8777,
        
        // Clinic Type
        clinicType: 'MULTI_SPECIALTY',
        doctorCount: 5,
        
        // Timing
        openingTime: '09:00',
        closingTime: '21:00',
        weeklySchedule: {
          monday: { open: true, slots: [{ start: '09:00', end: '21:00' }] },
          tuesday: { open: true, slots: [{ start: '09:00', end: '21:00' }] },
          wednesday: { open: true, slots: [{ start: '09:00', end: '21:00' }] },
          thursday: { open: true, slots: [{ start: '09:00', end: '21:00' }] },
          friday: { open: true, slots: [{ start: '09:00', end: '21:00' }] },
          saturday: { open: true, slots: [{ start: '09:00', end: '18:00' }] },
          sunday: { open: false, slots: [] }
        },
        
        // Services
        specialties: ['General Medicine', 'Pediatrics', 'Orthopedics', 'Gynecology'],
        consultationModes: ['WALK_IN', 'APPOINTMENT', 'ONLINE'],
        facilities: ['X-Ray', 'Lab', 'Pharmacy', 'Emergency', 'ICU', 'Operation Theater'],
        languagesSpoken: ['English', 'Hindi', 'Marathi'],
        paymentMethods: ['Cash', 'Card', 'UPI', 'Insurance'],
        insuranceSupported: ['Health Insurance', 'Government Schemes'],
        
        // Capacity
        avgConsultationMinutes: 15,
        appointmentSlotMinutes: 15,
        dailyPatientCapacity: 100,
        
        // Documents (mock URLs)
        licenseDocumentUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        medicalEstablishmentCertificateUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        gstCertificateUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        panCardUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        clinicLogoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        
        // Registration Details
        clinicRegistrationNumber: 'TEST-REG-2024-001',
        gstNumber: '27AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A',
        
        // Status
        isVerified: true,
        isActive: true,
        approvalStatus: 'VERIFIED', // ✅ Admin approved
        
        // Verification details
        ownerMobileVerified: true,
        ownerEmailVerified: true,
        mobileOtpVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        submittedAt: new Date(),
        verifiedAt: new Date(),
        verifiedById: admin.id,
        
        description: 'This is a test clinic with full admin approval for testing purposes. It includes all required information and documents.',
        
        emergencyContactNumber: '+919876543211',
        googleMapsLocation: 'https://maps.google.com/?q=19.0760,72.8777'
      }
    });

    console.log('\n✅ Test Clinic Created Successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🏥 Clinic Details:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   Name: ${clinic.name}`);
    console.log(`   ID: ${clinic.id}`);
    console.log(`   Status: ${clinic.approvalStatus} ✅`);
    console.log(`   Verified: ${clinic.isVerified ? 'Yes' : 'No'}`);
    console.log(`   Active: ${clinic.isActive ? 'Yes' : 'No'}`);
    console.log();
    console.log('👤 Owner Login Credentials:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Email: testclinic@pulsemateconnect.in');
    console.log('   Password: TestClinic123!');
    console.log('   Mobile: +919876543211');
    console.log();
    console.log('🌐 Access:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('   Login URL: http://localhost:3000/login/clinic-owner');
    console.log('   Dashboard: http://localhost:3000/clinic/dashboard');
    console.log();
    console.log('✨ This clinic is fully approved and ready to use!');
    console.log('═══════════════════════════════════════════════════════\n');

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'CLINIC_VERIFIED',
        entityType: 'Clinic',
        entityId: clinic.id,
        metadata: {
          clinicId: clinic.id,
          clinicName: clinic.name,
          ownerId: owner.id,
          ownerEmail: owner.email,
          note: 'Test clinic created via script with admin approval'
        }
      }
    });

    console.log('📝 Audit log created\n');

  } catch (error) {
    console.error('❌ Error creating test clinic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestClinic()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
