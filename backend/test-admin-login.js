const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function testAdminLogin() {
  console.log('='.repeat(80));
  console.log('TESTING ADMIN LOGIN');
  console.log('='.repeat(80));
  
  const email = 'shubham27052002@gmail.com';
  const password = 'Admin@12345';
  
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      adminProfile: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    await prisma.$disconnect();
    return;
  }

  console.log('\n✅ User Found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Has Password:', !!user.passwordHash);
  console.log('  Admin Profile:', user.adminProfile ? 'YES' : 'NO');
  console.log('  Admin Level:', user.adminProfile?.level || 'NULL');

  // 2. Test password
  if (!user.passwordHash) {
    console.log('\n❌ No password hash set for user!');
    console.log('   Run: node setup-admins.js');
    await prisma.$disconnect();
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  console.log('\n🔐 Password Test:');
  console.log('  Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');

  if (!isPasswordValid) {
    console.log('\n❌ Password is incorrect!');
    console.log('   Expected password: Admin@12345');
    await prisma.$disconnect();
    return;
  }

  // 3. Generate token (like real login does)
  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      status: user.approvalStatus,
      roles: [user.role],
      primaryRole: user.role,
      activeRole: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  console.log('\n✅ Tokens Generated Successfully!');
  console.log('\n' + '='.repeat(80));
  console.log('LOGIN COMMAND - Copy and paste in browser console:');
  console.log('='.repeat(80));
  console.log('\nlocalStorage.setItem("accessToken", "' + accessToken + '");');
  console.log('localStorage.setItem("refreshToken", "' + refreshToken + '");');
  console.log('window.location.href = "/admin/dashboard";');
  console.log('\n' + '='.repeat(80));

  await prisma.$disconnect();
}

testAdminLogin().catch(console.error);
