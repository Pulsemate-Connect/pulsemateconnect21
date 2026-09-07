#!/usr/bin/env node

/**
 * Check Clinic Owner Accounts
 * 
 * This script checks all clinic owner accounts in the database
 * and shows their details to help identify which accounts to keep/delete.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClinicOwners() {
  console.log('\n========================================');
  console.log('🔍 Checking Clinic Owner Accounts...');
  console.log('========================================\n');

  try {
    // Find all clinic owner accounts
    const clinicOwners = await prisma.user.findMany({
      where: {
        role: 'CLINIC_OWNER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        approvalStatus: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        clinicOnboardingData: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Found ${clinicOwners.length} clinic owner account(s)\n`);

    if (clinicOwners.length === 0) {
      console.log('❌ No clinic owner accounts found');
      return;
    }

    // Display each account
    clinicOwners.forEach((owner, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Account #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Name:            ${owner.name || 'Unknown'}`);
      console.log(`📱 Mobile:          ${owner.mobile || 'N/A'}`);
      console.log(`📧 Email:           ${owner.email || 'N/A'}`);
      console.log(`🔑 User ID:         ${owner.id}`);
      console.log(`✅ Status:          ${owner.approvalStatus}`);
      console.log(`📞 Phone Verified:  ${owner.isPhoneVerified ? 'Yes' : 'No'}`);
      console.log(`📧 Email Verified:  ${owner.isEmailVerified ? 'Yes' : 'No'}`);
      console.log(`📅 Created:         ${owner.createdAt.toLocaleString()}`);
      console.log(`🕐 Last Updated:    ${owner.updatedAt.toLocaleString()}`);
      
      // Check onboarding data
      const hasOnboardingData = owner.clinicOnboardingData && Object.keys(owner.clinicOnboardingData).length > 0;
      console.log(`📋 Onboarding Data: ${hasOnboardingData ? '✅ Present' : '❌ Missing'}`);
      
      if (hasOnboardingData) {
        const data = owner.clinicOnboardingData;
        
        // Step 1: Clinic Information
        if (data.clinicInformation) {
          const step1 = data.clinicInformation;
          console.log(`\n   📍 Step 1 - Clinic Information:`);
          console.log(`      Clinic Name:  ${step1.clinicName || 'N/A'}`);
          console.log(`      Owner Name:   ${step1.ownerName || 'N/A'}`);
          console.log(`      Owner Email:  ${step1.ownerEmail || 'N/A'}`);
          console.log(`      Owner Mobile: ${step1.ownerMobile || 'N/A'}`);
          console.log(`      City:         ${step1.city || 'N/A'}`);
          console.log(`      State:        ${step1.state || 'N/A'}`);
        }
        
        // Step 2: Services & Operations
        if (data.servicesOperations) {
          console.log(`   ✅ Step 2 - Services & Operations: Completed`);
        }
        
        // Step 3: Clinic Documents
        if (data.clinicDocuments) {
          console.log(`   ✅ Step 3 - Clinic Documents: Completed`);
        }
        
        // Step 4: Partner Agreement
        if (data.partnerAgreement) {
          console.log(`   ✅ Step 4 - Partner Agreement: Completed`);
        }
        
        console.log(`   📊 Current Step:  ${data.currentStep || 1}`);
      }
    });

    console.log('\n\n========================================');
    console.log('📝 Recommendations:');
    console.log('========================================\n');

    if (clinicOwners.length === 1) {
      console.log('✅ You have only 1 clinic owner account - looks good!');
    } else if (clinicOwners.length === 2) {
      console.log('⚠️  You have 2 clinic owner accounts!');
      console.log('\n🔍 Analysis:');
      
      // Check which has onboarding data
      const withData = clinicOwners.filter(o => 
        o.clinicOnboardingData && Object.keys(o.clinicOnboardingData).length > 0
      );
      const withoutData = clinicOwners.filter(o => 
        !o.clinicOnboardingData || Object.keys(o.clinicOnboardingData).length === 0
      );
      
      if (withData.length === 1 && withoutData.length === 1) {
        console.log(`\n   ✅ KEEP this account:`);
        console.log(`      Mobile: ${withData[0].mobile}`);
        console.log(`      Name: ${withData[0].name || 'Unknown'}`);
        console.log(`      Reason: Has onboarding data\n`);
        
        console.log(`   ❌ DELETE this account:`);
        console.log(`      Mobile: ${withoutData[0].mobile}`);
        console.log(`      Name: ${withoutData[0].name || 'Unknown'}`);
        console.log(`      Reason: No onboarding data (incomplete/test account)`);
      } else {
        console.log('   ⚠️  Both accounts have similar status');
        console.log('   Please review manually and decide which to keep');
      }
    } else {
      console.log(`⚠️  You have ${clinicOwners.length} clinic owner accounts!`);
      console.log('   This is unusual - please review and clean up duplicates');
    }

    console.log('\n\n========================================');

  } catch (error) {
    console.error('\n❌ Error checking clinic owners:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkClinicOwners();
