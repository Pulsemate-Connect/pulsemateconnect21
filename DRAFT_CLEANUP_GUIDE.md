# 🧹 DRAFT Account Cleanup Guide

## Overview

This guide explains how to clean up abandoned DRAFT clinic owner registrations and set up automated cleanup.

---

## What are DRAFT Accounts?

**DRAFT accounts** are clinic owner registrations that were started but never completed:
- User verified their email
- User verified their mobile number
- **But**: User never completed the full registration (Steps 2-6)
- **Status**: `DRAFT` with `registrationComplete = false`

These accounts should be cleaned up periodically to keep the database tidy.

---

## Manual Cleanup

### Run Once (Manual)

```bash
# Navigate to backend directory
cd backend

# Dry run (see what would be deleted without actually deleting)
node scripts/cleanup-draft-registrations.js --dry-run

# Delete accounts older than 3 days (default)
node scripts/cleanup-draft-registrations.js

# Delete accounts older than 7 days
node scripts/cleanup-draft-registrations.js --days=7

# Delete without confirmation prompt (use in scripts)
node scripts/cleanup-draft-registrations.js --force
```

### Script Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Show what would be deleted without deleting | `--dry-run` |
| `--days=<number>` | Days to wait before cleanup (default: 3) | `--days=7` |
| `--force` | Skip confirmation prompt | `--force` |

---

## Automated Cleanup (Recommended)

### Option 1: Windows Task Scheduler

1. **Create a batch file** (`cleanup-drafts.bat`):
```batch
@echo off
cd C:\Users\shubh\Desktop\PulseMate Connect 51\backend
node scripts/cleanup-draft-registrations.js --force > logs/cleanup.log 2>&1
```

2. **Open Task Scheduler**:
   - Press `Win + R` → type `taskschd.msc` → Enter

3. **Create Basic Task**:
   - Name: "Cleanup DRAFT Registrations"
   - Trigger: Daily at 2:00 AM
   - Action: Start a program
   - Program: `C:\path\to\cleanup-drafts.bat`

4. **Configure**:
   - Run whether user is logged on or not
   - Run with highest privileges

### Option 2: Node.js Cron Job (Cross-platform)

Install `node-cron`:
```bash
npm install node-cron
```

Create `backend/jobs/cleanup-scheduler.js`:
```javascript
const cron = require('node-cron');
const { exec } = require('child_process');

// Run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running DRAFT cleanup job...');
  
  exec('node scripts/cleanup-draft-registrations.js --force', (error, stdout, stderr) => {
    if (error) {
      console.error(`Cleanup error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Cleanup stderr: ${stderr}`);
      return;
    }
    console.log(`Cleanup output: ${stdout}`);
  });
});

console.log('Cleanup scheduler started. Will run daily at 2:00 AM');
```

Run the scheduler:
```bash
node backend/jobs/cleanup-scheduler.js
```

### Option 3: Heroku/Render Scheduler

#### Heroku:
Add to `Procfile`:
```
worker: node backend/jobs/cleanup-scheduler.js
```

Or use Heroku Scheduler add-on:
```bash
heroku addons:create scheduler:standard
heroku addons:open scheduler
```

Add job: `node backend/scripts/cleanup-draft-registrations.js --force`

#### Render:
Add cron job in `render.yaml`:
```yaml
services:
  - type: cron
    name: draft-cleanup
    env: docker
    schedule: "0 2 * * *"
    buildCommand: npm install
    startCommand: node backend/scripts/cleanup-draft-registrations.js --force
```

---

## What Gets Deleted?

When a DRAFT account is deleted, the script removes:

1. ✅ User account record
2. ✅ Refresh tokens
3. ✅ Sessions
4. ✅ Audit logs
5. ✅ Firebase phone verifications
6. ✅ Email verifications
7. ✅ Clinic owner profile (if exists)

### What is NOT deleted:

- ❌ PENDING accounts (submitted applications)
- ❌ VERIFIED accounts (approved)
- ❌ Accounts created within the last X days

---

## Monitoring & Logs

### Check Cleanup Logs

```bash
# View recent cleanup logs (if using batch file)
type backend\logs\cleanup.log

# Or run with output
node scripts/cleanup-draft-registrations.js --dry-run
```

### Check DRAFT Account Count

```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as draft_count
FROM users
WHERE 
  role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT'
  AND "registrationComplete" = false;

-- See which ones will be deleted
SELECT 
  id,
  name,
  email,
  mobile,
  "createdAt",
  DATE_PART('day', NOW() - "createdAt") as days_old
FROM users
WHERE 
  role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT'
  AND "registrationComplete" = false
  AND "createdAt" < (NOW() - INTERVAL '3 days')
ORDER BY "createdAt" ASC;
```

---

## Configuration

### Change Cleanup Period

Default is **3 days**. To change:

```bash
# 7 days
node scripts/cleanup-draft-registrations.js --days=7

# 1 day (aggressive)
node scripts/cleanup-draft-registrations.js --days=1

# 14 days (lenient)
node scripts/cleanup-draft-registrations.js --days=14
```

### Recommended Settings

| Environment | Days | Reason |
|-------------|------|--------|
| **Production** | 3-7 days | Balance between cleanup and user convenience |
| **Staging** | 1-2 days | Aggressive cleanup for testing |
| **Development** | 7-14 days | Lenient for developer testing |

---

## Troubleshooting

### Script Fails to Run

**Error**: `Cannot find module '@prisma/client'`
```bash
cd backend
npm install
npx prisma generate
```

**Error**: `Permission denied`
```bash
# Linux/Mac: Add execute permission
chmod +x scripts/cleanup-draft-registrations.js

# Windows: Run as administrator
```

### No Accounts Deleted

This is normal if:
- All DRAFT accounts were created within the last X days
- All incomplete registrations have already been cleaned up
- Users are completing their registrations promptly

### Accidentally Deleted Wrong Accounts

**Prevention**:
- Always run with `--dry-run` first
- Review the list before confirming
- Keep database backups

**Recovery**:
- Restore from database backup
- Contact users to re-register

---

## Best Practices

1. **Always test with --dry-run first**
   ```bash
   node scripts/cleanup-draft-registrations.js --dry-run
   ```

2. **Keep database backups**
   - Automated daily backups (Supabase/Neon handle this)
   - Manual backup before bulk deletions

3. **Monitor cleanup logs**
   - Check for errors
   - Track deletion trends
   - Adjust cleanup period if needed

4. **Notify users before deletion** (Optional)
   - Send reminder email at 2 days
   - Final warning email at 3 days
   - Then delete at 4 days

5. **Run regularly**
   - Daily at low-traffic time (2 AM)
   - Weekly if traffic is low
   - After major registration campaigns

---

## Statistics & Analytics

### Useful Queries

```sql
-- Registration completion rate
SELECT 
  COUNT(CASE WHEN "registrationComplete" = true THEN 1 END) as completed,
  COUNT(CASE WHEN "registrationComplete" = false THEN 1 END) as incomplete,
  ROUND(
    100.0 * COUNT(CASE WHEN "registrationComplete" = true THEN 1 END) / COUNT(*),
    2
  ) as completion_rate_percent
FROM users
WHERE role = 'CLINIC_OWNER'
  AND "createdAt" > (NOW() - INTERVAL '30 days');

-- Average time to complete registration
SELECT 
  AVG(DATE_PART('hour', "registrationCompletedAt" - "registrationStartedAt")) as avg_hours
FROM users
WHERE 
  role = 'CLINIC_OWNER'
  AND "registrationComplete" = true
  AND "registrationCompletedAt" IS NOT NULL
  AND "registrationStartedAt" IS NOT NULL;

-- Most common drop-off points (check clinicOnboardingData)
SELECT 
  "clinicOnboardingData" ->> 'currentStep' as last_step,
  COUNT(*) as count
FROM users
WHERE 
  role = 'CLINIC_OWNER'
  AND "approvalStatus" = 'DRAFT'
  AND "registrationComplete" = false
GROUP BY last_step
ORDER BY count DESC;
```

---

## Support

If you encounter issues:
1. Check the logs
2. Run with `--dry-run` to diagnose
3. Review the troubleshooting section
4. Contact dev team with error details

---

**Last Updated**: September 6, 2026
**Script Version**: 1.0.0
