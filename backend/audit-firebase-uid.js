const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditFirebaseUIDs() {
  console.log('='.repeat(80));
  console.log('FIREBASE UID AUDIT');
  console.log('='.repeat(80));
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'shubhmkothrkr@gmail.com' },
        { mobile: { contains: '8105846719' } },
        { mobile: { contains: '8068290750' } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\nTotal Users Found: ${users.length}\n`);

  users.forEach(u => {
    console.log('─'.repeat(80));
    console.log('User ID:', u.id);
    console.log('Name:', u.name);
    console.log('Email:', u.email);
    console.log('Mobile:', u.mobile);
    console.log('Firebase UID:', u.firebaseUid);
    console.log('Auth Provider:', u.authProvider);
    console.log('Role:', u.role);
    console.log('Approval Status:', u.approvalStatus);
    console.log('Created At:', u.createdAt);
    console.log('');
  });

  await prisma.$disconnect();
}

auditFirebaseUIDs().catch(console.error);
