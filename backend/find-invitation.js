const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const invitations = await prisma.doctorInvitation.findMany({
      where: {
        doctorMobile: { contains: '966308' }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Found', invitations.length, 'invitations:\n');
    invitations.forEach(inv => {
      console.log('Token:', inv.invitationToken);
      console.log('Mobile:', inv.doctorMobile);
      console.log('Email:', inv.doctorEmail);
      console.log('Name:', inv.doctorName);
      console.log('Status:', inv.status);
      console.log('User ID:', inv.doctorUserId);
      console.log('Created:', inv.createdAt);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
