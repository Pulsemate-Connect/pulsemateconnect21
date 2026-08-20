const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMobile() {
  const user = await prisma.user.findFirst({
    where: { email: 'testclinic@gmail.com' },
    select: { id: true, email: true, mobile: true, role: true, approvalStatus: true }
  });
  
  console.log('User found:');
  console.log(JSON.stringify(user, null, 2));
  
  // Try finding by different mobile formats
  console.log('\nSearching by different formats:');
  
  const formats = ['+919876543210', '9876543210', '919876543210'];
  for (const format of formats) {
    const found = await prisma.user.findUnique({
      where: { mobile: format },
      select: { id: true, mobile: true }
    });
    console.log(`Format "${format}":`, found ? 'FOUND' : 'NOT FOUND');
  }
  
  await prisma.$disconnect();
}

checkMobile();
