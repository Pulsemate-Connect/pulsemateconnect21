const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyClinic() {
  try {
    // Find all clinics
    const allClinics = await prisma.clinic.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true
          }
        },
        workingHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    console.log(`\n📊 Total Clinics in Database: ${allClinics.length}\n`);

    allClinics.forEach((clinic, index) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Clinic #${index + 1}: ${clinic.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`ID: ${clinic.id}`);
      console.log(`Owner: ${clinic.owner.name} (${clinic.owner.role})`);
      console.log(`Email: ${clinic.owner.email}`);
      console.log(`Mobile: ${clinic.owner.mobile}`);
      console.log(`Phone: ${clinic.phone || 'N/A'}`);
      console.log(`Address: ${clinic.address || 'N/A'}`);
      console.log(`City: ${clinic.city || 'N/A'}, State: ${clinic.state || 'N/A'}`);
      console.log(`Pincode: ${clinic.pincode || 'N/A'}`);
      console.log(`\nStatus:`);
      console.log(`  - Verified: ${clinic.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`  - Active: ${clinic.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`  - Approval Status: ${clinic.approvalStatus}`);
      console.log(`  - Owner Mobile Verified: ${clinic.ownerMobileVerified ? '✅ Yes' : '❌ No'}`);
      
      if (clinic.workingHours.length > 0) {
        console.log(`\n⏰ Working Hours (${clinic.workingHours.length} days):`);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        clinic.workingHours.forEach(h => {
          if (h.isOpen) {
            console.log(`  ${dayNames[h.dayOfWeek]}: ${h.morningStartTime}-${h.morningEndTime}, ${h.eveningStartTime}-${h.eveningEndTime}`);
          } else {
            console.log(`  ${dayNames[h.dayOfWeek]}: Closed`);
          }
        });
      } else {
        console.log(`\n⏰ Working Hours: None set`);
      }

      if (clinic.specialties && clinic.specialties.length > 0) {
        console.log(`\n🏥 Specialties: ${clinic.specialties.join(', ')}`);
      }

      if (clinic.facilities && clinic.facilities.length > 0) {
        console.log(`🏢 Facilities: ${clinic.facilities.join(', ')}`);
      }

      console.log(`\n📅 Created: ${clinic.createdAt.toLocaleString()}`);
      console.log(`📅 Updated: ${clinic.updatedAt.toLocaleString()}`);
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n✅ Verification Complete!`);
    console.log(`\n📱 Clinic Owner Login Credentials:`);
    console.log(`Mobile: +919876543210 or 9876543210`);
    console.log(`Test OTP: 123456 (configured in TEST_OTP_NUMBERS)`);
    console.log(`\n💡 The clinic owner can login to the mobile app with these credentials.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyClinic();
