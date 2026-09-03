require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['sahilnaik1515@gmail.com', 'shubham27052002@gmail.com']
        }
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        authProvider: true,
        passwordHash: true,
        adminProfile: {
          select: {
            level: true
          }
        }
      }
    });

    console.log('Found admin users:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log('\n⚠️  No admin accounts found!');
    } else {
      users.forEach(user => {
        console.log(`\n✓ ${user.email}`);
        console.log(`  - Auth Provider: ${user.authProvider}`);
        console.log(`  - Has Password Hash: ${user.passwordHash ? 'YES' : 'NO'}`);
        console.log(`  - Admin Level: ${user.adminProfile?.level || 'NONE'}`);
      });
    }
  } catch (error) {
    console.error('Error checking admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
