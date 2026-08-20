const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Testing Admin Login');
  console.log('══════════════════════════════════════════════════\n');

  const email = 'shubham27052002@gmail.com';
  const password = 'Shubham27*';

  const user = await prisma.user.findUnique({
    where: { email },
    include: { adminProfile: true },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✓ User found:', user.email);
  console.log('  Name:', user.name);
  console.log('  Role:', user.role);
  console.log('  Admin Level:', user.adminProfile?.level || 'N/A');
  console.log('  Has password hash:', !!user.passwordHash);
  console.log('  Auth provider:', user.authProvider);
  console.log('  Approval status:', user.approvalStatus);
  console.log('  Is active:', user.isActive);

  console.log('\nTesting password...');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('Password matches:', isValid);

  if (!isValid) {
    console.log('\n❌ Password mismatch! Fixing...');
    const newHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    console.log('✓ Password updated successfully!');
    console.log('\nTry logging in again now.');
  } else {
    console.log('\n✅ Password is correct! Login should work.');
  }

  await prisma.$disconnect();
}

testAdminLogin().catch(console.error);
