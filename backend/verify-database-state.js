#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Database State Verification Script
 * ═══════════════════════════════════════════════════════════════════════════
 * Use this to check the database state before and after cleanup
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyDatabaseState() {
  console.log('');
  console.log('🔍 PulseMate Connect - Database State Verification');
  console.log('════════════════════════════════════════════════════════');
  console.log('');

  const client = await pool.connect();
  
  try {
    // Check admin accounts
    const adminsResult = await client.query(`
      SELECT 
        email,
        name,
        role,
        mobile,
        "isActive",
        "isEmailVerified",
        "isPhoneVerified",
        "approvalStatus"
      FROM users 
      WHERE role = 'SUPER_ADMIN'
      ORDER BY email
    `);

    console.log('👤 Admin Accounts (should be 2):');
    console.log('─────────────────────────────────────────────────────');
    if (adminsResult.rows.length === 0) {
      console.log('   ❌ NO ADMIN ACCOUNTS FOUND!');
    } else {
      adminsResult.rows.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.email}`);
        console.log(`      Name: ${admin.name}`);
        console.log(`      Mobile: ${admin.mobile || 'Not set'}`);
        console.log(`      Role: ${admin.role}`);
        console.log(`      Active: ${admin.isActive ? '✅' : '❌'}`);
        console.log(`      Email Verified: ${admin.isEmailVerified ? '✅' : '❌'}`);
        console.log(`      Phone Verified: ${admin.isPhoneVerified ? '✅' : '❌'}`);
        console.log(`      Status: ${admin.approvalStatus}`);
        console.log('');
      });
    }

    // Check all users by role
    const usersByRoleResult = await client.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN "isActive" = true THEN 1 END) as active,
        COUNT(CASE WHEN "approvalStatus" = 'VERIFIED' THEN 1 END) as verified
      FROM users
      GROUP BY role
      ORDER BY 
        CASE role
          WHEN 'SUPER_ADMIN' THEN 1
          WHEN 'CLINIC_OWNER' THEN 2
          WHEN 'DOCTOR' THEN 3
          WHEN 'RECEPTIONIST' THEN 4
          WHEN 'PATIENT' THEN 5
          ELSE 6
        END
    `);

    console.log('📊 Users by Role:');
    console.log('─────────────────────────────────────────────────────');
    if (usersByRoleResult.rows.length === 0) {
      console.log('   ❌ NO USERS FOUND!');
    } else {
      usersByRoleResult.rows.forEach(row => {
        console.log(`   ${row.role.padEnd(15)} Total: ${row.count}  Active: ${row.active}  Verified: ${row.verified}`);
      });
    }
    console.log('');

    // Check key tables
    const tablesResult = await client.query(`
      SELECT 
        'users' AS table_name, COUNT(*) AS count FROM users
      UNION ALL
      SELECT 'clinics', COUNT(*) FROM clinics
      UNION ALL
      SELECT 'doctor_profiles', COUNT(*) FROM doctor_profiles
      UNION ALL
      SELECT 'patient_profiles', COUNT(*) FROM patient_profiles
      UNION ALL
      SELECT 'receptionist_profiles', COUNT(*) FROM receptionist_profiles
      UNION ALL
      SELECT 'appointments', COUNT(*) FROM appointments
      UNION ALL
      SELECT 'payments', COUNT(*) FROM payments
      UNION ALL
      SELECT 'notifications', COUNT(*) FROM notifications
      UNION ALL
      SELECT 'sessions', COUNT(*) FROM sessions
      UNION ALL
      SELECT 'audit_logs', COUNT(*) FROM audit_logs
      ORDER BY table_name
    `);

    console.log('📈 Database Table Counts:');
    console.log('─────────────────────────────────────────────────────');
    tablesResult.rows.forEach(row => {
      const icon = row.count > 0 ? '✅' : '⚪';
      console.log(`   ${icon} ${row.table_name.padEnd(25)} ${row.count}`);
    });
    console.log('');

    // Check recent registrations (last 10)
    const recentUsersResult = await client.query(`
      SELECT 
        email,
        name,
        role,
        mobile,
        "createdAt",
        "approvalStatus"
      FROM users
      WHERE role != 'SUPER_ADMIN'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    if (recentUsersResult.rows.length > 0) {
      console.log('🆕 Recent Registrations (Last 10):');
      console.log('─────────────────────────────────────────────────────');
      recentUsersResult.rows.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.role})`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Mobile: ${user.mobile || 'Not set'}`);
        console.log(`      Status: ${user.approvalStatus}`);
        console.log(`      Created: ${new Date(user.createdAt).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('🆕 Recent Registrations:');
      console.log('─────────────────────────────────────────────────────');
      console.log('   No recent registrations found (only admins exist)');
      console.log('');
    }

    // Summary
    const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
    const totalAdmins = await client.query('SELECT COUNT(*) as count FROM users WHERE role = \'SUPER_ADMIN\'');
    
    console.log('════════════════════════════════════════════════════════');
    console.log('📋 Summary:');
    console.log('   Total Users: ' + totalUsers.rows[0].count);
    console.log('   Admin Users: ' + totalAdmins.rows[0].count);
    console.log('');
    
    if (totalUsers.rows[0].count == 2 && totalAdmins.rows[0].count == 2) {
      console.log('   ✅ Database is CLEAN (only 2 admin accounts)');
    } else if (totalAdmins.rows[0].count == 2) {
      console.log('   ℹ️  Database has data (admins + ' + (totalUsers.rows[0].count - 2) + ' other users)');
    } else {
      console.log('   ⚠️  WARNING: Expected 2 admin accounts, found ' + totalAdmins.rows[0].count);
    }
    console.log('════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
verifyDatabaseState()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
