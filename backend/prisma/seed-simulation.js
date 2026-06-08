/**
 * seed-simulation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PulseMate Full Simulation Seed — 60 Virtual Users
 *
 * Creates:
 *   50 patients  (10 per age group × 5 cities × realistic health conditions)
 *    5 doctors   (Physiotherapist, Orthopedic, GP, Neurologist, Pain Specialist)
 *    2 receptionists
 *    2 clinic owners  + 2 clinics  (Belagavi + Hubli)
 *    1 super admin
 *    DoctorAvailability rows  (Mon-Sat schedule for every doctor)
 *    Today's live queue        (10 patients booked)
 *    1 free appointment        (Scenario 1 pre-seeded)
 *    1 paid appointment        (Scenario 2 pre-seeded)
 *
 * Run:
 *   cd backend && node prisma/seed-simulation.js
 *
 * Does NOT wipe existing data — skips users that already exist by mobile.
 * Safe to re-run on a fresh DB.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Passwords ─────────────────────────────────────────────────────────────────
const PATIENT_PASS = 'Patient@123';
const STAFF_PASS = 'Staff@123';
const ADMIN_PASS = 'Admin@123';

// ── Helper: upsert user by mobile ─────────────────────────────────────────────
async function upsertUser(data, profileRelation = {}) {
  const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
  if (existing) return existing;
  return prisma.user.create({ data: { ...data, ...profileRelation } });
}

// ── Helper: upsert DoctorAvailability row ─────────────────────────────────────
async function seedAvailability(doctorId, clinicId, days, start, end, slot = 20) {
  for (const dow of days) {
    const exists = await prisma.doctorAvailability.findUnique({
      where: { doctorId_clinicId_dayOfWeek: { doctorId, clinicId, dayOfWeek: dow } },
    });
    if (!exists) {
      await prisma.doctorAvailability.create({
        data: { doctorId, clinicId, dayOfWeek: dow, startTime: start, endTime: end, slotDurationMin: slot, maxPatients: 20, isActive: true },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT DATA  (50 patients — 10 per age group)
// ─────────────────────────────────────────────────────────────────────────────
const PATIENTS = [
  // ── 18–25 (10) ───────────────────────────────────────────────────────────
  { name: 'Aditi Naik', mobile: '+917501000001', email: 'aditi.naik@sim.pm', age: 20, gender: 'FEMALE', city: 'Belagavi', bloodGroup: 'A+', condition: 'Sports Injury', dob: '2006-03-12' },
  { name: 'Rohan Patil', mobile: '+917501000002', email: 'rohan.patil@sim.pm', age: 22, gender: 'MALE', city: 'Karwar', bloodGroup: 'O+', condition: 'Back Pain', dob: '2004-07-19' },
  { name: 'Sneha Kulkarni', mobile: '+917501000003', email: 'sneha.kulkarni@sim.pm', age: 19, gender: 'FEMALE', city: 'Hubli', bloodGroup: 'B+', condition: 'Neck Pain', dob: '2007-01-05' },
  { name: 'Aryan Shetty', mobile: '+917501000004', email: 'aryan.shetty@sim.pm', age: 24, gender: 'MALE', city: 'Dharwad', bloodGroup: 'AB+', condition: 'Shoulder Pain', dob: '2002-11-22' },
  { name: 'Kavya Gawas', mobile: '+917501000005', email: 'kavya.gawas@sim.pm', age: 18, gender: 'FEMALE', city: 'Goa', bloodGroup: 'O-', condition: 'Sports Injury', dob: '2008-05-30' },
  { name: 'Nikhil Hegde', mobile: '+917501000006', email: 'nikhil.hegde@sim.pm', age: 21, gender: 'MALE', city: 'Belagavi', bloodGroup: 'A-', condition: 'General Consultation', dob: '2005-09-14' },
  { name: 'Pooja Gaonkar', mobile: '+917501000007', email: 'pooja.gaonkar@sim.pm', age: 23, gender: 'FEMALE', city: 'Karwar', bloodGroup: 'B-', condition: 'Knee Pain', dob: '2003-02-28' },
  { name: 'Dev Sawant', mobile: '+917501000008', email: 'dev.sawant@sim.pm', age: 25, gender: 'OTHER', city: 'Hubli', bloodGroup: 'AB-', condition: 'Back Pain', dob: '2001-06-10' },
  { name: 'Ishaan Desai', mobile: '+917501000009', email: 'ishaan.desai@sim.pm', age: 20, gender: 'MALE', city: 'Dharwad', bloodGroup: 'O+', condition: 'Sciatica', dob: '2006-12-03' },
  { name: 'Riya Fernandes', mobile: '+917501000010', email: 'riya.fernandes@sim.pm', age: 22, gender: 'FEMALE', city: 'Goa', bloodGroup: 'A+', condition: 'Sports Injury', dob: '2004-04-17' },

  // ── 26–35 (10) ───────────────────────────────────────────────────────────
  { name: 'Suresh Naik', mobile: '+917501000011', email: 'suresh.naik@sim.pm', age: 28, gender: 'MALE', city: 'Belagavi', bloodGroup: 'B+', condition: 'Back Pain', dob: '1998-08-21' },
  { name: 'Priya Kulkarni', mobile: '+917501000012', email: 'priya.kulkarni@sim.pm', age: 30, gender: 'FEMALE', city: 'Karwar', bloodGroup: 'O+', condition: 'Neck Pain', dob: '1996-03-05' },
  { name: 'Arun Patil', mobile: '+917501000013', email: 'arun.patil@sim.pm', age: 32, gender: 'MALE', city: 'Hubli', bloodGroup: 'A-', condition: 'Shoulder Pain', dob: '1994-10-18' },
  { name: 'Meghana Shetty', mobile: '+917501000014', email: 'meghana.shetty@sim.pm', age: 27, gender: 'FEMALE', city: 'Dharwad', bloodGroup: 'AB+', condition: 'Sciatica', dob: '1999-01-29' },
  { name: 'Kiran Dessai', mobile: '+917501000015', email: 'kiran.dessai@sim.pm', age: 35, gender: 'MALE', city: 'Goa', bloodGroup: 'O-', condition: 'Knee Pain', dob: '1991-06-07' },
  { name: 'Shruti Joshi', mobile: '+917501000016', email: 'shruti.joshi@sim.pm', age: 29, gender: 'FEMALE', city: 'Belagavi', bloodGroup: 'B-', condition: 'Sports Injury', dob: '1997-11-14' },
  { name: 'Vikram Gaikwad', mobile: '+917501000017', email: 'vikram.gaikwad@sim.pm', age: 33, gender: 'MALE', city: 'Karwar', bloodGroup: 'A+', condition: 'Arthritis', dob: '1993-04-02' },
  { name: 'Ankita Borkar', mobile: '+917501000018', email: 'ankita.borkar@sim.pm', age: 26, gender: 'FEMALE', city: 'Hubli', bloodGroup: 'AB-', condition: 'General Consultation', dob: '2000-07-25' },
  { name: 'Rahul Sathe', mobile: '+917501000019', email: 'rahul.sathe@sim.pm', age: 31, gender: 'MALE', city: 'Dharwad', bloodGroup: 'O+', condition: 'Back Pain', dob: '1995-09-08' },
  { name: 'Nisha Vernekar', mobile: '+917501000020', email: 'nisha.vernekar@sim.pm', age: 34, gender: 'FEMALE', city: 'Goa', bloodGroup: 'B+', condition: 'Neck Pain', dob: '1992-12-31' },

  // ── 36–45 (10) ───────────────────────────────────────────────────────────
  { name: 'Deepak Kamble', mobile: '+917501000021', email: 'deepak.kamble@sim.pm', age: 38, gender: 'MALE', city: 'Belagavi', bloodGroup: 'A+', condition: 'Arthritis', dob: '1988-02-14' },
  { name: 'Sunita Nayak', mobile: '+917501000022', email: 'sunita.nayak@sim.pm', age: 42, gender: 'FEMALE', city: 'Karwar', bloodGroup: 'O+', condition: 'Knee Pain', dob: '1984-05-20' },
  { name: 'Mahesh Pawar', mobile: '+917501000023', email: 'mahesh.pawar@sim.pm', age: 40, gender: 'MALE', city: 'Hubli', bloodGroup: 'B+', condition: 'Back Pain', dob: '1986-08-09' },
  { name: 'Rashmi Kale', mobile: '+917501000024', email: 'rashmi.kale@sim.pm', age: 36, gender: 'FEMALE', city: 'Dharwad', bloodGroup: 'AB+', condition: 'Shoulder Pain', dob: '1990-11-27' },
  { name: 'Santosh Kamat', mobile: '+917501000025', email: 'santosh.kamat@sim.pm', age: 44, gender: 'MALE', city: 'Goa', bloodGroup: 'O-', condition: 'Sciatica', dob: '1982-03-16' },
  { name: 'Ashwini Bhosale', mobile: '+917501000026', email: 'ashwini.bhosale@sim.pm', age: 37, gender: 'FEMALE', city: 'Belagavi', bloodGroup: 'A-', condition: 'General Consultation', dob: '1989-06-04' },
  { name: 'Ganesh Poojari', mobile: '+917501000027', email: 'ganesh.poojari@sim.pm', age: 43, gender: 'MALE', city: 'Karwar', bloodGroup: 'B-', condition: 'Arthritis', dob: '1983-09-22' },
  { name: 'Madhuri Chavan', mobile: '+917501000028', email: 'madhuri.chavan@sim.pm', age: 39, gender: 'FEMALE', city: 'Hubli', bloodGroup: 'AB-', condition: 'Knee Pain', dob: '1987-12-11' },
  { name: 'Rajesh Mangalkar', mobile: '+917501000029', email: 'rajesh.mangalkar@sim.pm', age: 41, gender: 'MALE', city: 'Dharwad', bloodGroup: 'O+', condition: 'Back Pain', dob: '1985-01-30' },
  { name: 'Vidya Naik', mobile: '+917501000030', email: 'vidya.naik@sim.pm', age: 45, gender: 'FEMALE', city: 'Goa', bloodGroup: 'A+', condition: 'Neck Pain', dob: '1981-04-08' },

  // ── 46–60 (10) ───────────────────────────────────────────────────────────
  { name: 'Ramesh Kulkarni', mobile: '+917501000031', email: 'ramesh.kulkarni@sim.pm', age: 50, gender: 'MALE', city: 'Belagavi', bloodGroup: 'B+', condition: 'Arthritis', dob: '1976-07-14' },
  { name: 'Lata Patil', mobile: '+917501000032', email: 'lata.patil@sim.pm', age: 55, gender: 'FEMALE', city: 'Karwar', bloodGroup: 'O+', condition: 'Knee Pain', dob: '1971-10-02' },
  { name: 'Shankar Shetty', mobile: '+917501000033', email: 'shankar.shetty@sim.pm', age: 48, gender: 'MALE', city: 'Hubli', bloodGroup: 'A+', condition: 'Sciatica', dob: '1978-02-19' },
  { name: 'Usha Gawas', mobile: '+917501000034', email: 'usha.gawas@sim.pm', age: 58, gender: 'FEMALE', city: 'Dharwad', bloodGroup: 'AB+', condition: 'Back Pain', dob: '1968-05-07' },
  { name: 'Prakash Desai', mobile: '+917501000035', email: 'prakash.desai@sim.pm', age: 52, gender: 'MALE', city: 'Goa', bloodGroup: 'B-', condition: 'General Consultation', dob: '1974-08-25' },
  { name: 'Meena Sawant', mobile: '+917501000036', email: 'meena.sawant@sim.pm', age: 46, gender: 'FEMALE', city: 'Belagavi', bloodGroup: 'O-', condition: 'Shoulder Pain', dob: '1980-11-13' },
  { name: 'Vijay Naik', mobile: '+917501000037', email: 'vijay.naik@sim.pm', age: 54, gender: 'MALE', city: 'Karwar', bloodGroup: 'A-', condition: 'Arthritis', dob: '1972-03-01' },
  { name: 'Savita Hegde', mobile: '+917501000038', email: 'savita.hegde@sim.pm', age: 60, gender: 'FEMALE', city: 'Hubli', bloodGroup: 'AB-', condition: 'Knee Pain', dob: '1966-06-18' },
  { name: 'Anil Bhagat', mobile: '+917501000039', email: 'anil.bhagat@sim.pm', age: 57, gender: 'MALE', city: 'Dharwad', bloodGroup: 'O+', condition: 'Back Pain', dob: '1969-09-06' },
  { name: 'Kamala Joglekar', mobile: '+917501000040', email: 'kamala.joglekar@sim.pm', age: 49, gender: 'FEMALE', city: 'Goa', bloodGroup: 'B+', condition: 'Neck Pain', dob: '1977-12-24' },

  // ── 60+ (10) ─────────────────────────────────────────────────────────────
  { name: 'Narayan Rao', mobile: '+917501000041', email: 'narayan.rao@sim.pm', age: 65, gender: 'MALE', city: 'Belagavi', bloodGroup: 'A+', condition: 'Arthritis', dob: '1961-04-10' },
  { name: 'Sarla Kadam', mobile: '+917501000042', email: 'sarla.kadam@sim.pm', age: 68, gender: 'FEMALE', city: 'Karwar', bloodGroup: 'O+', condition: 'Knee Pain', dob: '1958-07-28' },
  { name: 'Dattatray Joshi', mobile: '+917501000043', email: 'dattatray.joshi@sim.pm', age: 72, gender: 'MALE', city: 'Hubli', bloodGroup: 'B+', condition: 'Back Pain', dob: '1954-01-15' },
  { name: 'Sindhu Kulkarni', mobile: '+917501000044', email: 'sindhu.kulkarni@sim.pm', age: 63, gender: 'FEMALE', city: 'Dharwad', bloodGroup: 'AB+', condition: 'General Consultation', dob: '1963-10-03' },
  { name: 'Govind Shetty', mobile: '+917501000045', email: 'govind.shetty@sim.pm', age: 70, gender: 'MALE', city: 'Goa', bloodGroup: 'O-', condition: 'Sciatica', dob: '1956-03-21' },
  { name: 'Parvati Naik', mobile: '+917501000046', email: 'parvati.naik@sim.pm', age: 66, gender: 'FEMALE', city: 'Belagavi', bloodGroup: 'A-', condition: 'Shoulder Pain', dob: '1960-06-09' },
  { name: 'Anant Pawar', mobile: '+917501000047', email: 'anant.pawar@sim.pm', age: 75, gender: 'MALE', city: 'Karwar', bloodGroup: 'B-', condition: 'Arthritis', dob: '1951-09-27' },
  { name: 'Shanta Borkar', mobile: '+917501000048', email: 'shanta.borkar@sim.pm', age: 62, gender: 'FEMALE', city: 'Hubli', bloodGroup: 'AB-', condition: 'Knee Pain', dob: '1964-12-16' },
  { name: 'Krishnarao Kamat', mobile: '+917501000049', email: 'krishnarao.kamat@sim.pm', age: 69, gender: 'MALE', city: 'Dharwad', bloodGroup: 'O+', condition: 'Back Pain', dob: '1957-02-04' },
  { name: 'Indira Fernandes', mobile: '+917501000050', email: 'indira.fernandes@sim.pm', age: 71, gender: 'FEMALE', city: 'Goa', bloodGroup: 'A+', condition: 'Neck Pain', dob: '1955-05-22' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR DATA (5 specialists)
// ─────────────────────────────────────────────────────────────────────────────
const DOCTORS = [
  {
    name: 'Dr. Pradeep Kulkarni',
    mobile: '+917502000001',
    email: 'pradeep.kulkarni@sim.pm',
    specialization: 'Physiotherapy',
    qualification: 'MPT (Musculoskeletal)',
    education: 'SDM College of Physiotherapy, Dharwad',
    experience: 9,
    fee: 500,
    bio: 'Senior physiotherapist specialising in musculoskeletal rehabilitation, post-surgical recovery, and chronic pain management.',
    regNo: 'SIM-DR-P001',
    languages: ['Kannada', 'Hindi', 'English'],
    online: true, offline: true, avgMins: 25,
    schedule: { days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '17:00', slot: 25 },
  },
  {
    name: 'Dr. Suhas Mahajan',
    mobile: '+917502000002',
    email: 'suhas.mahajan@sim.pm',
    specialization: 'Orthopedics',
    qualification: 'MS (Orthopedics), MRCS',
    education: 'KIMS Hubli',
    experience: 14,
    fee: 700,
    bio: 'Orthopedic surgeon with expertise in joint replacement, sports injuries, and spine disorders.',
    regNo: 'SIM-DR-O002',
    languages: ['Kannada', 'Marathi', 'English'],
    online: false, offline: true, avgMins: 20,
    schedule: { days: [1, 2, 3, 4, 6], start: '10:00', end: '16:00', slot: 20 },
  },
  {
    name: 'Dr. Rekha Nagaraj',
    mobile: '+917502000003',
    email: 'rekha.nagaraj@sim.pm',
    specialization: 'General Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    education: 'JNMC Belagavi',
    experience: 11,
    fee: 400,
    bio: 'General physician providing comprehensive primary care, diabetes management, hypertension, and preventive health check-ups.',
    regNo: 'SIM-DR-G003',
    languages: ['Kannada', 'Hindi', 'English'],
    online: true, offline: true, avgMins: 15,
    schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:30', end: '18:00', slot: 15 },
  },
  {
    name: 'Dr. Anand Gokarn',
    mobile: '+917502000004',
    email: 'anand.gokarn@sim.pm',
    specialization: 'Neurology',
    qualification: 'MD, DM (Neurology)',
    education: 'NIMHANS Bangalore',
    experience: 16,
    fee: 900,
    bio: 'Neurologist specialising in headache, sciatica, nerve compression disorders, and spine neurology.',
    regNo: 'SIM-DR-N004',
    languages: ['Kannada', 'Hindi', 'English'],
    online: true, offline: true, avgMins: 30,
    schedule: { days: [1, 3, 5, 6], start: '11:00', end: '17:00', slot: 30 },
  },
  {
    name: 'Dr. Nalini Wadekar',
    mobile: '+917502000005',
    email: 'nalini.wadekar@sim.pm',
    specialization: 'Pain Management',
    qualification: 'MD (Anaesthesia), Fellowship Pain Medicine',
    education: 'KMC Manipal',
    experience: 12,
    fee: 800,
    bio: 'Pain specialist with expertise in chronic pain, interventional pain procedures, fibromyalgia, and arthritis management.',
    regNo: 'SIM-DR-PM005',
    languages: ['Kannada', 'Konkani', 'English'],
    online: true, offline: true, avgMins: 30,
    schedule: { days: [2, 4, 5, 6], start: '09:30', end: '16:30', slot: 30 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     PulseMate Full Simulation Seed — 60 Virtual Users    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const pwPatient = await bcrypt.hash(PATIENT_PASS, 10);
  const pwStaff = await bcrypt.hash(STAFF_PASS, 10);
  const pwAdmin = await bcrypt.hash(ADMIN_PASS, 10);

  // ── 1. Super Admin ──────────────────────────────────────────────────────────
  console.log('── 1. Super Admin ──────────────────────────────────────────');
  let simAdmin = await prisma.user.findUnique({ where: { mobile: '+917500000001' } });
  if (!simAdmin) {
    simAdmin = await prisma.user.create({
      data: {
        name: 'Sim Root Admin',
        mobile: '+917500000001',
        email: 'simadmin@pulsemate.sim',
        role: 'SUPER_ADMIN',
        approvalStatus: 'VERIFIED',
        passwordHash: pwAdmin,
        isPhoneVerified: true,
        isEmailVerified: true,
        adminProfile: { create: { level: 'ROOT' } },
      },
    });
    console.log(`  ✅ Created: ${simAdmin.name} — simadmin@pulsemate.sim / ${ADMIN_PASS}`);
  } else {
    console.log(`  ⏭  Exists: ${simAdmin.name}`);
  }

  // ── 2. Clinic Owners ────────────────────────────────────────────────────────
  console.log('\n── 2. Clinic Owners ────────────────────────────────────────');
  const ownersData = [
    { name: 'Dr. Basavraj Patil', mobile: '+917500000002', email: 'owner.belagavi@sim.pm', city: 'Belagavi' },
    { name: 'Dr. Shantha Desai', mobile: '+917500000003', email: 'owner.hubli@sim.pm', city: 'Hubli' },
  ];
  const owners = [];
  for (const o of ownersData) {
    let u = await prisma.user.findUnique({ where: { mobile: o.mobile } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: o.name, mobile: o.mobile, email: o.email,
          role: 'CLINIC_OWNER', approvalStatus: 'VERIFIED',
          passwordHash: pwStaff, isPhoneVerified: true, isEmailVerified: true,
        },
      });
      console.log(`  ✅ Created: ${o.name} — ${o.email}`);
    } else {
      console.log(`  ⏭  Exists: ${o.name}`);
    }
    owners.push(u);
  }

  // ── 3. Clinics ───────────────────────────────────────────────────────────────
  console.log('\n── 3. Clinics ──────────────────────────────────────────────');
  const clinicsData = [
    {
      ownerId: owners[0].id,
      name: 'PulseMate Orthopedic & Physio Centre — Belagavi',
      phone: '+917500001001', address: '12 Tilakwadi, Belagavi', city: 'Belagavi',
      state: 'Karnataka', pincode: '590006', latitude: 15.8497, longitude: 74.4977,
      specialties: ['Physiotherapy', 'Orthopedics', 'Pain Management', 'Neurology', 'General Medicine'],
    },
    {
      ownerId: owners[1].id,
      name: 'PulseMate Health Clinic — Hubli',
      phone: '+917500001002', address: '45 Deshpande Nagar, Hubli', city: 'Hubli',
      state: 'Karnataka', pincode: '580029', latitude: 15.3647, longitude: 75.1240,
      specialties: ['Physiotherapy', 'General Medicine', 'Pain Management'],
    },
  ];
  const clinics = [];
  for (const cd of clinicsData) {
    let clinic = await prisma.clinic.findFirst({ where: { ownerId: cd.ownerId } });
    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          ...cd, isVerified: true, approvalStatus: 'VERIFIED', isActive: true,
          openingTime: '08:30', closingTime: '19:00', openingHours: 'Mon-Sat 08:30-19:00',
          consultationModes: ['OFFLINE', 'VIDEO'],
          weeklySchedule: [], facilities: ['Parking', 'AC Waiting Area', 'Wheelchair Access', 'Drinking Water'],
          languagesSpoken: ['Kannada', 'Hindi', 'English'],
          paymentMethods: ['Cash', 'UPI', 'Card'],
          insuranceSupported: [],
          ownerMobileVerified: true, ownerEmailVerified: true,
          mobileOtpVerifiedAt: new Date(), emailVerifiedAt: new Date(),
          clinicLicenseDocument: '/uploads/sim/license.pdf',
          licenseDocumentUrl: '/uploads/sim/license.pdf',
          submittedAt: new Date(), verifiedAt: new Date(),
        },
      });
      await prisma.clinicStaff.create({ data: { clinicId: clinic.id, userId: cd.ownerId, role: 'OWNER' } });
      console.log(`  ✅ Created: ${clinic.name}`);
    } else {
      console.log(`  ⏭  Exists: ${clinic.name}`);
    }
    clinics.push(clinic);
  }
  const primaryClinic = clinics[0]; // Belagavi clinic used for all scenarios

  // ── 4. Doctors ───────────────────────────────────────────────────────────────
  console.log('\n── 4. Doctors (5) ──────────────────────────────────────────');
  const doctorProfiles = [];
  for (const d of DOCTORS) {
    let u = await prisma.user.findUnique({ where: { mobile: d.mobile } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: d.name, mobile: d.mobile, email: d.email,
          role: 'DOCTOR', approvalStatus: 'VERIFIED',
          passwordHash: pwStaff, isPhoneVerified: true, isEmailVerified: true,
          doctorProfile: {
            create: {
              approvalStatus: 'VERIFIED', qualification: d.qualification,
              specialization: d.specialization, experienceYears: d.experience,
              education: d.education, consultationFee: d.fee,
              onlineAvailable: d.online, offlineAvailable: d.offline,
              bio: d.bio, avgConsultationMins: d.avgMins,
              medicalRegistrationNumber: d.regNo,
              languagesKnown: d.languages, marketplaceVisible: true,
            },
          },
        },
        include: { doctorProfile: true },
      });
      console.log(`  ✅ Created: ${d.name} (${d.specialization})`);
    } else {
      u = await prisma.user.findUnique({ where: { mobile: d.mobile }, include: { doctorProfile: true } });
      console.log(`  ⏭  Exists: ${d.name}`);
    }
    doctorProfiles.push(u.doctorProfile);

    // Link doctor to primary clinic
    const dcExists = await prisma.doctorClinic.findUnique({
      where: { doctorId_clinicId: { doctorId: u.doctorProfile.id, clinicId: primaryClinic.id } },
    });
    if (!dcExists) {
      await prisma.doctorClinic.create({
        data: {
          doctorId: u.doctorProfile.id, clinicId: primaryClinic.id,
          inviteStatus: 'ACCEPTED', consultationFee: d.fee,
          availableDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          startTime: d.schedule.start, endTime: d.schedule.end,
          avgConsultationMins: d.schedule.slot, isActive: true, joinedAt: new Date(),
        },
      });
      await prisma.clinicStaff.upsert({
        where: { clinicId_userId: { clinicId: primaryClinic.id, userId: u.id } },
        create: { clinicId: primaryClinic.id, userId: u.id, role: 'DOCTOR' },
        update: { isActive: true },
      });
    }

    // Seed weekly availability (Mon–Sat or custom)
    await seedAvailability(u.doctorProfile.id, primaryClinic.id, d.schedule.days, d.schedule.start, d.schedule.end, d.schedule.slot);
  }
  const [physioDoc, orthoDoc, gpDoc, neuroDoc, painDoc] = doctorProfiles;

  // ── 5. Receptionists ─────────────────────────────────────────────────────────
  console.log('\n── 5. Receptionists (2) ────────────────────────────────────');
  const recepData = [
    { name: 'Mangala Kore', mobile: '+917500000004', email: 'recep.a@sim.pm', suffix: 'A' },
    { name: 'Surekha Patil', mobile: '+917500000005', email: 'recep.b@sim.pm', suffix: 'B' },
  ];
  for (const r of recepData) {
    let u = await prisma.user.findUnique({ where: { mobile: r.mobile } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: r.name, mobile: r.mobile, email: r.email,
          role: 'RECEPTIONIST', approvalStatus: 'VERIFIED',
          passwordHash: pwStaff, isPhoneVerified: true,
          receptionistProfile: {
            create: { assignedClinicId: primaryClinic.id, createdByOwnerId: owners[0].id },
          },
        },
      });
      await prisma.clinicStaff.upsert({
        where: { clinicId_userId: { clinicId: primaryClinic.id, userId: u.id } },
        create: { clinicId: primaryClinic.id, userId: u.id, role: 'RECEPTIONIST' },
        update: { isActive: true },
      });
      console.log(`  ✅ Receptionist ${r.suffix}: ${r.name} — ${r.email}`);
    } else {
      console.log(`  ⏭  Exists: ${r.name}`);
    }
  }

  // ── 6. Patients (50) ─────────────────────────────────────────────────────────
  console.log('\n── 6. Patients (50) ────────────────────────────────────────');
  const patientUsers = [];
  for (const p of PATIENTS) {
    let u = await prisma.user.findUnique({ where: { mobile: p.mobile } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: p.name, mobile: p.mobile, email: p.email,
          role: 'PATIENT', approvalStatus: 'VERIFIED',
          isPhoneVerified: true, freeBookingUsed: false,
          patientProfile: {
            create: {
              age: p.age, gender: p.gender, city: p.city,
              bloodGroup: p.bloodGroup,
              existingDiseases: p.condition,
              dob: new Date(p.dob),
              emergencyContact: `+9175010${String(PATIENTS.indexOf(p)).padStart(5, '0')}`,
              state: p.city === 'Goa' ? 'Goa' : 'Karnataka',
              profileCompleted: true,
            },
          },
        },
      });
    }
    patientUsers.push(u);
  }
  console.log(`  ✅ ${patientUsers.length} patients ready`);

  // ── 7. Scenario Pre-seeds ────────────────────────────────────────────────────
  console.log('\n── 7. Scenario Pre-seeds ───────────────────────────────────');

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Get or create today's queue for physiotherapist
  let simQueue = await prisma.queue.findFirst({
    where: { clinicId: primaryClinic.id, doctorId: physioDoc.id, date: today },
  });
  if (!simQueue) {
    simQueue = await prisma.queue.create({
      data: { clinicId: primaryClinic.id, doctorId: physioDoc.id, date: today, status: 'ACTIVE' },
    });
  }

  // Scenario 1 — Free first booking (patient[0] has freeBookingUsed=false)
  const s1Patient = patientUsers[0];
  const existingS1 = await prisma.appointment.findFirst({
    where: { patientId: s1Patient.id, doctorId: physioDoc.id, clinicId: primaryClinic.id, appointmentDate: today },
  });
  if (!existingS1) {
    const s1Appt = await prisma.appointment.create({
      data: {
        patientId: s1Patient.id, doctorId: physioDoc.id, clinicId: primaryClinic.id,
        appointmentType: 'OFFLINE', appointmentDate: today, slotTime: '09:00',
        status: 'BOOKED', queueNumber: 1, estimatedWaitMinutes: 25,
        symptoms: s1Patient.patientProfile?.existingDiseases || 'Sports Injury',
      },
    });
    await prisma.payment.create({
      data: {
        appointmentId: s1Appt.id, patientId: s1Patient.id, amount: 0,
        status: 'PAID', method: 'RAZORPAY',
        razorpayOrderId: `free_${s1Appt.id}`, razorpayPaymentId: `free_${s1Appt.id}`,
        razorpaySignature: 'free_booking', paidAt: new Date(),
      },
    });
    await prisma.user.update({ where: { id: s1Patient.id }, data: { freeBookingUsed: true, freeBookingUsedAt: new Date() } });
    const s1qi = await prisma.queueItem.findFirst({ where: { queueId: simQueue.id, queueNumber: 1 } });
    if (!s1qi) {
      await prisma.queueItem.create({
        data: { queueId: simQueue.id, appointmentId: s1Appt.id, patientId: s1Patient.id, queueNumber: 1, status: 'WAITING', position: 1 },
      });
    }
    console.log(`  ✅ Scenario 1: Free booking — ${s1Patient.name} (token #1)`);
  } else {
    console.log(`  ⏭  Scenario 1 already exists`);
  }

  // Scenario 2 — Paid booking (patient[1] already has freeBookingUsed=true)
  const s2Patient = patientUsers[1];
  await prisma.user.update({ where: { id: s2Patient.id }, data: { freeBookingUsed: true, freeBookingUsedAt: new Date() } });
  const existingS2 = await prisma.appointment.findFirst({
    where: { patientId: s2Patient.id, doctorId: gpDoc.id, clinicId: primaryClinic.id, appointmentDate: today },
  });
  if (!existingS2) {
    const s2Appt = await prisma.appointment.create({
      data: {
        patientId: s2Patient.id, doctorId: gpDoc.id, clinicId: primaryClinic.id,
        appointmentType: 'OFFLINE', appointmentDate: today, slotTime: '10:00',
        status: 'BOOKED', queueNumber: 2, estimatedWaitMinutes: 15,
        symptoms: 'Back Pain',
      },
    });
    await prisma.payment.create({
      data: {
        appointmentId: s2Appt.id, patientId: s2Patient.id, amount: 10,
        status: 'PAID', method: 'RAZORPAY',
        razorpayOrderId: `order_dev_s2_${Date.now()}`,
        razorpayPaymentId: `pay_dev_s2_${Date.now()}`,
        razorpaySignature: 'dev_sig', paidAt: new Date(),
      },
    });
    // GP doc queue
    let gpQueue = await prisma.queue.findFirst({ where: { clinicId: primaryClinic.id, doctorId: gpDoc.id, date: today } });
    if (!gpQueue) {
      gpQueue = await prisma.queue.create({ data: { clinicId: primaryClinic.id, doctorId: gpDoc.id, date: today, status: 'ACTIVE' } });
    }
    await prisma.queueItem.create({
      data: { queueId: gpQueue.id, appointmentId: s2Appt.id, patientId: s2Patient.id, queueNumber: 2, status: 'WAITING', position: 1 },
    });
    console.log(`  ✅ Scenario 2: Paid booking (₹10) — ${s2Patient.name}`);
  } else {
    console.log(`  ⏭  Scenario 2 already exists`);
  }

  // Scenarios 7 & 8 — Bulk queue (10 patients for Physiotherapist queue — Live Queue test)
  console.log('\n── 8. Live Queue (10 patients in physio queue) ─────────────');
  const queuePatients = patientUsers.slice(2, 12);
  let pos = 2; // slot 1 is Scenario 1
  for (const qp of queuePatients) {
    const hour = 9 + Math.floor(pos * 25 / 60);
    const minute = (pos * 25) % 60;
    const slot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const existAppt = await prisma.appointment.findFirst({
      where: { patientId: qp.id, doctorId: physioDoc.id, clinicId: primaryClinic.id, appointmentDate: today },
    });
    if (!existAppt) {
      const appt = await prisma.appointment.create({
        data: {
          patientId: qp.id, doctorId: physioDoc.id, clinicId: primaryClinic.id,
          appointmentType: 'OFFLINE', appointmentDate: today, slotTime: slot,
          status: 'IN_QUEUE', queueNumber: pos, estimatedWaitMinutes: pos * 25,
          symptoms: PATIENTS[patientUsers.indexOf(qp)]?.condition || 'General Consultation',
        },
      });
      await prisma.payment.create({
        data: {
          appointmentId: appt.id, patientId: qp.id, amount: 10,
          status: 'PAID', method: 'RAZORPAY',
          razorpayOrderId: `order_dev_q${pos}_${Date.now()}`,
          razorpayPaymentId: `pay_dev_q${pos}_${Date.now()}`,
          razorpaySignature: 'dev_sig', paidAt: new Date(),
        },
      });
      await prisma.user.update({ where: { id: qp.id }, data: { freeBookingUsed: true } });
      const existQi = await prisma.queueItem.findFirst({ where: { queueId: simQueue.id, queueNumber: pos } });
      if (!existQi) {
        await prisma.queueItem.create({
          data: { queueId: simQueue.id, appointmentId: appt.id, patientId: qp.id, queueNumber: pos, status: 'WAITING', position: pos },
        });
      }
    }
    pos++;
  }
  console.log(`  ✅ ${queuePatients.length} patients in physio queue (tokens #2–#11)`);

  // Scenario 3 — Cancelled appointment (patient[12])
  console.log('\n── 9. Scenario 3 — Cancelled Appointment ───────────────────');
  const s3Patient = patientUsers[12];
  await prisma.user.update({ where: { id: s3Patient.id }, data: { freeBookingUsed: true } });
  const existingS3 = await prisma.appointment.findFirst({
    where: { patientId: s3Patient.id, status: 'CANCELLED', clinicId: primaryClinic.id },
  });
  if (!existingS3) {
    const s3Appt = await prisma.appointment.create({
      data: {
        patientId: s3Patient.id, doctorId: orthoDoc.id, clinicId: primaryClinic.id,
        appointmentType: 'OFFLINE', appointmentDate: today, slotTime: '14:00',
        status: 'CANCELLED', queueNumber: 12, estimatedWaitMinutes: 0,
        symptoms: 'Knee Pain',
      },
    });
    await prisma.payment.create({
      data: {
        appointmentId: s3Appt.id, patientId: s3Patient.id, amount: 10,
        status: 'REFUNDED', method: 'RAZORPAY',
        razorpayOrderId: `order_dev_s3_${Date.now()}`,
        razorpayPaymentId: `pay_dev_s3_${Date.now()}`,
        razorpaySignature: 'dev_sig', paidAt: new Date(),
      },
    });
    console.log(`  ✅ Scenario 3: Cancelled appointment — ${s3Patient.name}`);
  } else {
    console.log(`  ⏭  Scenario 3 already exists`);
  }

  // Scenario 10 — Doctor availability (neuro doctor, Tue + Thu + Sat)
  console.log('\n── 10. Scenario 10 — Doctor Availability Pre-seeded ────────');
  const existNeuroAvail = await prisma.doctorAvailability.findFirst({ where: { doctorId: neuroDoc.id } });
  if (!existNeuroAvail) {
    await seedAvailability(neuroDoc.id, primaryClinic.id, [2, 4, 6], '11:00', '17:00', 30);
    console.log(`  ✅ Neurologist availability: Tue/Thu/Sat 11:00-17:00`);
  } else {
    console.log(`  ⏭  Neurologist availability already set`);
  }

  // ── Print Summary ────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  SEED COMPLETE ✅                        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  USERS CREATED                                           ║');
  console.log(`║  Patients     : ${String(patientUsers.length).padEnd(5)}  (50 across 5 cities)       ║`);
  console.log('║  Doctors      : 5    (Physio/Ortho/GP/Neuro/Pain)        ║');
  console.log('║  Receptionists: 2    (Receptionist A & B)                ║');
  console.log('║  Clinic Owners: 2    (Owner A — Belagavi, B — Hubli)     ║');
  console.log('║  Super Admin  : 1    (Root Admin)                        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  CLINIC                                                  ║');
  console.log('║  Primary: PulseMate Ortho & Physio Centre, Belagavi      ║');
  console.log('║  Status : VERIFIED + ACTIVE                              ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  PRE-SEEDED SCENARIOS                                    ║');
  console.log('║  S1 Free booking  : Aditi Naik       → Physio (token #1) ║');
  console.log('║  S2 Paid booking  : Rohan Patil       → GP    (₹10 paid) ║');
  console.log('║  S3 Cancelled     : Deepak Kamble     → Ortho  (refunded)║');
  console.log('║  Live queue       : 11 patients in Physio queue today    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  CREDENTIALS                                             ║');
  console.log(`║  Patients    : OTP login (mobile number)                 ║`);
  console.log(`║  Doctors     : ${STAFF_PASS.padEnd(38)}║`);
  console.log(`║  Receptionists: ${STAFF_PASS.padEnd(37)}║`);
  console.log(`║  Clinic Owners: ${STAFF_PASS.padEnd(37)}║`);
  console.log(`║  Admin       : ${ADMIN_PASS.padEnd(39)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

main()
  .catch((err) => { console.error('\n❌ Seed failed:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
