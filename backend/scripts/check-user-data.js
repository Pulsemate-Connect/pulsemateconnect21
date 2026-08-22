const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log('=== CHECKING USER DATA ===\n');
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'shubham27052002@gmail.com' },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        role: true,
        approvalStatus: true,
        clinicOnboardingData: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      console.log('No user found with email: shubham27052002@gmail.com');
      return;
    }
    
    console.log('User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Mobile:', user.mobile);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Status:', user.approvalStatus);
    console.log('Created:', user.createdAt.toISOString().split('T')[0]);
    console.log('\nOnboarding Data:');
    
    if (user.clinicOnboardingData) {
      const data = user.clinicOnboardingData;
      console.log('Steps completed:', Object.keys(data).filter(k => !k.startsWith('last')).join(', '));
      console.log('Last step:', data.lastUpdatedStep || 'none');
      console.log('Complete:', data.onboardingComplete || false);
      
      if (data.clinicInformation) {
        console.log('\nStep 1 - Clinic Information:');
        console.log('  Clinic Name:', data.clinicInformation.clinicName || 'NOT SET');
        console.log('  Owner Mobile:', data.clinicInformation.ownerMobile || 'NOT SET');
        console.log('  Owner Email:', data.clinicInformation.ownerEmail || 'NOT SET');
      }
    } else {
      console.log('NO ONBOARDING DATA');
    }
    
    // Check for duplicate mobile
    if (user.mobile) {
      const duplicates = await prisma.user.count({
        where: {
          mobile: user.mobile,
          id: { not: user.id },
        },
      });
      console.log('\nDuplicate mobile check:', duplicates > 0 ? `⚠️ ${duplicates} other users with same mobile` : '✅ No duplicates');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
