/**
 * Database Initialization Script
 * Automatically creates missing tables on server startup
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('[DB Init] Checking database schema...');
    
    // Try to query the otp_attempts table
    try {
      await prisma.$queryRaw`SELECT 1 FROM otp_attempts LIMIT 1`;
      console.log('[DB Init] ✅ otp_attempts table exists');
    } catch (error) {
      // Table doesn't exist, create it
      if (error.code === 'P2010' || error.message.includes('does not exist')) {
        console.log('[DB Init] ⚠️  otp_attempts table missing, creating...');
        
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS otp_attempts (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "mobileNumber" TEXT NOT NULL,
            "verificationId" TEXT NOT NULL,
            provider TEXT NOT NULL DEFAULT 'MESSAGE_CENTRAL',
            "expiresAt" TIMESTAMPTZ NOT NULL,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS idx_otp_attempts_mobile_created 
          ON otp_attempts("mobileNumber", "createdAt");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS idx_otp_attempts_verification_id 
          ON otp_attempts("verificationId");
        `);
        
        console.log('[DB Init] ✅ otp_attempts table created successfully');
      } else {
        throw error;
      }
    }
    
    console.log('[DB Init] ✅ Database schema ready');
  } catch (error) {
    console.error('[DB Init] ❌ Error initializing database:', error.message);
    // Don't throw - let the app start anyway
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { initDatabase };
