require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPER_ADMIN' },
          { email: 'sahilnaik1515@gmail.com' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActive: true,
        passwordHash: true
      }
    });

    console.log(`Found ${admins.length} admin account(s):`);
    admins.forEach(admin => {
      console.log(`\nEmail: ${admin.email}`);
      console.log(`Name: ${admin.name}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Status: ${admin.approvalStatus}`);
      console.log(`Active: ${admin.isActive}`);
      console.log(`Has Password: ${admin.passwordHash ? 'YES' : 'NO'}`);
    });

    await prisma.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
