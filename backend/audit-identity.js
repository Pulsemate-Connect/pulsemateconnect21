const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditUsers() {
  console.log('='.repeat(80));
  console.log('PULSEMATE IDENTITY AUDIT - Clinic Owner Records');
  console.log('='.repeat(80));
  
  // Find all users with email or mobile matching test case
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'shubhmkothrkr@gmail.com' } },
        { mobile: { contains: '8105846719' } },
        { mobile: { contains: '8068290750' } },
        { role: 'CLINIC_OWNER' }
      ]
    },
    include: {
      clinicOwnerProfile: true,
      ownedClinics: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\nTotal Users Found: ${users.length}\n`);

  for (const user of users) {
    console.log('─'.repeat(80));
    console.log('User ID:', user.id);
    console.log('Firebase UID:', user.authUserId || 'NULL');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Mobile:', user.mobile);
    console.log('Role:', user.role);
    console.log('Approval Status:', user.approvalStatus);
    console.log('Created At:', user.createdAt);
    console.log('Has Clinic Owner Profile:', user.clinicOwnerProfile ? 'YES' : 'NO');
    console.log('Number of Clinics:', user.ownedClinics.length);
    
    if (user.ownedClinics.length > 0) {
      console.log('Clinic Names:', user.ownedClinics.map(c => c.name).join(', '));
    }
    
    // Check if this matches expected identity
    const isExpectedEmail = user.email === 'shubhmkothrkr@gmail.com';
    const isExpectedMobile = user.mobile === '+918105846719' || user.mobile === '8105846719';
    const isOtherMobile = user.mobile === '+918068290750';
    
    if (isExpectedEmail && isExpectedMobile) {
      console.log('✅ CORRECT RECORD (matches expected email + mobile)');
    } else if (isExpectedEmail && !isExpectedMobile) {
      console.log('⚠️  PARTIAL MATCH (correct email, wrong mobile)');
    } else if (isOtherMobile) {
      console.log('❌ WRONG MOBILE (showing +918068290750 instead of 8105846719)');
    }
    
    console.log('');
  }

  // Check for duplicate Firebase UIDs
  console.log('='.repeat(80));
  console.log('Checking for Duplicate Firebase UIDs');
  console.log('='.repeat(80));
  
  const authUserIds = users.filter(u => u.authUserId).map(u => u.authUserId);
  const duplicateUIDs = authUserIds.filter((uid, index) => authUserIds.indexOf(uid) !== index);
  
  if (duplicateUIDs.length > 0) {
    console.log('❌ DUPLICATE Firebase UIDs found:', [...new Set(duplicateUIDs)]);
  } else {
    console.log('✅ No duplicate Firebase UIDs');
  }

  // Check schema for authUserId uniqueness
  console.log('\n' + '='.repeat(80));
  console.log('Database Schema Check');
  console.log('='.repeat(80));
  console.log('Checking if authUserId has UNIQUE constraint...');

  await prisma.$disconnect();
}

auditUsers().catch(console.error);
