#!/usr/bin/env node

/**
 * Generate Test Data Script
 * Generates 20 clinics + 500 doctors test data
 */

const path = require('path');
const ClinicGenerator = require('../data/generators/clinicGenerator');
const DoctorGenerator = require('../data/generators/doctorGenerator');

console.log('\n═══════════════════════════════════════════════════════');
console.log('PULSEMATE CONNECT - QA TEST DATA GENERATION');
console.log('═══════════════════════════════════════════════════════\n');

// Generate Clinics
console.log('Step 1: Generating Clinic Data...');
console.log('───────────────────────────────────────────────────────');
const clinicGenerator = new ClinicGenerator();
const clinics = clinicGenerator.generate();
console.log(`✓ Generated ${clinics.length} unique clinics\n`);

// Save clinics
const clinicsPath = path.join(__dirname, '../data/fixtures/clinics.json');
clinicGenerator.saveToFile(clinicsPath);

// Generate Doctors
console.log('\nStep 2: Generating Doctor Data...');
console.log('───────────────────────────────────────────────────────');
const doctorGenerator = new DoctorGenerator();
const doctors = doctorGenerator.generate();
console.log(`✓ Generated ${doctors.length} unique doctors (25 per clinic)\n`);

// Save doctors
const doctorsPath = path.join(__dirname, '../data/fixtures/doctors.json');
doctorGenerator.saveToFile(doctorsPath);

// Show statistics
console.log('\nStep 3: Data Statistics');
console.log('───────────────────────────────────────────────────────');
console.log(`Total Clinics:  ${clinics.length}`);
console.log(`Total Doctors:  ${doctors.length}`);
console.log(`Doctors/Clinic: ${doctors.length / clinics.length}`);

const doctorStats = doctorGenerator.getStats();
console.log(`\nDoctor Statistics:`);
console.log(`  Average Experience: ${doctorStats.avgExperience} years`);
console.log(`  Average Fee: ₹${doctorStats.avgConsultationFee}`);
console.log(`\n  By Specialization:`);
Object.entries(doctorStats.bySpecialization).slice(0, 5).forEach(([spec, count]) => {
  console.log(`    ${spec}: ${count} doctors`);
});
console.log(`\n  By Medical System:`);
Object.entries(doctorStats.byMedicalSystem).forEach(([system, count]) => {
  console.log(`    ${system}: ${count} doctors`);
});

// Sample data
console.log('\n\nStep 4: Sample Test Data');
console.log('───────────────────────────────────────────────────────');
console.log('\nClinics (first 3):');
clinics.slice(0, 3).forEach(clinic => {
  console.log(`\n  ${clinic.testId}: ${clinic.name}`);
  console.log(`    Email:  ${clinic.email}`);
  console.log(`    Mobile: ${clinic.mobile}`);
  console.log(`    Owner:  ${clinic.ownerName}`);
  console.log(`    City:   ${clinic.city}, ${clinic.state}`);
});

console.log('\n\nDoctors (CLINIC-001, first 3):');
const clinic001Doctors = doctorGenerator.getByClinicTestId('CLINIC-001').slice(0, 3);
clinic001Doctors.forEach(doctor => {
  console.log(`\n  ${doctor.testId}: ${doctor.fullLegalName}`);
  console.log(`    Email:          ${doctor.email}`);
  console.log(`    Mobile:         ${doctor.mobile}`);
  console.log(`    Specialization: ${doctor.specialization}`);
  console.log(`    Experience:     ${doctor.experienceYears} years`);
  console.log(`    Registration:   ${doctor.medicalRegistrationNumber}`);
  console.log(`    Fee:            ₹${doctor.consultationFee}`);
});

console.log('\n\n═══════════════════════════════════════════════════════');
console.log('✓ TEST DATA GENERATION COMPLETE');
console.log('═══════════════════════════════════════════════════════');
console.log(`\nData saved to:`);
console.log(`  - ${clinicsPath}`);
console.log(`  - ${doctorsPath}`);
console.log(`\nNext steps:`);
console.log(`  1. Run smoke test:       npm run test:qa-smoke`);
console.log(`  2. Run full regression:  npm run test:qa-full`);
console.log(`  3. Generate report:      npm run test:report`);
console.log('\n');

process.exit(0);
