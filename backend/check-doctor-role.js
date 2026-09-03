require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDoctorRole() {
  const user = await prisma.user.findUnique({
    where: { email: 'test-dr-kumar@pulsemate.test' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approvalStatus: true,
      doctorProfile: {
        select: {
          id: true,
          specialization: true,
          approvalStatus: true
        }
      }
    }
  });

  console.log('User in Database:', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

checkDoctorRole().catch(console.error);
