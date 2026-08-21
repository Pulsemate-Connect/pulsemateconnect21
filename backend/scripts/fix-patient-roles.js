// ═══════════════════════════════════════════════════════════════════════════════
// FIX PATIENT ROLES - PulseMate Connect RBAC Audit Fix
// ═══════════════════════════════════════════════════════════════════════════════
//
// ISSUE: Users who registered via mobile app (Firebase Phone Auth) were incorrectly
//        assigned role='CLINIC_OWNER' instead of role='PATIENT'
//
// ROOT CAUSE: 
//   1. JWT token includes role claim from database
//   2. Authorization middleware checks req.user.role against allowed roles
//   3. Patient profile update route requires: PATIENT | DOCTOR | ADMIN | SUPER_ADMIN
//   4. Users with role='CLINIC_OWNER' get 403 "You do not have permission"
//
// FIX: 
//   - Identify users who should be PATIENTS (have patientProfile, no clinic ownership)
//   - Update their role from CLINIC_OWNER to PATIENT
//   - Preserve genuine clinic owners (have ownedClinics)
//
// SAFETY:
//   - Dry run mode by default (shows what would change without modifying)
//   - Validates before changing
//   - Creates audit log
//   - Backs up affected user IDs
//
// ═══════════════════════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Configuration ──────────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Safe default: dry run unless explicitly disabled
const BATCH_SIZE = 100; // Process in batches to avoid memory issues

// ── Helper Functions ───────────────────────────────────────────────────────────
const log = (message, data = {}) => {
  console.log(`[${new Date().toISOString()}] ${message}`, 
    Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : ''
  );
};

const logError = (message, error) => {
  console.error(`[${new Date().toISOString()}] ❌ ${message}`, {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });
};

// ── Main Fix Function ──────────────────────────────────────────────────────────
async function fixPatientRoles() {
  log(`\n${'='.repeat(80)}`);
  log(`  PULSEMATE CONNECT - FIX PATIENT ROLES`);
  log(`${'='.repeat(80)}\n`);
  log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE (will modify database)'}`);
  log(`Batch Size: ${BATCH_SIZE}`);
  log('');

  try {
    // ── Step 1: Find users with incorrect roles ─────────────────────────────────
    log('Step 1: Identifying users with incorrect roles...\n');

    // Find all users with role='CLINIC_OWNER' who have a patientProfile
    // (genuine clinic owners will have ownedClinics relation)
    const incorrectRoleUsers = await prisma.user.findMany({
      where: {
        role: 'CLINIC_OWNER',
        patientProfile: {
          isNot: null, // Has a patient profile
        },
      },
      include: {
        patientProfile: true,
        ownedClinics: true,
        clinicOwnerProfile: true,
      },
    });

    log(`Found ${incorrectRoleUsers.length} users with role='CLINIC_OWNER' and patientProfile`);

    // ── Step 2: Filter to only those who are NOT genuine clinic owners ──────────
    const patientsToFix = incorrectRoleUsers.filter(user => {
      // Keep as CLINIC_OWNER if they genuinely own clinics
      if (user.ownedClinics && user.ownedClinics.length > 0) {
        return false;
      }
      // Keep as CLINIC_OWNER if they have a clinic owner profile
      if (user.clinicOwnerProfile) {
        return false;
      }
      // Should be changed to PATIENT
      return true;
    });

    log(`\nIdentified ${patientsToFix.length} users who should be PATIENT:\n`);

    if (patientsToFix.length === 0) {
      log('✅ No incorrect roles found! All users have correct roles.');
      return;
    }

    // ── Step 3: Display affected users ──────────────────────────────────────────
    const affectedUserDetails = patientsToFix.map(user => ({
      id: user.id,
      mobile: user.mobile,
      name: user.name || user.patientProfile?.patientName || 'Unknown',
      currentRole: user.role,
      newRole: 'PATIENT',
      authProvider: user.authProvider,
      hasPatientProfile: !!user.patientProfile,
      hasOwnedClinics: user.ownedClinics?.length || 0,
      createdAt: user.createdAt,
    }));

    console.table(affectedUserDetails);

    // ── Step 4: Create backup file ──────────────────────────────────────────────
    const backupFilename = `backup-incorrect-roles-${Date.now()}.json`;
    const fs = require('fs');
    const path = require('path');
    const backupPath = path.join(__dirname, 'backups', backupFilename);
    
    // Ensure backups directory exists
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(
      backupPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalUsers: patientsToFix.length,
        users: affectedUserDetails,
      }, null, 2)
    );

    log(`\n✅ Backup created: ${backupPath}\n`);

    // ── Step 5: Apply fixes (or simulate in dry run mode) ───────────────────────
    if (DRY_RUN) {
      log('🔍 DRY RUN MODE - No changes will be made');
      log(`\nTo apply these changes, run:`);
      log(`  DRY_RUN=false node backend/scripts/fix-patient-roles.js\n`);
      return;
    }

    log('⚠️  LIVE MODE - Applying fixes...\n');

    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < patientsToFix.length; i += BATCH_SIZE) {
      const batch = patientsToFix.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(patientsToFix.length / BATCH_SIZE);

      log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} users)...`);

      for (const user of batch) {
        try {
          // Update user role
          await prisma.user.update({
            where: { id: user.id },
            data: {
              role: 'PATIENT',
            },
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'ROLE_FIXED_BY_SCRIPT',
              entityType: 'User',
              entityId: user.id,
              metadata: {
                oldRole: 'CLINIC_OWNER',
                newRole: 'PATIENT',
                reason: 'RBAC audit fix - user had patientProfile but not clinic ownership',
                scriptVersion: '1.0',
                fixedAt: new Date().toISOString(),
              },
            },
          });

          successCount++;
          log(`  ✅ Fixed: ${user.mobile} (${user.name || 'Unknown'})`);
        } catch (error) {
          errorCount++;
          logError(`  ❌ Failed to fix user ${user.mobile}:`, error);
        }
      }
    }

    // ── Step 6: Summary ──────────────────────────────────────────────────────────
    log(`\n${'='.repeat(80)}`);
    log(`  FIX COMPLETE`);
    log(`${'='.repeat(80)}\n`);
    log(`Total Users Identified: ${patientsToFix.length}`);
    log(`Successfully Fixed: ${successCount}`);
    log(`Errors: ${errorCount}`);
    log(`Backup File: ${backupPath}`);
    log('');

    if (successCount > 0) {
      log('⚠️  IMPORTANT NEXT STEPS:');
      log('  1. Affected users must LOGOUT and LOGIN again to refresh their JWT token');
      log('  2. Their old JWT tokens still have role=CLINIC_OWNER');
      log('  3. New JWT tokens will have role=PATIENT');
      log('  4. Profile update will work after re-login');
      log('');
    }

    // ── Step 7: Verify fix ───────────────────────────────────────────────────────
    log('Verifying fix...');
    const remainingIncorrect = await prisma.user.count({
      where: {
        role: 'CLINIC_OWNER',
        patientProfile: { isNot: null },
        ownedClinics: { none: {} },
        clinicOwnerProfile: null,
      },
    });

    if (remainingIncorrect === 0) {
      log('✅ Verification passed! All roles are now correct.\n');
    } else {
      log(`⚠️  Warning: ${remainingIncorrect} users still have incorrect roles. Re-run the script.\n`);
    }

  } catch (error) {
    logError('Fatal error during execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ── Additional Diagnostic Function ────────────────────────────────────────────
async function runDiagnostics() {
  log('\n' + '='.repeat(80));
  log('  RBAC DIAGNOSTICS');
  log('='.repeat(80) + '\n');

  try {
    // Count users by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    log('Users by Role:');
    console.table(roleCounts.map(r => ({ role: r.role, count: r._count })));

    // Count users with patientProfile
    const patientsWithProfile = await prisma.patientProfile.count();
    log(`\nTotal PatientProfiles: ${patientsWithProfile}`);

    // Count patients with correct role
    const correctPatients = await prisma.user.count({
      where: {
        role: 'PATIENT',
        patientProfile: { isNot: null },
      },
    });
    log(`Users with role=PATIENT AND patientProfile: ${correctPatients}`);

    // Count incorrect role assignments
    const incorrectClinicOwners = await prisma.user.count({
      where: {
        role: 'CLINIC_OWNER',
        patientProfile: { isNot: null },
        ownedClinics: { none: {} },
        clinicOwnerProfile: null,
      },
    });
    log(`\n❌ Users with role=CLINIC_OWNER but should be PATIENT: ${incorrectClinicOwners}`);

    // Genuine clinic owners
    const genuineClinicOwners = await prisma.user.count({
      where: {
        role: 'CLINIC_OWNER',
        ownedClinics: { some: {} },
      },
    });
    log(`✅ Genuine Clinic Owners (have ownedClinics): ${genuineClinicOwners}`);

    // Users with no name
    const noNameUsers = await prisma.user.count({
      where: {
        OR: [
          { name: null },
          { name: '' },
        ],
      },
    });
    log(`\n⚠️  Users with no name (will show as "Unknown"): ${noNameUsers}`);

    log('');
  } catch (error) {
    logError('Diagnostics failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ── CLI Entry Point ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--diagnostics') || args.includes('-d')) {
    await runDiagnostics();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node backend/scripts/fix-patient-roles.js [options]

Options:
  --diagnostics, -d    Run diagnostics only (no fixes)
  --help, -h           Show this help message

Environment Variables:
  DRY_RUN=false        Apply fixes (default: true for safety)

Examples:
  # Dry run (safe, shows what would change):
  node backend/scripts/fix-patient-roles.js

  # Apply fixes:
  DRY_RUN=false node backend/scripts/fix-patient-roles.js

  # Run diagnostics:
  node backend/scripts/fix-patient-roles.js --diagnostics
    `);
  } else {
    await fixPatientRoles();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { fixPatientRoles, runDiagnostics };
