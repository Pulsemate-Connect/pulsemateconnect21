const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/hash');

const prisma = new PrismaClient();

async function createPainClinic() {
  try {
    console.log('🏥 Creating Pain Clinic Physiotherapy and Rehabilitation Center...\n');

    // Check if clinic already exists
    const existingClinic = await prisma.clinic.findFirst({
      where: {
        name: 'Pain Clinic Physiotherapy and Rehabilitation Center',
      },
    });

    if (existingClinic) {
      console.log('❌ Clinic already exists:', existingClinic.name);
      console.log('   Clinic ID:', existingClinic.id);
      return;
    }

    // Check if owner (Dr. Arjun Upadhyay) exists
    const drArjun = await prisma.user.findFirst({
      where: {
        mobile: '+919740809295',
      },
      include: {
        ownedClinics: true,
      },
    });

    let ownerId;
    let ownerCreated = false;

    if (drArjun) {
      console.log('✅ Found existing user: Dr. Arjun Upadhyay');
      console.log('   User ID:', drArjun.id);
      console.log('   Role:', drArjun.role);
      console.log('   Existing clinics:', drArjun.ownedClinics.length);
      ownerId = drArjun.id;
      
      // If not a clinic owner, update the role
      if (drArjun.role !== 'CLINIC_OWNER') {
        console.log('   ⚠️  User is not a CLINIC_OWNER, updating role...');
        await prisma.user.update({
          where: { id: drArjun.id },
          data: { role: 'CLINIC_OWNER' },
        });
        console.log('   ✅ Updated role to CLINIC_OWNER');
      }
    } else {
      console.log('📝 Creating new clinic owner account for Dr. Arjun Upadhyay...');
      
      // Create clinic owner account
      const hashedPassword = await hashPassword('Pain@2024');
      
      const newOwner = await prisma.user.create({
        data: {
          name: 'Dr. Arjun Upadhyay',
          mobile: '+919740809295',
          passwordHash: hashedPassword,
          role: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          isActive: true,
        },
      });

      ownerId = newOwner.id;
      ownerCreated = true;
      console.log('✅ Created clinic owner account');
      console.log('   User ID:', ownerId);
      console.log('   Mobile: +919740809295');
      console.log('   Password: Pain@2024');
    }

    // Create the clinic
    const clinic = await prisma.clinic.create({
      data: {
        // Basic Information
        name: 'Pain Clinic Physiotherapy and Rehabilitation Center',
        clinicType: 'Physiotherapy',
        description: 'Specialized physiotherapy, pain relief, and rehabilitation services led by Dr. Arjun Upadhyay. Offering back and joint pain treatments, sports injury management, manual therapy, acupuncture, and home visit facilities.',
        
        // Contact Information
        phone: '+919740809295',
        alternateEmail: 'painclinickarwar@gmail.com',
        
        // Address
        address: 'G8, Suman Laxmi Enclave, Kajubagh, Kodibag Road',
        landmark: 'Near Nagmangala Hospital',
        city: 'Karwar',
        state: 'Karnataka',
        pincode: '581301',
        
        // Location coordinates (approximate for Karwar, Kajubag area)
        latitude: 14.8142,
        longitude: 74.1288,
        
        // Operating Hours (simple time format)
        openingTime: '09:00',
        closingTime: '18:00',
        
        // Medical System
        medicalSystem: 'Physiotherapy',
        
        // Consultation Fee
        consultationFee: 300,
        
        // Status
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        verifiedAt: new Date(),
        
        // Owner
        ownerId: ownerId,
        
        // Website
        websiteUrl: 'https://painclinicphysiotherapy.whitecoats.com/',
      },
    });

    console.log('\n✅ Successfully created Pain Clinic!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Clinic Details:');
    console.log('   Clinic ID:', clinic.id);
    console.log('   Name:', clinic.name);
    console.log('   Type:', clinic.clinicType);
    console.log('   Address:', clinic.address);
    console.log('   City:', clinic.city);
    console.log('   Phone:', clinic.phone);
    console.log('   Status:', clinic.approvalStatus);
    console.log('   Active:', clinic.isActive);
    console.log('   Website:', clinic.websiteUrl);
    console.log('\n👤 Owner Details:');
    console.log('   Owner ID:', clinic.ownerId);
    console.log('   Name: Dr. Arjun Upadhyay');
    console.log('   Mobile: +919740809295');
    if (ownerCreated) {
      console.log('   Password: Pain@2024 (CHANGE THIS AFTER FIRST LOGIN)');
    }
    console.log('\n📍 Services:');
    console.log('   - Back pain treatment');
    console.log('   - Joint pain treatment');
    console.log('   - Sports injury management');
    console.log('   - Manual therapy');
    console.log('   - Acupuncture');
    console.log('   - Physiotherapy');
    console.log('   - Rehabilitation');
    console.log('   - Home visits');
    console.log('\n⏰ Hours:');
    console.log('   Monday - Friday: 9:00 AM - 6:00 PM');
    console.log('   Saturday: 9:00 AM - 2:00 PM');
    console.log('   Sunday: Closed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (ownerCreated) {
      console.log('\n🔐 LOGIN CREDENTIALS:');
      console.log('   Mobile: +919740809295');
      console.log('   Password: Pain@2024');
      console.log('   ⚠️  IMPORTANT: Change password after first login!');
    }

    console.log('\n✅ Clinic is now VERIFIED and ACTIVE!');
    console.log('✅ Can be found on mobile app by searching "Pain Clinic" or "Karwar"');

  } catch (error) {
    console.error('❌ Error creating clinic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createPainClinic()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
