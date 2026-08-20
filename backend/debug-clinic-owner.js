const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugClinicOwner() {
  try {
    console.log('\n=== Debugging Clinic Data ===\n');
    
    // Get the most recent CLINIC_OWNER user
    const clinicOwner = await prisma.user.findFirst({
      where: { role: 'CLINIC_OWNER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        clinicOnboardingData: true,
        ownedClinics: {
          select: {
            id: true,
            name: true,
            specialties: true,
            consultationModes: true,
          },
        },
      },
    });

    if (!clinicOwner) {
      console.log('❌ No clinic owner found');
      return;
    }

    console.log('👤 User ID:', clinicOwner.id);
    console.log('Name:', clinicOwner.name || '(null)');
    console.log('Email:', clinicOwner.email || '(null)');
    
    console.log('\n📋 Onboarding Data - Step 2 (Services & Operations):');
    const step2 = clinicOwner.clinicOnboardingData?.servicesOperations || {};
    console.log('services:', JSON.stringify(step2.services || []));
    console.log('consultationTypes:', JSON.stringify(step2.consultationTypes || []));
    console.log('appointmentModes:', JSON.stringify(step2.appointmentModes || []));
    console.log('appointmentMode:', step2.appointmentMode || '(not set)');
    console.log('openingTime:', step2.openingTime || '(not set)');
    console.log('closingTime:', step2.closingTime || '(not set)');
    console.log('weeklyOffDays:', JSON.stringify(step2.weeklyOffDays || []));

    console.log('\n🏥 Clinic Table Data:');
    if (clinicOwner.ownedClinics.length === 0) {
      console.log('(No clinics found)');
    } else {
      clinicOwner.ownedClinics.forEach((clinic, i) => {
        console.log(`\nClinic ${i + 1}:`);
        console.log('  Name:', clinic.name || '(null)');
        console.log('  Specialties (from table):', JSON.stringify(clinic.specialties || []));
        console.log('  Consultation Modes (from table):', JSON.stringify(clinic.consultationModes || []));
      });
    }

    console.log('\n=== End Debug ===\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClinicOwner();
