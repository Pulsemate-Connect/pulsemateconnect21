require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { id: '04d45e4e-0c20-4deb-9d0c-f52b6740897e' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roles: true,
      adminProfile: {
        select: { level: true }
      }
    }
  });
  
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkUser();
