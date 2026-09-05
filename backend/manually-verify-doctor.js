/**
 * Emergency script to manually verify a doctor's mobile and email
 * Use when OTP system is failing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function manuallyVerifyDoctor() {
  try {
    const mobile = '+919663080521';
    const invitationToken = 'acdd76c04822e5484dc6b22e64540e297cbc80553987fce83a63ee1ce57e3740';
    
    console.log('\n🚨 EMERGENCY MANUAL VERIFICATION');
    console.log('═══════════════════════════════════════\n');
    
    // Find invitation
    const invitation = await prisma.doctorInvitation.findUnique({
      where: { invitationToken }
    });
    
    if (!invitation) {
      console.error('❌ Invitation not found');
      return;
    }
    
    console.log('📧 Found invitation:');
    console.log('   Mobile:', invitation.doctorMobile);
    console.log('   Email:', invitation.doctorEmail);
    console.log('   User ID:', invitation.doctorUserId);
    console.log('   Status:', invitation.status);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: invitation.doctorUserId }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log('\n👤 Found user:');
    console.log('   Name:', user.name);
    console.log('   Mobile:', user.mobile);
    console.log('   Phone Verified:', user.isPhoneVerified);
    console.log('   Email Verified:', user.isEmailVerified);
    
    console.log('\n⚠️  MANUALLY VERIFYING MOBILE NUMBER...\n');
    
    // Mark user's phone as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true }
    });
    
    console.log('✅ Mobile number manually verified!');
    console.log('   Phone Verified:', updatedUser.isPhoneVerified);
    
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. User can now proceed to email verification');
    console.log('   2. Or use this script again with email verification if needed');
    console.log('   3. After both verifications, status will change to PROFILE_IN_PROGRESS');
    
    console.log('\n═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

manuallyVerifyDoctor();
