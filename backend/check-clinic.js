const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const clinics = await prisma.clinic.findMany({
    where: { ownerId: '9ebe5161-026b-46a1-9ae3-c2725470d06e' }
  });
  
  console.log('\nClinics found:', clinics.length);
  clinics.forEach(c => {
    console.log('\n- ID:', c.id);
    console.log('  Name:', c.name);
    console.log('  Status:', c.status);
    console.log('  ApprovalStatus:', c.approvalStatus);
    console.log('  IsVerified:', c.isVerified);
    console.log('  IsActive:', c.isActive);
  });
  
  if (clinics.length === 0) {
    console.log('\n❌ No clinics found for this owner!');
    console.log('   The clinic creation failed due to schema mismatch.');
    console.log('   Let me create it properly now...\n');
  }
  
  await prisma.$disconnect();
})();
