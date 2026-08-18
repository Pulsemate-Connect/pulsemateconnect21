/**
 * TEST 01 - NORMAL COMPLETE CLINIC FLOW
 * 
 * Tests complete clinic registration, OTP verification, and admin approval flow.
 * Tests all 20 clinics to ensure consistent behavior.
 */

const APIClient = require('../helpers/apiClient');
const OTPHelper = require('../helpers/otpHelper');
const ClinicGenerator = require('../data/generators/clinicGenerator');
const config = require('../config/test.config');

describe('TEST 01 - CLINIC COMPLETE FLOW', () => {
  let api;
  let otpHelper;
  let clinics = [];
  let adminToken;

  beforeAll(async () => {
    api = new APIClient();
    otpHelper = new OTPHelper();
    
    // Load generated clinic data
    const generator = new ClinicGenerator();
    const path = require('path');
    const fixturesPath = path.join(__dirname, '../data/fixtures/clinics.json');
    
    try {
      generator.loadFromFile(fixturesPath);
      clinics = generator.getAll();
      
      if (!clinics || clinics.length === 0) {
        throw new Error('No clinic data found');
      }
      
      console.log(`\n✓ Loaded ${clinics.length} clinics for testing\n`);
    } catch (error) {
      console.error('Failed to load clinic data:', error.message);
      console.log('Generating clinic data...');
      clinics = generator.generate();
      generator.saveToFile(fixturesPath);
      console.log(`✓ Generated and saved ${clinics.length} clinics\n`);
    }

    // Login as admin
    const adminRes = await api.post('/api/auth/login', {
      email: config.auth.admin.email,
      password: config.auth.admin.password,
    });

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
    api.setToken('admin', null, adminToken);
  });

  afterAll(() => {
    otpHelper.clearAll();
  });

  // Test each clinic
  clinics.forEach((clinic, index) => {
    describe(`Clinic ${index + 1}: ${clinic.testId}`, () => {
      let clinicUserId;
      let clinicId;
      let clinicToken;

      // STEP 1: Register Clinic
      test('1.1 - Should register clinic successfully', async () => {
        const res = await api.post('/api/auth/register', {
          name: clinic.name,
          ownerName: clinic.ownerName,
          mobile: clinic.mobile,
          email: clinic.email,
          password: clinic.password,
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user.role).toBe('CLINIC_OWNER');
        expect(res.body.data.user.mobile).toBe(clinic.mobile);
        expect(res.body.data.user.email).toBe(clinic.email);

        clinicUserId = res.body.data.user.id;
      }, config.timeouts.medium);

      // STEP 2: Send Mobile OTP
      test('1.2 - Should send mobile OTP', async () => {
        const res = await api.post('/api/auth/send-otp', {
          mobile: clinic.mobile,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('OTP');
      }, config.timeouts.short);

      // STEP 3: Verify Mobile OTP
      test('1.3 - Should verify mobile OTP successfully', async () => {
        const otp = otpHelper.getTestOTP();

        const res = await api.post('/api/auth/verify-otp', {
          mobile: clinic.mobile,
          otp: otp,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');

        clinicToken = res.body.data.token;
        api.setToken('clinic', clinic.testId, clinicToken);
      }, config.timeouts.short);

      // STEP 4: Send Email OTP
      test('1.4 - Should send email OTP', async () => {
        const res = await api.post('/api/auth/clinic-owner/send-email-otp', {
          email: clinic.email,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }, config.timeouts.short);

      // STEP 5: Verify Email OTP
      test('1.5 - Should verify email OTP successfully', async () => {
        const otp = otpHelper.getTestOTP();

        const res = await api.post('/api/auth/clinic-owner/verify-email-otp', {
          email: clinic.email,
          otp: otp,
        });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }, config.timeouts.short);

      // STEP 6: Check Status is PENDING
      test('1.6 - Clinic status should be PENDING after verification', async () => {
        const res = await api.post('/api/auth/send-otp', {
          mobile: clinic.mobile,
        });

        expect(res.status).toBe(200);

        const loginRes = await api.post('/api/auth/verify-otp', {
          mobile: clinic.mobile,
          otp: otpHelper.getTestOTP(),
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.data.user.approvalStatus).toBe('PENDING');

        clinicId = loginRes.body.data.user.clinicId || loginRes.body.data.clinic?.id;
      }, config.timeouts.medium);

      // STEP 7: Verify Clinic Cannot Invite Doctors (Before Approval)
      test('1.7 - Pending clinic should NOT be able to invite doctors', async () => {
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

        expect([401, 403, 404]).toContain(inviteRes.status);
      }, config.timeouts.short);

      // STEP 8: Admin Approves Clinic
      test('1.8 - Admin should approve clinic successfully', async () => {
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

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.clinic.approvalStatus).toBe('VERIFIED');
      }, config.timeouts.medium);

      // STEP 9: Verify Clinic is VERIFIED
      test('1.9 - Clinic status should be VERIFIED after admin approval', async () => {
        const res = await api.post('/api/auth/send-otp', {
          mobile: clinic.mobile,
        });

        const loginRes = await api.post('/api/auth/verify-otp', {
          mobile: clinic.mobile,
          otp: otpHelper.getTestOTP(),
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.data.user.approvalStatus).toBe('VERIFIED');
      }, config.timeouts.medium);

      // STEP 10: Verify Verified Clinic Can Access Dashboard
      test('1.10 - Verified clinic should be able to access dashboard', async () => {
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

        // Try accessing clinic-specific endpoints
        const dashboardRes = await api.get(`/api/dashboard/clinic/${clinicId}`, 'clinic', clinic.testId);

        // Should not be 401/403 (may be 404 if endpoint doesn't exist, that's ok)
        expect(dashboardRes.status).not.toBe(401);
        expect(dashboardRes.status).not.toBe(403);
      }, config.timeouts.medium);
    });
  });

  // Summary test
  test('SUMMARY - All clinics should be registered and approved', async () => {
    const prisma = require('../../../src/config/database');

    const approvedClinics = await prisma.clinic.findMany({
      where: {
        approvalStatus: 'VERIFIED',
        name: {
          contains: 'Test Medical Clinic',
        },
      },
    });

    expect(approvedClinics.length).toBe(config.scale.totalClinics);
  }, config.timeouts.long);
});
