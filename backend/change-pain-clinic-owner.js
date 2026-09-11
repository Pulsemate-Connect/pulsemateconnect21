const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/hash');

const prisma = new PrismaClient();

async function changeOwner() {
  try {
    console.log('🔄 Changing Pain Clinic owner to Dr. Sristhi Upadhyay...\n');

    // Step 1: Find the Pain Clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        name: 'Pain Clinic Physiotherapy and Rehabilitation Center',
      },
      include: {
        owner: true,
      },
    });

    if (!clinic) {
      console.log('❌ Pain Clinic not found!');
      return;
    }

    console.log('✅ Found Pain Clinic:');
    console.log(`   Clinic ID: ${clinic.id}`);
    console.log(`   Current Owner: ${clinic.owner.name} (${clinic.owner.mobile})`);
    console.log('');

    // Step 2: Check if new owner exists
    let newOwner = await prisma.user.findUnique({
      where: { mobile: '+918700798960' },
    });

    if (newOwner) {
      console.log('✅ Found existing user: Dr. Sristhi Upadhyay');
      console.log(`   User ID: ${newOwner.id}`);
      console.log(`   Current Role: ${newOwner.role}`);
      
      // Update role to CLINIC_OWNER if needed
      if (newOwner.role !== 'CLINIC_OWNER') {
        const updatedRoles = newOwner.roles || [newOwner.role];
        if (!updatedRoles.includes('CLINIC_OWNER')) {
          updatedRoles.push('CLINIC_OWNER');
        }

        newOwner = await prisma.user.update({
          where: { id: newOwner.id },
          data: {
            role: 'CLINIC_OWNER',
            roles: updatedRoles,
            primaryRole: 'CLINIC_OWNER',
            approvalStatus: 'VERIFIED',
            isPhoneVerified: true,
          },
        });
        console.log('   ✅ Updated role to CLINIC_OWNER');
      }
    } else {
      console.log('📝 Creating new owner: Dr. Sristhi Upadhyay');
      
      const hashedPassword = await hashPassword('Sristhi@2024');
      
      newOwner = await prisma.user.create({
        data: {
          name: 'Dr. Sristhi Upadhyay (OT)',
          mobile: '+918700798960',
          passwordHash: hashedPassword,
          role: 'CLINIC_OWNER',
          roles: ['CLINIC_OWNER'],
          primaryRole: 'CLINIC_OWNER',
          approvalStatus: 'VERIFIED',
          isPhoneVerified: true,
          isActive: true,
          authProvider: 'PHONE_OTP',
          registrationComplete: true,
          registrationCompletedAt: new Date(),
        },
      });
      
      console.log('   ✅ Created new owner account');
      console.log(`   User ID: ${newOwner.id}`);
      console.log(`   Mobile: +918700798960`);
      console.log(`   Password: Sristhi@2024`);
    }
    console.log('');

    // Step 3: Create/Update Clinic Owner Profile
    let ownerProfile = await prisma.clinicOwnerProfile.findUnique({
      where: { userId: newOwner.id },
    });

    if (!ownerProfile) {
      ownerProfile = await prisma.clinicOwnerProfile.create({
        data: {
          userId: newOwner.id,
          businessName: 'Pain Clinic Physiotherapy and Rehabilitation Center',
          designation: 'Occupational Therapist & Chief Executive',
          yearsInHealthcare: 5,
          bio: 'Experienced Occupational Therapist specializing in rehabilitation and patient care management.',
          profileCompleted: true,
        },
      });
      console.log('✅ Created clinic owner profile');
    } else {
      console.log('✅ Clinic owner profile exists');
    }
    console.log('');

    // Step 4: Update clinic owner
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        ownerId: newOwner.id,
        phone: '+918700798960',
      },
    });

    console.log('✅ Updated clinic owner:');
    console.log(`   Clinic: ${updatedClinic.name}`);
    console.log(`   New Owner ID: ${updatedClinic.ownerId}`);
    console.log(`   New Phone: ${updatedClinic.phone}`);
    console.log('');

    // Step 5: Update old owner's role if they have no other clinics
    const oldOwner = clinic.owner;
    const otherClinics = await prisma.clinic.count({
      where: {
        ownerId: oldOwner.id,
        id: { not: clinic.id },
      },
    });

    if (otherClinics === 0) {
      console.log('ℹ️  Old owner has no other clinics');
      console.log(`   You may want to update their role manually if needed`);
    } else {
      console.log(`ℹ️  Old owner still owns ${otherClinics} other clinic(s)`);
    }
    console.log('');

    // Final Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Ownership Transfer Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Clinic:');
    console.log(`   Name: ${updatedClinic.name}`);
    console.log(`   ID: ${updatedClinic.id}`);
    console.log('');
    console.log('👤 OLD OWNER:');
    console.log(`   Name: ${oldOwner.name}`);
    console.log(`   Mobile: ${oldOwner.mobile}`);
    console.log('');
    console.log('👤 NEW OWNER:');
    console.log(`   Name: ${newOwner.name}`);
    console.log(`   Mobile: ${newOwner.mobile}`);
    console.log(`   User ID: ${newOwner.id}`);
    console.log('');
    console.log('🔐 NEW OWNER LOGIN:');
    console.log(`   Mobile: +918700798960`);
    if (newOwner.createdAt.getTime() === newOwner.updatedAt.getTime()) {
      console.log(`   Password: Sristhi@2024`);
      console.log(`   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!`);
    }
    console.log('');
    console.log('✅ Dr. Sristhi Upadhyay can now login and manage the clinic!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

changeOwner()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
