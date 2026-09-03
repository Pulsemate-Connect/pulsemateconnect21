const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'sahilnaik1515@gmail.com' },
    include: { adminProfile: true }
  });
  
  console.log('User:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkAdmin();
