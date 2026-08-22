const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmail() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node check-email.js <email>');
    process.exit(1);
  }
  
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: email,
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      approvalStatus: true,
      createdAt: true,
    },
  });
  
  console.log(`\nFound ${users.length} user(s) with "${email}" in email:\n`);
  console.table(users);
  
  await prisma.$disconnect();
}

checkEmail().catch(console.error);
