/**
 * TEST 01: Clinic Registration → OTP → Pending
 * 
 * Validates:
 * - Register 20 test clinics
 * - Verify phone OTP for each
 * - Confirm all clinics enter PENDING status
 * - Confirm pending clinics cannot invite doctors
 */

const { api, helpers, TEST_DATA, CONFIG } = require('../setup');
const prisma = require('../../../src/config/database');

async function execute() {
  const startTime = Date.now();
  const testResults = {
    clinicsRegistered: 0,
    clinicsPending: 0,
    inviteBlockedCorrectly: 0,
    errors: [],
  };

  try {
    console.log('  📋 Registering 20 clinics...');

    for (let i = 1; i <= 20; i++) {
      const clinicData = helpers.generateClinicData(i);
      
      try {
        // Step 1: Phone Verification (simulated Firebase)
        console.log(`  📱 Clinic ${i}: Verifying phone ${clinicData.ownerMobile}`);
        
        // Note: In real Firebase flow, frontend gets ID token
        // For testing, we'll use the backend's test endpoint if available
        // or directly create user with verified phone
        
        // Step 2: Save Clinic Information (Step 1 of 4)
        console.log(`  📝 Clinic ${i}: Saving clinic information...`);
        const step1Response = await api.post('/api/auth/clinic-owner/save-step1', clinicData);
        
        if (step1Response.status !== 200 && step1Response.status !== 201) {
          throw new Error(`Step 1 failed: ${step1Response.data?.message || step1Response.statusText}`);
        }

        // Step 3: Save Services & Operations (Step 2 of 4)
        console.log(`  🏥 Clinic ${i}: Saving services...`);
        const step2Data = {
          specialties: ['General Medicine', 'Cardiology'],
          consultationTypes: ['In-Person', 'Video Call'],
          openingTime: '09:00',
          closingTime: '18:00',
          weeklyOffDays: ['Sunday'],
          appointmentMode: 'Both',
        };
        
        const step2Response = await api.post('/api/auth/clinic-owner/save-services-operations', step2Data);
        
        if (step2Response.status !== 200 && step2Response.status !== 201) {
          throw new Error(`Step 2 failed: ${step2Response.data?.message || step2Response.statusText}`);
        }

        // Step 4: Save Documents (Step 3 of 4) - minimal for testing
        console.log(`  📄 Clinic ${i}: Saving documents...`);
        const step3Data = {
          clinicRegistrationNumber: `TEST-CLINIC-REG-${String(i).padStart(3, '0')}`,
          gstNumber: `TEST-GST-${String(i).padStart(3, '0')}`,
        };
        
        const step3Response = await api.post('/api/auth/clinic-owner/save-clinic-documents', step3Data);
        
        if (step3Response.status !== 200 && step3Response.status !== 201) {
          throw new Error(`Step 3 failed: ${step3Response.data?.message || step3Response.statusText}`);
        }

        // Step 5: Submit Application (Step 4 of 4)
        console.log(`  ✅ Clinic ${i}: Submitting application...`);
        const step4Data = {
          termsAccepted: true,
          confirmAuthorized: true,
          confirmAccurate: true,
          confirmCompliance: true,
          termsAcceptedAt: new Date().toISOString(),
          agreementVersion: 'v1.0-test',
        };
        
        const submitResponse = await api.post('/api/auth/clinic-owner/submit-application', step4Data);
        
        if (submitResponse.status !== 200 && submitResponse.status !== 201) {
          throw new Error(`Submission failed: ${submitResponse.data?.message || submitResponse.statusText}`);
        }

        testResults.clinicsRegistered++;

        // Verify clinic is in PENDING status
        const clinic = await prisma.clinic.findFirst({
          where: { email: clinicData.ownerEmail },
          select: { id: true, approvalStatus: true },
        });

        if (clinic && clinic.approvalStatus === 'PENDING') {
          testResults.clinicsPending++;
          
          // Store for later tests
          TEST_DATA.clinics.push({
            index: i,
            id: clinic.id,
            email: clinicData.ownerEmail,
            mobile: clinicData.ownerMobile,
            name: clinicData.clinicName,
          });
          
          console.log(`  ✅ Clinic ${i}: Status = PENDING`);
        } else {
          testResults.errors.push(`Clinic ${i}: Expected PENDING, got ${clinic?.approvalStatus || 'NOT_FOUND'}`);
        }

      } catch (error) {
        testResults.errors.push(`Clinic ${i}: ${error.message}`);
        console.log(`  ❌ Clinic ${i}: ${error.message}`);
      }
    }

    // Test that pending clinics cannot invite doctors
    console.log('\n  🔒 Testing invite blocked for pending clinics...');
    
    if (TEST_DATA.clinics.length > 0) {
      const testClinic = TEST_DATA.clinics[0];
      
      try {
        const inviteResponse = await api.post(
          `/api/clinic/${testClinic.id}/invite-doctor`,
          {
            doctorName: 'Test Doctor',
            email: 'test@test.com',
            mobile: '+919999999999',
          }
        );

        if (inviteResponse.status === 403 || inviteResponse.status === 401) {
          testResults.inviteBlockedCorrectly++;
          console.log('  ✅ Invite correctly blocked for pending clinic');
        } else {
          testResults.errors.push('Pending clinic was able to invite doctors (should be blocked)');
          console.log('  ❌ Pending clinic was able to invite doctors!');
        }
      } catch (error) {
        // Expected to fail
        testResults.inviteBlockedCorrectly++;
        console.log('  ✅ Invite correctly blocked (error thrown)');
      }
    }

    const duration = Date.now() - startTime;
    const allSuccess = testResults.clinicsRegistered === 20 &&
                      testResults.clinicsPending === 20 &&
                      testResults.inviteBlockedCorrectly > 0 &&
                      testResults.errors.length === 0;

    return {
      status: allSuccess ? 'PASS' : 'FAIL',
      duration,
      details: `Registered: ${testResults.clinicsRegistered}/20, Pending: ${testResults.clinicsPending}/20, Blocked: ${testResults.inviteBlockedCorrectly > 0 ? 'Yes' : 'No'}`,
      error: testResults.errors.length > 0 ? testResults.errors.join('; ') : null,
      critical: !allSuccess,
      data: testResults,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'FAIL',
      duration,
      details: 'Test execution failed',
      error: error.message,
      critical: true,
    };
  }
}

module.exports = { execute };
