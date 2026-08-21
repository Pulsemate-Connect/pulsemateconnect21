// ═══════════════════════════════════════════════════════════════════════════════
// CONVERT INCOMPLETE CLINIC OWNER REGISTRATIONS TO PATIENTS
// ═══════════════════════════════════════════════════════════════════════════════
//
// ISSUE: Users registered via clinic owner flow but:
//   - Never completed clinic onboarding
//   - Have no clinics
//   - Have no clinic owner profile (except one genuine user)
//   - Are trying to use patient mobile app
//   - Getting permission errors
//
// SOLUTION: Convert incomplete clinic owner registrations to patients
//   - Keep genuine clinic owners (have clinicOwnerProfile)
//   - Convert others to PATIENT role
//   - Create PatientProfile for them
//   - Set status to VERIFIED
//
// ═══════════════════════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN !== 'false';

const log = (msg, data = {}) => console.log(`[${new Date().toISOString()}] ${msg}`, Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');

async function convertIncompleteOwnersToPatients() {
  log(`\n${'='.repeat(80)}`);
  log(`  CONVERT INCOMPLETE CLINIC OWNER REGISTRATIONS TO PATIENTS`);
  log(`${'='.repeat(80)}\n`);
  log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE MODE'}`);
  log('');

  try {
    // Find all CLINIC_OWNER users
    const clinicOwners = await prisma.user.findMany({
      where: { role: 'CLINIC_OWNER' },
      include: {
        patientProfile: true,
        ownedClinics: true,
        clinicOwnerProfile: true,
      },
    });

    log(`Found ${clinicOwners.length} users with role='CLINIC_OWNER'`);

    // Filter: Keep only those who should be converted to patients
    const toConvert = clinicOwners.filter(u => {
      // Keep as CLINIC_OWNER if they have clinicOwnerProfile
      if (u.clinicOwnerProfile) return false;
      
      // Keep as CLINIC_OWNER if they own clinics
      if (u.ownedClinics && u.ownedClinics.length > 0) return false;
      
      // Convert to PATIENT
      return true;
    });

    log(`\nUsers to convert to PATIENT: ${toConvert.length}\n`);

    if (toConvert.length === 0) {
      log('✅ No incomplete clinic owner registrations found!');
      return;
    }

    // Display users
    const userDetails = toConvert.map(u => ({
      mobile: u.mobile,
      name: u.name || 'null',
      currentRole: u.role,
      newRole: 'PATIENT',
      approvalStatus: u.approvalStatus,
      authProvider: u.authProvider,
      hasPatientProfile: !!u.patientProfile,
      createdAt: u.createdAt.toISOString().split('T')[0],
    }));

    console.table(userDetails);

    // Create backup
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `incomplete-owners-backup-${Date.now()}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalUsers: toConvert.length,
        users: userDetails,
        fullData: toConvert,
      }, null, 2)
    );

    log(`\n✅ Backup created: ${backupFile}\n`);

    if (DRY_RUN) {
      log('🔍 DRY RUN MODE - No changes will be made');
      log(`\nTo apply these changes, run:`);
      log(`  DRY_RUN=false node backend/scripts/convert-incomplete-owners-to-patients.js\n`);
      return;
    }

    log('⚠️  LIVE MODE - Applying conversions...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of toConvert) {
      try {
        // Update user: change role to PATIENT, set to VERIFIED
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: 'PATIENT',
            approvalStatus: 'VERIFIED',
            // Create patient profile if doesn't exist
            patientProfile: user.patientProfile ? undefined : {
              create: {
                registeredVia: 'ADMIN_CONVERSION',
                createdByRole: 'SYSTEM',
              },
            },
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'INCOMPLETE_OWNER_CONVERTED_TO_PATIENT',
            entityType: 'User',
            entityId: user.id,
            metadata: {
              oldRole: 'CLINIC_OWNER',
              newRole: 'PATIENT',
              oldStatus: user.approvalStatus,
              newStatus: 'VERIFIED',
              reason: 'Incomplete clinic owner registration - no clinic, no profile',
              scriptVersion: '1.0',
              convertedAt: new Date().toISOString(),
            },
          },
        });

        successCount++;
        log(`  ✅ Converted: ${user.mobile} (${user.name || 'No name'})`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Failed: ${user.mobile}:`, error.message);
      }
    }

    log(`\n${'='.repeat(80)}`);
    log(`  CONVERSION COMPLETE`);
    log(`${'='.repeat(80)}\n`);
    log(`Total Identified: ${toConvert.length}`);
    log(`Successfully Converted: ${successCount}`);
    log(`Errors: ${errorCount}`);
    log(`Backup: ${backupFile}`);
    log('');

    if (successCount > 0) {
      log('⚠️  IMPORTANT NEXT STEPS:');
      log('  1. Affected users must LOGOUT and LOGIN again');
      log('  2. They should use PATIENT mobile app (Firebase Phone Auth)');
      log('  3. Their JWT tokens will have role=PATIENT after re-login');
      log('  4. Profile update will work');
      log('');
    }

    // Verify
    log('Verifying conversion...');
    const remainingIncomplete = await prisma.user.count({
      where: {
        role: 'CLINIC_OWNER',
        clinicOwnerProfile: null,
        ownedClinics: { none: {} },
      },
    });

    if (remainingIncomplete === 0) {
      log('✅ Verification passed! All incomplete registrations converted.\n');
    } else {
      log(`⚠️  Warning: ${remainingIncomplete} users still need conversion. Re-run the script.\n`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function runDiagnostics() {
  log('\n' + '='.repeat(80));
  log('  DIAGNOSTICS: Incomplete Clinic Owner Registrations');
  log('='.repeat(80) + '\n');

  const clinicOwners = await prisma.user.findMany({
    where: { role: 'CLINIC_OWNER' },
    include: {
      clinicOwnerProfile: true,
      ownedClinics: true,
    },
  });

  const genuine = clinicOwners.filter(u => u.clinicOwnerProfile || (u.ownedClinics && u.ownedClinics.length > 0));
  const incomplete = clinicOwners.filter(u => !u.clinicOwnerProfile && (!u.ownedClinics || u.ownedClinics.length === 0));

  log(`Total CLINIC_OWNER users: ${clinicOwners.length}`);
  log(`✅ Genuine clinic owners: ${genuine.length}`);
  log(`❌ Incomplete registrations (should be PATIENT): ${incomplete.length}`);
  log('');

  await prisma.$disconnect();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--diagnostics') || args.includes('-d')) {
    await runDiagnostics();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node backend/scripts/convert-incomplete-owners-to-patients.js [options]

Options:
  --diagnostics, -d    Run diagnostics only
  --help, -h           Show this help

Environment:
  DRY_RUN=false        Apply conversions (default: true)

Examples:
  # Dry run:
  node backend/scripts/convert-incomplete-owners-to-patients.js

  # Apply:
  DRY_RUN=false node backend/scripts/convert-incomplete-owners-to-patients.js

  # Diagnostics:
  node backend/scripts/convert-incomplete-owners-to-patients.js --diagnostics
    `);
  } else {
    await convertIncompleteOwnersToPatients();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { convertIncompleteOwnersToPatients, runDiagnostics };
