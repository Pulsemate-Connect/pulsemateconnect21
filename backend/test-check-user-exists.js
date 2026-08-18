const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to simulate normalizeMobileNumber
const normalizeMobileNumber = (value) => {
  if (typeof value !== 'string') return value;
  const sanitized = value.trim().replace(/[\s\-()]/g, '');
  const digits = sanitized.replace(/\D/g, '');
  if (!digits) return '';
  if (sanitized.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return digits;
};

async function testCheckUserExists() {
  try {
    console.log('\n=== Testing Check User Exists Logic ===\n');
    
    // Simulate what frontend sends
    const mobile = '9876543210';
    
    console.log('1. Frontend sends mobile:', mobile);
    
    // Simulate backend normalization
    const normalizedPhone = normalizeMobileNumber(mobile);
    const mobileNumber = normalizedPhone.replace(/^\+91/, '');
    
    console.log('2. Backend normalizedPhone:', normalizedPhone);
    console.log('3. Backend mobileNumber (stripped):', mobileNumber);
    
    // Test the fixed query
    console.log('\n4. Searching database with OR condition...');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: normalizedPhone }, // With +91
          { mobile: mobileNumber },     // Without +91
        ]
      },
      select: {
        id: true,
        mobile: true,
        email: true,
        role: true,
        approvalStatus: true,
      },
    });
    
    if (user) {
      console.log('\n✅ SUCCESS! User found:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('\n❌ FAILED! User not found');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCheckUserExists();
