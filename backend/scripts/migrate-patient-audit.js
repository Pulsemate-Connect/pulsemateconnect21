const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Applying patient audit fields migration...\n');

    await prisma.$executeRaw`
      ALTER TABLE patient_profiles 
      ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT,
      ADD COLUMN IF NOT EXISTS "createdByRole" TEXT,
      ADD COLUMN IF NOT EXISTS "registeredVia" TEXT DEFAULT 'SELF',
      ADD COLUMN IF NOT EXISTS "registeredClinicId" TEXT
    `;

    console.log('✅ Migration applied successfully!\n');
    console.log('New fields added to patient_profiles:');
    console.log('  - createdByUserId (TEXT)');
    console.log('  - createdByRole (TEXT)');
    console.log('  - registeredVia (TEXT, default: SELF)');
    console.log('  - registeredClinicId (TEXT)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
