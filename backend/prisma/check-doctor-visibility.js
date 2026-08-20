/**
 * Check if doctors meet the searchDoctors criteria
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('🔍 Checking doctor visibility criteria...\n');

  const doctors = await prisma.doctorProfile.findMany({
    where: {
      user: {
        mobile: {
          in: [
            '9111111111', '9222222222', '9333333333', '9444444444', '9555555555',
            '9666666666', '9777777777', '9888888888', '9999999991', '9999999992'
          ]
        }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
          isActive: true,
        }
      },
      doctorClinics: {
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              approvalStatus: true,
              isActive: true,
            }
          }
        }
      }
    }
  });

  console.log(`📊 Found ${doctors.length} test doctors\n`);

  doctors.forEach(doctor => {
    console.log(`👨‍⚕️ ${doctor.user.name}`);
    console.log(`   Mobile: ${doctor.user.mobile}`);
    console.log(`   User Role: ${doctor.user.role} ✅`);
    console.log(`   User Active: ${doctor.user.isActive} ${doctor.user.isActive ? '✅' : '❌'}`);
    console.log(`   Profile Status: ${doctor.approvalStatus} ${doctor.approvalStatus === 'VERIFIED' ? '✅' : '❌'}`);
    console.log(`   Marketplace Visible: ${doctor.marketplaceVisible} ${doctor.marketplaceVisible ? '✅' : '❌'}`);
    console.log(`   Specialization: ${doctor.specialization}`);
    
    const verifiedActiveClinics = doctor.doctorClinics.filter(dc => 
      dc.isActive && 
      dc.inviteStatus === 'ACCEPTED' && 
      dc.clinic.isVerified && 
      dc.clinic.approvalStatus === 'VERIFIED' && 
      dc.clinic.isActive
    );
    
    console.log(`   Clinic Associations: ${doctor.doctorClinics.length} total`);
    doctor.doctorClinics.forEach(dc => {
      console.log(`      • ${dc.clinic.name}`);
      console.log(`        - Invite Status: ${dc.inviteStatus} ${dc.inviteStatus === 'ACCEPTED' ? '✅' : '❌'}`);
      console.log(`        - DC Active: ${dc.isActive} ${dc.isActive ? '✅' : '❌'}`);
      console.log(`        - Clinic Verified: ${dc.clinic.isVerified} ${dc.clinic.isVerified ? '✅' : '❌'}`);
      console.log(`        - Clinic Status: ${dc.clinic.approvalStatus} ${dc.clinic.approvalStatus === 'VERIFIED' ? '✅' : '❌'}`);
      console.log(`        - Clinic Active: ${dc.clinic.isActive} ${dc.clinic.isActive ? '✅' : '❌'}`);
    });
    
    console.log(`   ✅ Verified Active Clinics: ${verifiedActiveClinics.length}`);
    
    const meetsSearchCriteria = 
      doctor.user.role === 'DOCTOR' &&
      doctor.user.isActive &&
      doctor.approvalStatus === 'VERIFIED' &&
      doctor.marketplaceVisible &&
      verifiedActiveClinics.length > 0;
    
    console.log(`   ${meetsSearchCriteria ? '✅ WILL APPEAR IN SEARCH' : '❌ WILL NOT APPEAR IN SEARCH'}\n`);
  });

  // Now test the actual search query
  console.log('\n🔍 Testing actual searchDoctors query...\n');
  
  const verifiedClinicFilter = {
    some: {
      isActive: true,
      inviteStatus: 'ACCEPTED',
      clinic: { approvalStatus: 'VERIFIED', isActive: true },
    },
  };

  const where = {
    approvalStatus: 'VERIFIED',
    marketplaceVisible: true,
    user: { isActive: true, role: 'DOCTOR' },
    doctorClinics: verifiedClinicFilter,
  };

  const searchResults = await prisma.doctorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, mobile: true } },
      doctorClinics: {
        where: {
          isActive: true,
          inviteStatus: 'ACCEPTED',
          clinic: { approvalStatus: 'VERIFIED', isActive: true },
        },
        include: {
          clinic: {
            select: {
              id: true, name: true, city: true, address: true,
              isVerified: true, approvalStatus: true,
            },
          },
        },
      },
    },
  });

  console.log(`✅ Search query returned ${searchResults.length} doctors\n`);
  
  if (searchResults.length > 0) {
    console.log('Doctors that will appear in search:');
    searchResults.forEach(d => {
      console.log(`   • ${d.user.name} (${d.specialization})`);
    });
  } else {
    console.log('⚠️  No doctors match the search criteria!');
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
