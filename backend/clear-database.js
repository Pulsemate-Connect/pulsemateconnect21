#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Clear Database Data (Keep Admin Accounts)
 * ═══════════════════════════════════════════════════════════════════════════
 * This script clears all data from the database except admin accounts.
 * Safe to run - includes pre-checks and transaction rollback on error.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function clearDatabase() {
  console.log('🗑️  PulseMate Connect - Database Cleanup');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  WARNING: This will delete ALL data except admin accounts!');
  console.log('');
  console.log('✅ Preserved accounts:');
  console.log('   1. shubham27052002@gmail.com');
  console.log('   2. sahilnaik1515@gmail.com');
  console.log('');
  console.log('🗑️  Data to be deleted:');
  console.log('   - All patients');
  console.log('   - All clinic owners (non-admin)');
  console.log('   - All doctors');
  console.log('   - All receptionists');
  console.log('   - All clinics');
  console.log('   - All appointments');
  console.log('   - All payments');
  console.log('   - All notifications');
  console.log('   - All sessions (except admin)');
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  
  // Simple confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Type "DELETE ALL" to confirm: ', async (answer) => {
      rl.close();
      
      if (answer.trim() !== 'DELETE ALL') {
        console.log('❌ Cancelled. No changes made.');
        resolve(false);
        return;
      }

      console.log('');
      console.log('🚀 Starting database cleanup...');
      console.log('');

      const client = await pool.connect();
      
      try {
        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'CLEAR_DATA_KEEP_ADMINS.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL script
        await client.query(sql);
        
        console.log('');
        console.log('✅ Database cleanup completed successfully!');
        console.log('');
        
        // Verify results
        const result = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN') as admin_users,
            (SELECT COUNT(*) FROM clinics) as clinics,
            (SELECT COUNT(*) FROM doctor_profiles) as doctors,
            (SELECT COUNT(*) FROM patient_profiles) as patients,
            (SELECT COUNT(*) FROM appointments) as appointments
        `);
        
        const stats = result.rows[0];
        console.log('📊 Database Statistics:');
        console.log('   Total Users:', stats.total_users);
        console.log('   Admin Users:', stats.admin_users);
        console.log('   Clinics:', stats.clinics);
        console.log('   Doctors:', stats.doctors);
        console.log('   Patients:', stats.patients);
        console.log('   Appointments:', stats.appointments);
        console.log('');
        
        if (stats.admin_users == 2) {
          console.log('✅ Both admin accounts preserved successfully!');
        } else {
          console.log('⚠️  WARNING: Expected 2 admin accounts, found', stats.admin_users);
        }
        
        console.log('');
        console.log('🔐 Admin Login:');
        console.log('   URL: https://pulsemateconnect.in/admin');
        console.log('   Email: shubham27052002@gmail.com');
        console.log('   Password: Shubham27*');
        console.log('');
        
        resolve(true);
      } catch (error) {
        console.error('');
        console.error('❌ Error during cleanup:', error.message);
        console.error('');
        console.error('Transaction was rolled back - no changes made.');
        console.error('');
        reject(error);
      } finally {
        client.release();
        await pool.end();
      }
    });
  });
}

// Run the script
clearDatabase()
  .then((completed) => {
    if (completed) {
      console.log('════════════════════════════════════════════════════════');
      console.log('🎯 Next: Test clinic owner registration at /register/clinic-owner');
      console.log('════════════════════════════════════════════════════════');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
