/**
 * TEST 01 - SINGLE CLINIC PROOF OF CONCEPT
 * 
 * Tests complete clinic flow for ONE clinic to verify all endpoints work correctly
 * Once this passes, we can scale to 20 clinics
 */

const APIClient = require('../helpers/apiClient');
const OTPHelper = require('../helpers/otpHelper');
const ClinicGenerator = require('../data/generators/clinicGenerator');
const config = require('../config/test.config');
const path = require('path');

describe('TEST 01 - SINGLE CLINIC POC', () => {
  let api;
  let otpHelper;
  let adminToken;
  let clinic;
  let clinicToken;
  let clinicId;
  let clinicUserId;

  beforeAll(async () => {
    api = new APIClient();
    otpHelper = new OTPHelper();
    
    // Load first clinic from generated data
    const generator = new ClinicGenerator();
    const fixturesPath = path.join(__dirname, '../data/fixtures/clinics.json');
    generator.loadFromFile(fixturesPath);
    const allClinics = generator.getAll();
    clinic = allClinics[0]; // Test with CLINIC-001 only
    
    console.log(`\n📋 Testing with: ${clinic.testId} (${clinic.name})`);
    console.log(`   Email: ${clinic.email}`);
    console.log(`   Mobile: ${clinic.mobile}\n`);
    
    // Login as admin
    const adminRes = await api.post('/api/auth/login', {
      email: config.auth.admin.email,
      password: config.auth.admin.password,
    });

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
    api.setToken('admin', null, adminToken);
    
    console.log('✓ Admin logged in');
  });

  test('Step 1: Register clinic', async () => {
    const res = await api.post('/api/auth/register', {
      name: clinic.name,
      ownerName: clinic.ownerName,
      mobile: clinic.mobile,
      email: clinic.email,
      password: clinic.password,
    });

    console.log('Response status:', res.status);
    if (res.status !== 201) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.role).toBe('CLINIC_OWNER');
    expect(res.body.data.user.mobile).toBe(clinic.mobile);
    expect(res.body.data.user.email).toBe(clinic.email);

    clinicUserId = res.body.data.user.id;
    console.log('✓ Clinic registered, userId:', clinicUserId);
  });

  test('Step 2: Send mobile OTP', async () => {
    const res = await api.post('/api/auth/send-otp', {
      mobile: clinic.mobile,
    });

    console.log('Response status:', res.status);
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('✓ Mobile OTP sent');
  });

  test('Step 3: Verify mobile OTP', async () => {
    const otp = otpHelper.getTestOTP();

    const res = await api.post('/api/auth/verify-otp', {
      mobile: clinic.mobile,
      otp: otp,
    });

    console.log('Response status:', res.status);
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');

    clinicToken = res.body.data.token;
    api.setToken('clinic', clinic.testId, clinicToken);
    console.log('✓ Mobile OTP verified, token received');
  });

  test('Step 4: Send email OTP', async () => {
    const res = await api.post('/api/auth/clinic-owner/send-email-otp', {
      email: clinic.email,
    });

    console.log('Response status:', res.status);
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('✓ Email OTP sent');
  });

  test('Step 5: Verify email OTP', async () => {
    const otp = otpHelper.getTestOTP();

    const res = await api.post('/api/auth/clinic-owner/verify-email-otp', {
      email: clinic.email,
      otp: otp,
    });

    console.log('Response status:', res.status);
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('✓ Email OTP verified');
  });

  test('Step 6: Check status is PENDING', async () => {
    // Login again to get fresh user state
    await api.post('/api/auth/send-otp', {
      mobile: clinic.mobile,
    });

    const loginRes = await api.post('/api/auth/verify-otp', {
      mobile: clinic.mobile,
      otp: otpHelper.getTestOTP(),
    });

    console.log('Response status:', loginRes.status);
    console.log('User data:', JSON.stringify(loginRes.body.data.user, null, 2));

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.approvalStatus).toBe('PENDING');

    clinicId = loginRes.body.data.user.clinicId || loginRes.body.data.clinic?.id;
    console.log('✓ Status is PENDING, clinicId:', clinicId);
  });

  test('Step 7: Pending clinic cannot invite doctors', async () => {
    if (!clinicId) {
      // Query database to get clinic ID
      const prisma = require('../../../src/config/database');
      const user = await prisma.user.findUnique({
        where: { mobile: clinic.mobile },
        include: { clinic: true },
      });
      clinicId = user.clinic?.id;
    }

    const inviteRes = await api.post(
      `/api/clinic/${clinicId}/invite-doctor`,
      {
        doctorName: 'Test Doctor',
        mobile: '9999999999',
        email: 'test@example.com',
      },
      'clinic',
      clinic.testId
    );

    console.log('Response status:', inviteRes.status);
    expect([401, 403, 404]).toContain(inviteRes.status);
    console.log('✓ Pending clinic blocked from inviting (status:', inviteRes.status + ')');
  });

  test('Step 8: Admin approves clinic', async () => {
    if (!clinicId) {
      const prisma = require('../../../src/config/database');
      const user = await prisma.user.findUnique({
        where: { mobile: clinic.mobile },
        include: { clinic: true },
      });
      clinicId = user.clinic?.id;
    }

    const res = await api.patch(
      `/api/admin/clinics/${clinicId}/approve`,
      {},
      'admin'
    );

    console.log('Response status:', res.status);
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.clinic.approvalStatus).toBe('VERIFIED');
    console.log('✓ Admin approved clinic, status is VERIFIED');
  });

  test('Step 9: Verify status is VERIFIED', async () => {
    await api.post('/api/auth/send-otp', {
      mobile: clinic.mobile,
    });

    const loginRes = await api.post('/api/auth/verify-otp', {
      mobile: clinic.mobile,
      otp: otpHelper.getTestOTP(),
    });

    console.log('Response status:', loginRes.status);
    console.log('User approval status:', loginRes.body.data.user.approvalStatus);

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.approvalStatus).toBe('VERIFIED');
    console.log('✓ Status confirmed as VERIFIED');
  });

  test('Step 10: Verified clinic can access dashboard', async () => {
    // Login and get fresh token
    await api.post('/api/auth/send-otp', {
      mobile: clinic.mobile,
    });

    const loginRes = await api.post('/api/auth/verify-otp', {
      mobile: clinic.mobile,
      otp: otpHelper.getTestOTP(),
    });

    const freshToken = loginRes.body.data.token;
    api.setToken('clinic', clinic.testId, freshToken);

    if (!clinicId) {
      const prisma = require('../../../src/config/database');
      const user = await prisma.user.findUnique({
        where: { mobile: clinic.mobile },
        include: { clinic: true },
      });
      clinicId = user.clinic?.id;
    }

    // Try accessing clinic dashboard
    const dashboardRes = await api.get(`/api/dashboard/clinic/${clinicId}`, 'clinic', clinic.testId);

    console.log('Dashboard response status:', dashboardRes.status);
    
    // Should not be 401/403 (authentication/authorization errors)
    expect(dashboardRes.status).not.toBe(401);
    expect(dashboardRes.status).not.toBe(403);
    console.log('✓ Verified clinic can access dashboard (status:', dashboardRes.status + ')');
  });

  test('FINAL: Verify database state', async () => {
    const prisma = require('../../../src/config/database');

    const verifiedClinic = await prisma.clinic.findFirst({
      where: {
        approvalStatus: 'VERIFIED',
        name: clinic.name,
      },
    });

    expect(verifiedClinic).not.toBeNull();
    expect(verifiedClinic.approvalStatus).toBe('VERIFIED');
    
    console.log('\n✅ COMPLETE CLINIC FLOW VERIFIED');
    console.log('   Clinic Name:', verifiedClinic.name);
    console.log('   Status:', verifiedClinic.approvalStatus);
    console.log('   Created:', verifiedClinic.createdAt);
    console.log('\n🎉 All endpoints and flow working correctly!\n');
  });
});
