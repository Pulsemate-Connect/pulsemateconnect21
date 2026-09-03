require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma connection: SUCCESS');
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Prisma connection: FAILED -', e.message);
    process.exit(1);
  }
})();
