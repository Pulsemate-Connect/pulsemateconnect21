#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Cleanup Abandoned DRAFT Registrations
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script deletes clinic owner accounts that:
 * - Have status: DRAFT
 * - Have registrationComplete: false
 * - Were created more than X days ago (default: 3 days)
 * 
 * These are users who started registration (verified email/mobile)
 * but never completed the full application submission.
 * 
 * Usage:
 *   node backend/scripts/cleanup-draft-registrations.js [options]
 * 
 * Options:
 *   --days <number>    Days to wait before cleanup (default: 3)
 *   --dry-run          Show what would be deleted without actually deleting
 *   --force            Skip confirmation prompt
 * 
 * Examples:
 *   node backend/scripts/cleanup-draft-registrations.js --dry-run
 *   node backend/scripts/cleanup-draft-registrations.js --days 7
 *   node backend/scripts/cleanup-draft-registrations.js --force
 * 
 * Schedule as a cron job:
 *   0 2 * * * node /path/to/backend/scripts/cleanup-draft-registrations.js --force
 *   (Runs daily at 2 AM)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const daysArg = args.find(arg => arg.startsWith('--days='));
const daysToWait = daysArg ? parseInt(daysArg.split('=')[1]) : 3;
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '═'.repeat(70));
  log(title, 'cyan');
  console.log('═'.repeat(70));
}

async function promptConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanupDraftRegistrations() {
  try {
    logSection('🧹 Cleanup Abandoned DRAFT Registrations');
    
    log(`⚙️  Configuration:`, 'blue');
    log(`   - Days to wait: ${daysToWait} days`);
    log(`   - Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
    log(`   - Force: ${isForce ? 'Yes (no prompt)' : 'No (will prompt)'}\n`);

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - daysToWait * 24 * 60 * 60 * 1000);
    log(`📅 Cutoff Date: ${cutoffDate.toLocaleString()}`, 'yellow');
    log(`   (Accounts created before this date will be deleted)\n`);

    // Find abandoned DRAFT accounts
    const abandonedAccounts = await prisma.user.findMany({
      where: {
        role: 'CLINIC_OWNER',
        approvalStatus: 'DRAFT',
        registrationComplete: false,
        createdAt: { lt: cutoffDate },
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
        registrationStartedAt: true,
        clinicOnboardingData: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (abandonedAccounts.length === 0) {
      log('✅ No abandoned DRAFT accounts found!', 'green');
      log('   Database is clean. Nothing to do.\n');
      return;
    }

    logSection(`📊 Found ${abandonedAccounts.length} Abandoned Account(s)`);
    
    // Display details of accounts to be deleted
    abandonedAccounts.forEach((account, index) => {
      const daysSinceCreation = Math.floor((Date.now() - account.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      const hasOnboardingData = account.clinicOnboardingData && Object.keys(account.clinicOnboardingData).length > 0;
      
      console.log(`\n${index + 1}. ${colors.bright}${account.name || 'Unknown'}${colors.reset}`);
      log(`   📧 Email: ${account.email || 'N/A'}`);
      log(`   📱 Mobile: ${account.mobile || 'N/A'}`);
      log(`   🔑 User ID: ${account.id}`);
      log(`   📅 Created: ${account.createdAt.toLocaleString()} (${daysSinceCreation} days ago)`);
      log(`   📋 Has Data: ${hasOnboardingData ? 'Yes (partial)' : 'No (just verified email/mobile)'}`);
    });

    console.log('\n' + '─'.repeat(70));
    log(`\n⚠️  Total accounts to be deleted: ${abandonedAccounts.length}`, 'yellow');

    // Confirmation prompt (unless --force or --dry-run)
    if (!isDryRun && !isForce) {
      console.log('');
      const confirmed = await promptConfirmation(
        `${colors.red}Are you sure you want to DELETE these accounts? (y/N): ${colors.reset}`
      );
      
      if (!confirmed) {
        log('\n❌ Operation cancelled by user.', 'red');
        return;
      }
    }

    if (isDryRun) {
      log('\n🔍 DRY RUN MODE: No changes will be made', 'yellow');
      log('   Run without --dry-run to actually delete these accounts.\n');
      return;
    }

    // Perform deletion
    logSection('🗑️  Deleting Abandoned Accounts...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const account of abandonedAccounts) {
      try {
        log(`\n🔄 Deleting: ${account.name || 'Unknown'} (${account.email || account.mobile})`, 'yellow');
        
        // Delete related records first
        await prisma.$transaction(async (tx) => {
          // 1. Delete refresh tokens
          const refreshTokensDeleted = await tx.refreshToken.deleteMany({
            where: { userId: account.id },
          });
          log(`   ✓ Deleted ${refreshTokensDeleted.count} refresh tokens`);
          
          // 2. Delete sessions
          const sessionsDeleted = await tx.session.deleteMany({
            where: { userId: account.id },
          });
          log(`   ✓ Deleted ${sessionsDeleted.count} sessions`);
          
          // 3. Delete audit logs
          const auditLogsDeleted = await tx.auditLog.deleteMany({
            where: { userId: account.id },
          });
          log(`   ✓ Deleted ${auditLogsDeleted.count} audit logs`);
          
          // 4. Delete firebase phone verifications
          if (account.mobile) {
            const firebaseVerificationsDeleted = await tx.firebasePhoneVerification.deleteMany({
              where: { mobile: account.mobile },
            });
            log(`   ✓ Deleted ${firebaseVerificationsDeleted.count} firebase verifications`);
          }
          
          // 5. Delete email verifications
          if (account.email) {
            const emailVerificationsDeleted = await tx.emailVerification.deleteMany({
              where: { email: account.email },
            });
            log(`   ✓ Deleted ${emailVerificationsDeleted.count} email verifications`);
          }
          
          // 6. Delete clinic owner profile (if exists)
          const clinicOwnerProfileDeleted = await tx.clinicOwnerProfile.deleteMany({
            where: { userId: account.id },
          });
          log(`   ✓ Deleted ${clinicOwnerProfileDeleted.count} clinic owner profiles`);
          
          // 7. Finally, delete the user
          await tx.user.delete({
            where: { id: account.id },
          });
          log(`   ✓ Deleted user account`, 'green');
        });
        
        successCount++;
        log(`✅ Successfully deleted account ${successCount}/${abandonedAccounts.length}`, 'green');
      } catch (error) {
        errorCount++;
        log(`❌ Error deleting account: ${error.message}`, 'red');
        console.error(error);
      }
    }

    // Summary
    logSection('📊 Cleanup Summary');
    log(`✅ Successfully deleted: ${successCount} account(s)`, 'green');
    if (errorCount > 0) {
      log(`❌ Errors: ${errorCount} account(s)`, 'red');
    }
    log(`📊 Total processed: ${abandonedAccounts.length} account(s)\n`);

    // Final verification
    const remainingDrafts = await prisma.user.count({
      where: {
        role: 'CLINIC_OWNER',
        approvalStatus: 'DRAFT',
        registrationComplete: false,
      },
    });
    
    log(`📈 Remaining DRAFT accounts: ${remainingDrafts}`, 'blue');
    if (remainingDrafts > 0) {
      log(`   (These were created within the last ${daysToWait} days)\n`);
    } else {
      log(`   ✨ All abandoned DRAFT accounts cleaned up!\n`, 'green');
    }

  } catch (error) {
    log(`\n❌ Fatal error during cleanup:`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDraftRegistrations()
  .then(() => {
    log('✅ Cleanup script completed successfully!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log('❌ Cleanup script failed!', 'red');
    console.error(error);
    process.exit(1);
  });
