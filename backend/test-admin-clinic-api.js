const axios = require('axios');

async function testAdminAPI() {
  try {
    const baseUrl = 'http://localhost:5000/api';

    console.log('🔍 Testing Admin Clinic API...\n');

    // Test 1: Get clinic stats
    console.log('1️⃣ Testing GET /admin/all-clinics/stats');
    try {
      const statsResponse = await axios.get(`${baseUrl}/admin/all-clinics/stats`, {
        headers: {
          'Authorization': 'Bearer test-token' // Will fail but we can see the structure
        }
      });
      console.log('✅ Stats:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('⚠️  Status:', error.response.status);
        console.log('⚠️  Error:', error.response.data);
        if (error.response.status === 401) {
          console.log('   (Expected - need authentication)');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

    console.log('\n2️⃣ Testing GET /admin/all-clinics');
    try {
      const clinicsResponse = await axios.get(`${baseUrl}/admin/all-clinics`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Clinics:', JSON.stringify(clinicsResponse.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('⚠️  Status:', error.response.status);
        console.log('⚠️  Error:', error.response.data);
        if (error.response.status === 401) {
          console.log('   (Expected - need authentication)');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

    // Test 3: Check database directly
    console.log('\n3️⃣ Checking database directly...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const clinicCount = await prisma.clinic.count();
    console.log(`   Total clinics in DB: ${clinicCount}`);

    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        approvalStatus: true,
        isVerified: true,
        isActive: true,
        ownerId: true,
        owner: {
          select: {
            name: true,
            mobile: true,
            role: true
          }
        }
      }
    });

    console.log('\n   Clinics:');
    clinics.forEach(c => {
      console.log(`   - ${c.name}`);
      console.log(`     ID: ${c.id}`);
      console.log(`     Status: ${c.approvalStatus}, Verified: ${c.isVerified}, Active: ${c.isActive}`);
      console.log(`     Owner: ${c.owner.name} (${c.owner.role}) - ${c.owner.mobile}`);
    });

    await prisma.$disconnect();

    console.log('\n✅ Database check complete!');
    console.log('\n💡 If you see the clinic in the database but not in the admin panel,');
    console.log('   try refreshing the admin panel or clearing browser cache.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminAPI();
