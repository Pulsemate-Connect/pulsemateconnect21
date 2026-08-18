/**
 * Test Setup and Configuration
 * Automated Test Suite for PulseMate Connect
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  BACKEND_URL: process.env.TEST_BACKEND_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.TEST_FRONTEND_URL || 'http://localhost:3000',
  ADMIN_EMAIL: 'sahilnaik1515@gmail.com',
  ADMIN_PASSWORD: 'Nkabu18$',
  TEST_OTP: '123456',
  TIMEOUT: 30000, // 30 seconds
};

// Test Data Storage
const TEST_DATA = {
  clinics: [],
  doctors: [],
  invitations: [],
  tokens: {},
};

// API Client
const api = axios.create({
  baseURL: CONFIG.BACKEND_URL,
  timeout: CONFIG.TIMEOUT,
  validateStatus: () => true, // Don't throw on any status
});

// Helper Functions
const helpers = {
  /**
   * Generate unique test data
   */
  generateClinicData(index) {
    const paddedIndex = String(index).padStart(3, '0');
    return {
      ownerMobile: `+919000000${paddedIndex.slice(-3)}`,
      ownerName: `Dr. Test Owner ${paddedIndex}`,
      ownerEmail: `clinic${paddedIndex}@pulsemate-test.com`,
      clinicName: `Test Medical Center ${paddedIndex}`,
      clinicType: 'Multi-Specialty Clinic',
      displayName: `TMC-${paddedIndex}`,
      primaryContactPhone: `+919000000${paddedIndex.slice(-3)}`,
      addressLine1: `${index} Test Street`,
      addressLine2: 'Suite 100',
      locality: 'Test Locality',
      landmark: 'Near Test Hospital',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      latitude: 19.0760 + (index * 0.001),
      longitude: 72.8777 + (index * 0.001),
    };
  },

  generateDoctorData(clinicIndex, doctorIndex) {
    const clinicPadded = String(clinicIndex).padStart(3, '0');
    const doctorPadded = String(doctorIndex).padStart(3, '0');
    const uniqueId = (clinicIndex * 1000) + doctorIndex;
    const paddedUniqueId = String(uniqueId).padStart(5, '0');
    
    return {
      name: `Dr. Test Doctor ${clinicPadded}-${doctorPadded}`,
      email: `clinic${clinicPadded}.doctor${doctorPadded}@gmail.com`,
      mobile: `+919100${paddedUniqueId}`,
      specialization: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'][doctorIndex % 5],
      qualification: 'MBBS, MD',
      experience: 5 + (doctorIndex % 10),
      registrationNumber: `TEST-DOC-${paddedUniqueId}`,
      registrationAuthority: 'Medical Council of India',
      registrationYear: 2015 + (doctorIndex % 8),
      dateOfBirth: `1985-0${(doctorIndex % 9) + 1}-15`,
      gender: doctorIndex % 2 === 0 ? 'Male' : 'Female',
    };
  },

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition, timeoutMs = 5000, intervalMs = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return false;
  },

  /**
   * Log test result
   */
  log(testNumber, testName, status, details = '') {
    const timestamp = new Date().toISOString();
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`[${timestamp}] ${statusIcon} TEST ${testNumber}: ${testName} - ${status}`);
    if (details) {
      console.log(`   Details: ${details}`);
    }
  },

  /**
   * Save test results to file
   */
  saveResults(results) {
    const resultsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${filepath}`);
    
    return filepath;
  },

  /**
   * Generate test report
   */
  generateReport(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST EXECUTION REPORT');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`Pass Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    console.log('='.repeat(80));
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  ❌ TEST ${r.testNumber}: ${r.testName}`);
        console.log(`     Error: ${r.error}`);
      });
    }
    
    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  },

  /**
   * Simulate Firebase phone verification (for testing)
   */
  async simulateFirebasePhoneAuth(phone) {
    // In production, this would use actual Firebase SDK
    // For testing, we'll call the backend verification endpoint
    try {
      const response = await api.post('/api/auth/clinic-owner/verify-firebase-phone', {
        firebaseIdToken: `TEST_TOKEN_${phone}`, // Mock token for testing
      });
      return response.data;
    } catch (error) {
      throw new Error(`Firebase phone auth failed: ${error.message}`);
    }
  },

  /**
   * Create mock file upload
   */
  createMockFile(filename, content = 'Mock file content') {
    return {
      fieldname: filename.split('.')[0],
      originalname: filename,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from(content),
      size: content.length,
    };
  },
};

// Database Query Helpers
const db = {
  /**
   * Query database via API (using admin access)
   */
  async query(table, conditions) {
    // This would need to be implemented based on your API
    // For now, we'll use direct Prisma access in actual tests
    return null;
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const response = await api.get(`/api/admin/users?email=${email}`, {
      headers: { Authorization: `Bearer ${TEST_DATA.tokens.admin}` }
    });
    return response.data?.data || null;
  },

  /**
   * Get clinic by email
   */
  async getClinicByEmail(email) {
    const response = await api.get(`/api/admin/clinics?email=${email}`, {
      headers: { Authorization: `Bearer ${TEST_DATA.tokens.admin}` }
    });
    return response.data?.data || null;
  },
};

// Export everything
module.exports = {
  CONFIG,
  TEST_DATA,
  api,
  helpers,
  db,
};
