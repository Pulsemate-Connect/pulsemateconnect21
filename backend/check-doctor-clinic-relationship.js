/**
 * Direct database check for doctor-clinic relationships
 * Run this to see what's in the database after admin approval
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDoctorClinicRelationships() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Checking Doctor-Clinic Relationships in Database     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Get test clinic
    console.log('1️⃣ Finding Test Clinic...');
    const testClinic = await prisma.clinic.findFirst({
      where: {
        owner: { 
          mobile: '+919876543211'
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
          },
        },
      },
    });

    if (!testClinic) {
      console.log('❌ Test clinic not found');
      console.log('   Looking for email: testclinic@pulsemateconnect.in');
      console.log('   Or owner mobile: 9876543211\n');
      return;
    }

    console.log('✅ Test Clinic Found:');
    console.log('   ID:', testClinic.id);
    console.log('   Name:', testClinic.name);
    console.log('   Owner:', testClinic.owner.name, `(${testClinic.owner.mobile})`);
    console.log('   Approval Status:', testClinic.approvalStatus);
    console.log('   Is Verified:', testClinic.isVerified);
    console.log();

    // 2. Check doctor invitations
    console.log('2️⃣ Checking Doctor Invitations...');
    const invitations = await prisma.doctorInvitation.findMany({
      where: {
        clinicId: testClinic.id,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
          },
        },
        doctorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                approvalStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Found ${invitations.length} invitation(s)\n`);

    if (invitations.length > 0) {
      invitations.forEach((inv, idx) => {
        console.log(`   Invitation ${idx + 1}:`);
        console.log('     ID:', inv.id);
        console.log('     Doctor Name:', inv.doctorName);
        console.log('     Doctor Mobile:', inv.doctorMobile);
        console.log('     Doctor Email:', inv.doctorEmail);
        console.log('     Status:', inv.status);
        console.log('     Invited By:', inv.invitedBy?.name || 'Unknown');
        console.log('     Created:', inv.createdAt.toLocaleString());
        console.log('     Accepted:', inv.acceptedAt ? inv.acceptedAt.toLocaleString() : 'Not yet');
        console.log('     Verified:', inv.verifiedAt ? inv.verifiedAt.toLocaleString() : 'Not yet');
        
        if (inv.doctorProfile) {
          console.log('     Profile Status:', inv.doctorProfile.profileStatus);
          console.log('     Verification Status:', inv.doctorProfile.verificationStatus);
          console.log('     User Approval Status:', inv.doctorProfile.user.approvalStatus);
        }
        console.log();
      });
    }

    // 3. Check DoctorClinic relationships
    console.log('3️⃣ Checking DoctorClinic Relationships (clinic_doctors table)...');
    const doctorClinics = await prisma.doctorClinic.findMany({
      where: {
        clinicId: testClinic.id,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                approvalStatus: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Found ${doctorClinics.length} doctor-clinic relationship(s)\n`);

    if (doctorClinics.length > 0) {
      doctorClinics.forEach((dc, idx) => {
        console.log(`   Relationship ${idx + 1}:`);
        console.log('     ID:', dc.id);
        console.log('     Doctor:', dc.doctor.user.name);
        console.log('     Mobile:', dc.doctor.user.mobile);
        console.log('     Email:', dc.doctor.user.email || 'N/A');
        console.log('     Doctor Profile ID:', dc.doctorId);
        console.log('     Clinic ID:', dc.clinicId);
        console.log('     Invite Status:', dc.inviteStatus, dc.inviteStatus === 'ACCEPTED' ? '✅' : '⚠️');
        console.log('     Is Active:', dc.isActive, dc.isActive ? '✅' : '❌');
        console.log('     Role at Clinic:', dc.roleAtClinic);
        console.log('     Consultation Fee:', dc.consultationFee || 'Not set');
        console.log('     Joined At:', dc.joinedAt ? dc.joinedAt.toLocaleString() : 'Not set');
        console.log('     Admin Verified At:', dc.adminVerifiedAt ? dc.adminVerifiedAt.toLocaleString() : 'NOT VERIFIED ❌');
        console.log('     Admin Verified By ID:', dc.adminVerifiedById || 'N/A');
        console.log('     User Approval Status:', dc.doctor.user.approvalStatus);
        console.log('     Profile Verification:', dc.doctor.verificationStatus);
        console.log();
      });
    } else {
      console.log('   ❌ No doctor-clinic relationships found!');
      console.log('   This is the issue - doctors are not linked to clinic after approval\n');
    }

    // 4. Check doctors with VERIFIED status
    console.log('4️⃣ Checking All Verified Doctors...');
    const verifiedDoctors = await prisma.doctorProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
            approvalStatus: true,
          },
        },
        invitation: {
          where: {
            clinicId: testClinic.id,
          },
        },
      },
    });

    console.log(`   Found ${verifiedDoctors.length} verified doctor(s)\n`);

    if (verifiedDoctors.length > 0) {
      verifiedDoctors.forEach((doc, idx) => {
        console.log(`   Doctor ${idx + 1}:`);
        console.log('     Name:', doc.fullLegalName || doc.user.name);
        console.log('     Mobile:', doc.user.mobile);
        console.log('     Email:', doc.user.email || 'N/A');
        console.log('     Profile ID:', doc.id);
        console.log('     User ID:', doc.user.id);
        console.log('     Verification Status:', doc.verificationStatus);
        console.log('     User Approval Status:', doc.user.approvalStatus);
        console.log('     Invited to Test Clinic:', doc.invitation.length > 0 ? 'YES ✅' : 'NO ❌');
        console.log();
      });
    }

    // 5. Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                          SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`Test Clinic: ${testClinic.name} (${testClinic.approvalStatus})`);
    console.log(`Invitations: ${invitations.length}`);
    console.log(`Doctor-Clinic Links: ${doctorClinics.length}`);
    console.log(`Verified Doctors: ${verifiedDoctors.length}`);
    console.log();

    if (doctorClinics.length === 0 && invitations.length > 0) {
      console.log('⚠️  ISSUE IDENTIFIED:');
      console.log('   Doctors have been invited, but DoctorClinic relationships are missing!');
      console.log('   This means the approveDoctor function may not be creating the link properly.');
      console.log();
      console.log('💡 SOLUTION:');
      console.log('   The approveDoctor function needs to create DoctorClinic entries.');
      console.log('   This should happen automatically when admin approves a doctor.');
    } else if (doctorClinics.length > 0) {
      const acceptedLinks = doctorClinics.filter(dc => dc.inviteStatus === 'ACCEPTED' && dc.isActive);
      if (acceptedLinks.length > 0) {
        console.log('✅ WORKING CORRECTLY:');
        console.log(`   ${acceptedLinks.length} doctor(s) properly linked to clinic`);
        console.log('   They should appear in clinic doctor portal');
      } else {
        console.log('⚠️  ISSUE:');
        console.log('   DoctorClinic links exist but inviteStatus is not ACCEPTED or not active');
        console.log('   Check the approveDoctor function logic');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoctorClinicRelationships();
