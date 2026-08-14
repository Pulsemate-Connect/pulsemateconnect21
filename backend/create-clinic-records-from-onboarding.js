/**
 * Migration Script: Create Clinic Records from Existing Onboarding Data
 * 
 * This script creates Clinic records for clinic owners who completed
 * the 4-step onboarding but don't have Clinic records yet.
 * 
 * Run with: node create-clinic-records-from-onboarding.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createClinicRecordsFromOnboardingData() {
  try {
    console.log('\n🔍 Finding clinic owners with onboarding data but no Clinic record...\n');

    // Find all clinic owners with onboarding data
    const clinicOwners = await prisma.user.findMany({
      where: {
        role: 'CLINIC_OWNER',
        clinicOnboardingData: { not: prisma.DbNull },
      },
      include: {
        ownedClinics: true,
      },
    });

    console.log(`Found ${clinicOwners.length} clinic owners with onboarding data`);

    let created = 0;
    let skipped = 0;

    for (const owner of clinicOwners) {
      // Skip if clinic record already exists
      if (owner.ownedClinics && owner.ownedClinics.length > 0) {
        console.log(`⏭️  Skipping ${owner.email} - Clinic record already exists`);
        skipped++;
        continue;
      }

      const onboardingData = owner.clinicOnboardingData || {};
      const step1 = onboardingData.clinicInformation || {};
      const step2 = onboardingData.servicesOperations || {};
      const step3 = onboardingData.clinicDocuments || {};

      // Validate required fields
      if (!step1 || !step1.clinicName) {
        console.log(`⚠️  Skipping ${owner.email || owner.mobile} - Missing or incomplete onboarding data`);
        skipped++;
        continue;
      }

      try {
        // Create Clinic record
        const clinic = await prisma.clinic.create({
          data: {
            name: step1.clinicName,
            ownerId: owner.id,
            phone: step1.phone || owner.mobile,
            address: step1.address || null,
            city: step1.city || null,
            district: step1.district || null,
            state: step1.state || null,
            pincode: step1.pincode || null,
            landmark: step1.landmark || null,
            latitude: step1.latitude ? parseFloat(step1.latitude) : null,
            longitude: step1.longitude ? parseFloat(step1.longitude) : null,
            googleMapsLocation: step1.googleMapsLocation,
            clinicType: step1.clinicType,
            clinicRegistrationNumber: step1.clinicRegistrationNumber,
            approvalStatus: owner.approvalStatus || 'PENDING',
            submittedAt: onboardingData.submittedAt ? new Date(onboardingData.submittedAt) : new Date(),
            // Step 2 data
            specialties: step2.services || [],
            openingHours: step2.operatingHours ? JSON.stringify(step2.operatingHours) : null,
            consultationModes: step2.appointmentModes || [],
            facilities: step2.facilities || [],
            languagesSpoken: step2.languages || [],
            // Step 3 data
            licenseDocumentUrl: step3.clinicLicense,
            medicalEstablishmentCertificateUrl: step3.medicalCertificate,
            gstCertificateUrl: step3.gstCertificate,
            panCardUrl: step3.panCard,
            gstNumber: step3.gstNumber,
            panNumber: step3.panNumber,
            isActive: false,
          },
        });

        console.log(`✅ Created Clinic record for ${owner.email}: ${clinic.name} (${clinic.id})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating clinic for ${owner.email}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} clinics`);
    console.log(`   ⏭️  Skipped: ${skipped} clinics`);
    console.log(`\n✨ Migration complete!\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
createClinicRecordsFromOnboardingData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
