/**
 * Fix Doctor-Clinic Linking Issue
 * 
 * This script fixes approved doctors who are not appearing in clinic dashboards
 * by creating the missing clinic_doctors relationships.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n============================================');
  console.log('Doctor-Clinic Linking Fix');
  console.log('============================================\n');

  try {
    // Step 1: Find and fix missing invitationId links
    console.log('Step 1: Fixing missing invitationId in doctor profiles...');
    
    const profilesNeedingFix = await prisma.$queryRaw`
      SELECT 
        dp.id as profile_id,
        dp."userId" as user_id,
        di.id as invitation_id
      FROM doctor_profiles dp
      JOIN users u ON dp."userId" = u.id
      JOIN doctor_invitations di ON di."doctorUserId" = u.id
      WHERE dp."invitationId" IS NULL
        AND di.id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM doctor_profiles dp2 
          WHERE dp2."invitationId" = di.id AND dp2.id != dp.id
        )
    `;

    console.log(`Found ${profilesNeedingFix.length} profiles needing invitationId fix`);

    for (const profile of profilesNeedingFix) {
      await prisma.doctorProfile.update({
        where: { id: profile.profile_id },
        data: { invitationId: profile.invitation_id },
      });
      console.log(`  ✅ Linked profile ${profile.profile_id} to invitation ${profile.invitation_id}`);
    }

    // Step 2: Find approved doctors missing clinic_doctors entries
    console.log('\nStep 2: Finding approved doctors missing clinic links...');
    
    const doctorsNeedingLinks = await prisma.$queryRaw`
      SELECT 
        dp.id as doctor_profile_id,
        di."clinicId" as clinic_id,
        di.specialization,
        dp."consultationFee",
        dp."avgConsultationMins",
        di."acceptedAt",
        di."verifiedAt",
        di."submittedAt",
        u.name as doctor_name
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp."userId"
      JOIN doctor_invitations di ON dp."invitationId" = di.id
      LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
      WHERE u.role = 'DOCTOR' 
        AND u."approvalStatus" = 'VERIFIED'
        AND di."clinicId" IS NOT NULL
        AND dc.id IS NULL
    `;

    console.log(`Found ${doctorsNeedingLinks.length} doctors missing clinic links`);

    // Step 3: Create missing clinic_doctors entries
    for (const doctor of doctorsNeedingLinks) {
      const clinicDoctor = await prisma.doctorClinic.create({
        data: {
          doctorId: doctor.doctor_profile_id,
          clinicId: doctor.clinic_id,
          inviteStatus: 'ACCEPTED',
          roleAtClinic: doctor.specialization || 'CONSULTANT',
          consultationFee: doctor.consultationFee,
          availableDays: [],
          avgConsultationMins: doctor.avgConsultationMins || 10,
          isActive: true,
          joinedAt: doctor.verifiedAt || doctor.acceptedAt || new Date(),
          adminVerifiedAt: doctor.verifiedAt,
          invitationAcceptedAt: doctor.acceptedAt,
          verificationSubmittedAt: doctor.submittedAt,
        },
      });
      console.log(`  ✅ Created clinic link for ${doctor.doctor_name} (${doctor.doctor_profile_id})`);
    }

    // Step 4: Verification
    console.log('\nStep 3: Verification...');
    
    const verificationResults = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_verified,
        COUNT(CASE WHEN dc.id IS NOT NULL THEN 1 END) as linked,
        COUNT(CASE WHEN dc.id IS NULL THEN 1 END) as still_missing
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp."userId"
      LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
      LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
      WHERE u.role = 'DOCTOR' AND u."approvalStatus" = 'VERIFIED'
    `;

    const stats = verificationResults[0];
    console.log('\nResults:');
    console.log(`  Total verified doctors: ${stats.total_verified}`);
    console.log(`  Properly linked: ${stats.linked}`);
    console.log(`  Still missing: ${stats.still_missing}`);

    if (stats.still_missing > 0) {
      console.log('\n⚠️  Some doctors are still not linked. Checking details...');
      
      const stillMissing = await prisma.$queryRaw`
        SELECT 
          u.name,
          u.id as user_id,
          dp."invitationId",
          di."clinicId"
        FROM users u
        JOIN doctor_profiles dp ON u.id = dp."userId"
        LEFT JOIN doctor_invitations di ON dp."invitationId" = di.id
        LEFT JOIN clinic_doctors dc ON dp.id = dc."doctorId" AND di."clinicId" = dc."clinicId"
        WHERE u.role = 'DOCTOR' 
          AND u."approvalStatus" = 'VERIFIED'
          AND dc.id IS NULL
      `;

      stillMissing.forEach((doctor) => {
        console.log(`    - ${doctor.name}: invitationId=${doctor.invitationId}, clinicId=${doctor.clinicId}`);
      });
    } else {
      console.log('\n✅ All approved doctors are now properly linked!');
    }

    console.log('\n============================================');
    console.log('Fix Complete!');
    console.log('============================================');
    console.log('\nNext steps:');
    console.log('1. Refresh your clinic dashboard');
    console.log('2. Check the doctors section - they should appear now');
    console.log('3. Test in mobile app - doctors should show in clinic details\n');

  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
