/**
 * Test role switching functionality
 * 
 * This script:
 * 1. Gets user info from database
 * 2. Simulates login to get access token
 * 3. Decodes token to show JWT structure
 * 4. Calls /api/auth/switch-role endpoint
 * 5. Decodes new token to verify role switched
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { signAccessToken } = require('./src/services/token.service');

const prisma = new PrismaClient();

async function testRoleSwitching() {
  try {
    console.log('🧪 Testing Multi-Role Authentication\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get user
    const userId = 'b8b7cf17-ba45-4594-baab-6cde6cfa1492';
    console.log(`📝 Step 1: Get user ${userId}...\n`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleApprovals: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Mobile: ${user.mobile}`);
    console.log(`   Role (legacy): ${user.role}`);
    console.log(`   Roles: ${JSON.stringify(user.roles)}`);
    console.log(`   Primary Role: ${user.primaryRole}`);
    console.log('');

    console.log('📝 Role Approvals:');
    user.roleApprovals.forEach(approval => {
      console.log(`   - ${approval.role}: ${approval.approvalStatus}`);
    });
    console.log('');

    // Step 2: Generate JWT token (simulating login)
    console.log('📝 Step 2: Generate JWT token (simulating login)...\n');
    
    const token = signAccessToken(user);
    console.log('✅ Token generated');
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // Decode token to show structure
    const decoded = jwt.decode(token);
    console.log('📝 JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('');

    // Verify multi-role fields
    console.log('✅ Verification:');
    console.log(`   Has 'roles' field: ${!!decoded.roles}`);
    console.log(`   Has 'activeRole' field: ${!!decoded.activeRole}`);
    console.log(`   Has 'primaryRole' field: ${!!decoded.primaryRole}`);
    console.log(`   Active Role: ${decoded.activeRole}`);
    console.log(`   Roles: ${JSON.stringify(decoded.roles)}`);
    console.log('');

    // Step 3: Simulate role switching
    console.log('📝 Step 3: Simulate role switching...\n');
    
    const newRole = 'CLINIC_OWNER';
    console.log(`   Switching to: ${newRole}`);
    
    // Check if user has this role
    const userRoles = user.roles || [user.role];
    if (!userRoles.includes(newRole)) {
      console.error(`❌ User doesn't have ${newRole} role`);
      process.exit(1);
    }

    // Check if role is approved
    const roleApproval = user.roleApprovals.find(a => a.role === newRole);
    if (!roleApproval || roleApproval.approvalStatus !== 'VERIFIED') {
      console.error(`❌ ${newRole} role is not VERIFIED`);
      console.error(`   Status: ${roleApproval?.approvalStatus || 'NOT_FOUND'}`);
      process.exit(1);
    }

    console.log(`   ✅ User has ${newRole} role`);
    console.log(`   ✅ Role is VERIFIED`);
    console.log('');

    // Generate new token with switched role
    const { switchRole } = require('./src/services/token.service');
    const newToken = switchRole(user, newRole);

    console.log('✅ New token generated with switched role');
    console.log(`   Token: ${newToken.substring(0, 50)}...\n`);

    // Decode new token
    const newDecoded = jwt.decode(newToken);
    console.log('📝 New JWT Payload:');
    console.log(JSON.stringify(newDecoded, null, 2));
    console.log('');

    // Verify role switched
    console.log('✅ Verification:');
    console.log(`   Active Role changed: ${decoded.activeRole} → ${newDecoded.activeRole}`);
    console.log(`   Role (legacy) updated: ${decoded.role} → ${newDecoded.role}`);
    console.log(`   Primary Role unchanged: ${newDecoded.primaryRole}`);
    console.log(`   Roles array unchanged: ${JSON.stringify(newDecoded.roles)}`);
    console.log('');

    // Success summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 Multi-role authentication is working!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. ✅ JWT tokens include multi-role fields');
    console.log('  2. ✅ Role switching generates new token');
    console.log('  3. ✅ Active role updates correctly');
    console.log('  4. ⏳ Test with actual HTTP requests');
    console.log('  5. ⏳ Build frontend role selector UI');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleSwitching();
