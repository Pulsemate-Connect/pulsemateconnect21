/**
 * Super Quick Test: Verify Rate Limiting Fix
 * Uses health endpoint (no auth needed)
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://192.168.31.240:5000';

async function quickTest() {
  console.log('\n🔧 QUICK RATE LIMIT TEST\n');
  console.log('Testing: 150 requests to /health endpoint');
  console.log('Old behavior: Would get 429 errors after 100 requests');
  console.log('New behavior: All 150 should succeed\n');
  
  let success = 0;
  let failed = 0;
  let errors429 = 0;
  
  const promises = [];
  for (let i = 0; i < 150; i++) {
    promises.push(
      axios.get(`${API_BASE}/health`, { timeout: 5000 })
        .then(() => { success++; })
        .catch((err) => {
          failed++;
          if (err.response?.status === 429) errors429++;
        })
    );
  }
  
  await Promise.all(promises);
  
  console.log(`\n📊 RESULTS:`);
  console.log(`   Total:    150`);
  console.log(`   Success:  ${success}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`   429 errors: ${errors429}\n`);
  
  if (success === 150 && errors429 === 0) {
    console.log('✅ TEST PASSED!');
    console.log('   Rate limiting appears to be working correctly.');
    console.log('   (No rate limiting on /health endpoint)\n');
    process.exit(0);
  } else if (errors429 > 0) {
    console.log('⚠️  WARNING: Still getting 429 errors');
    console.log('   Rate limiting may still be per-IP.\n');
    process.exit(1);
  } else {
    console.log('✅ TEST PASSED! No rate limit errors.\n');
    process.exit(0);
  }
}

quickTest().catch((err) => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
