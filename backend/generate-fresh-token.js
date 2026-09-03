const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function generateFreshToken() {
  console.log('='.repeat(80));
  console.log('GENERATING FRESH ADMIN TOKEN');
  console.log('='.repeat(80));
  
  const email = 'shubham27052002@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      adminProfile: true,
    },
  });

  if (!user) {
    console.log('❌ User not found:', email);
    await prisma.$disconnect();
    return;
  }

  console.log('\nUser Details:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Admin Level:', user.adminProfile?.level || 'NULL');
  
  if (!user.adminProfile || !user.adminProfile.level) {
    console.log('\n❌ User has no admin level set!');
    await prisma.$disconnect();
    return;
  }

  // Generate access token
  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      adminLevel: user.adminProfile.level,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
  );

  console.log('\n' + '='.repeat(80));
  console.log('✅ TOKENS GENERATED SUCCESSFULLY');
  console.log('='.repeat(80));
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Open your browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Copy and paste this command:');
  console.log('\n---COPY FROM HERE---');
  console.log(`localStorage.setItem('accessToken', '${accessToken}');`);
  console.log(`localStorage.setItem('refreshToken', '${refreshToken}');`);
  console.log(`console.log('✅ Tokens updated! Refresh the page.');`);
  console.log('---COPY UNTIL HERE---');
  console.log('\n4. Press Enter');
  console.log('5. Refresh the page (F5 or Ctrl+R)');
  console.log('\nThe dashboard should load successfully!\n');

  await prisma.$disconnect();
}

generateFreshToken().catch(console.error);
