/**
 * Script to check OTP status for a specific mobile number
 * Helps debug OTP verification issues
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOtpStatus() {
  try {
    const mobile = '+919663080521';
    const mobileClean = '9663080521';
    
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 OTP STATUS CHECK');
    console.log('═══════════════════════════════════════\n');
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: mobile },
          { mobile: mobileClean },
          { mobile: `+91${mobileClean}` },
        ]
      }
    });
    
    if (!user) {
      console.log('❌ No user found with mobile:', mobile);
      return;
    }
    
    console.log('👤 USER FOUND:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Mobile:', user.mobile);
    console.log('   Email:', user.email || 'N/A');
    console.log('   Phone Verified:', user.isPhoneVerified ? '✅' : '❌');
    console.log('   Email Verified:', user.isEmailVerified ? '✅' : '❌');
    
    // Find invitation separately
    const invitation = await prisma.doctorInvitation.findFirst({
      where: { doctorUserId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    if (invitation) {
      console.log('\n📧 LATEST INVITATION:');
      console.log('   Token:', invitation.invitationToken);
      console.log('   Status:', invitation.status);
      console.log('   Created:', invitation.createdAt.toLocaleString());
    }
    
    // Find all OTP records
    const otpRecords = await prisma.otpVerification.findMany({
      where: {
        OR: [
          { mobile: mobile },
          { mobile: mobileClean },
          { mobile: `+91${mobileClean}` },
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    console.log('\n📱 OTP RECORDS (' + otpRecords.length + ' found):');
    console.log('─────────────────────────────────────────\n');
    
    if (otpRecords.length === 0) {
      console.log('   ⚠️  No OTP records found');
      console.log('   This means no OTP has been sent yet\n');
      return;
    }
    
    otpRecords.forEach((record, index) => {
      const isExpired = new Date() > record.expiresAt;
      const isValid = !record.isUsed && !isExpired;
      
      console.log(`   [${index + 1}] OTP ID: ${record.id}`);
      console.log(`       Purpose: ${record.purpose}`);
      console.log(`       Created: ${record.createdAt.toLocaleString()}`);
      console.log(`       Expires: ${record.expiresAt.toLocaleString()}`);
      console.log(`       Status: ${record.isUsed ? '✅ USED' : isExpired ? '⏰ EXPIRED' : '🟢 VALID'}`);
      
      // Check if this is a Message Central verificationId or bcrypt hash
      if (record.otpHash.startsWith('VN-')) {
        console.log(`       Type: Message Central (VID: ${record.otpHash})`);
      } else if (record.otpHash.startsWith('$2')) {
        console.log(`       Type: Test/Fallback OTP (bcrypt hash)`);
      } else {
        console.log(`       Type: Unknown (${record.otpHash.substring(0, 20)}...)`);
      }
      
      if (record.verifiedAt) {
        console.log(`       Verified: ${record.verifiedAt.toLocaleString()}`);
      }
      
      console.log('');
    });
    
    // Show valid OTP count
    const validOtps = otpRecords.filter(r => !r.isUsed && new Date() <= r.expiresAt);
    console.log('\n📊 SUMMARY:');
    console.log(`   Total OTPs: ${otpRecords.length}`);
    console.log(`   Valid (not expired, not used): ${validOtps.length}`);
    console.log(`   Used: ${otpRecords.filter(r => r.isUsed).length}`);
    console.log(`   Expired: ${otpRecords.filter(r => !r.isUsed && new Date() > r.expiresAt).length}`);
    
    console.log('\n═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOtpStatus();
