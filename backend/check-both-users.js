const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user1 = await prisma.user.findUnique({
      where: { id: '8f34ea6a-2246-4e21-81a0-832243477bd5' }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { id: 'ccfcf0de-7f08-42db-8fc0-fd7aa36bf06e' }
    });
    
    console.log('\n═══ USER 1 (from OTP check) ═══');
    console.log(JSON.stringify(user1, null, 2));
    
    console.log('\n═══ USER 2 (from invitation) ═══');
    console.log(JSON.stringify(user2, null, 2));
    
    // Check OTPs for user 2
    const otps2 = await prisma.otpVerification.findMany({
      where: {
        OR: [
          { mobile: user2.mobile },
          { mobile: '+91' + user2.mobile },
          { mobile: user2.mobile.replace('+91', '') }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n═══ OTPs FOR USER 2 ═══');
    console.log(JSON.stringify(otps2, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
