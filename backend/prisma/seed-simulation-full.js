'use strict';
/**
 * seed-simulation-full.js
 * ═══════════════════════════════════════════════════════════════════════════
 * PulseMate Full Simulation Seed — 60 Virtual Users
 *
 * Creates:
 *   01 Super Admin    (Root)
 *   02 Clinic Owners  (Owner A + Owner B) + 2 VERIFIED clinics
 *   05 Doctors        (Physio · Ortho · GP · Neurologist · Pain Specialist)
 *   02 Receptionists  (A assigned to Clinic-1, B to Clinic-2)
 *   50 Patients       (10 per age group × 5 age groups, 5 cities, 8 conditions)
 *
 * Run:  node prisma/seed-simulation-full.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DEFAULT_PASS = 'Simulation@123';

// ─── Name pools ───────────────────────────────────────────────────────────────
const MALE_NAMES = [
  'Aarav Patil', 'Rohit Naik', 'Vikram Shetty', 'Suresh Gowda',
  'Mahesh Desai', 'Ajay Kulkarni', 'Nikhil Joshi', 'Rajan Bhat',
  'Deepak Rao', 'Ganesh Hegde', 'Aakash Nair', 'Pavan Kumar',
  'Sanjay Verma', 'Kiran Malhotra', 'Arjun Sharma', 'Tejas Reddy',
  'Vishal Iyer', 'Kunal Mehta', 'Sameer Anand', 'Harish Pillai',
  'Abhishek Singh', 'Dinesh More', 'Rajesh Kadam', 'Siddharth Nayak',
  'Amit Ghosh',
];

const FEMALE_NAMES = [
  'Priya Naik', 'Sneha Kulkarni', 'Anjali Shetty', 'Meera Joshi',
  'Kavya Patil', 'Pallavi Gowda', 'Divya Rao', 'Sunita Bhat',
  'Rekha Desai', 'Anita Hegde', 'Deepa Nair', 'Smita Kumar',
  'Pooja Verma', 'Swati Malhotra', 'Neha Sharma', 'Rashmi Reddy',
  'Vidya Iyer', 'Mamta Mehta', 'Sarita Anand', 'Bhavna Pillai',
  'Archana Singh', 'Leela More', 'Kamala Kadam', 'Shubha Nayak',
  'Mala Ghosh',
];

const OTHER_NAMES = [
  'Alex Fernandes', 'Sam Pinto', 'Jordan D\'Souza', 'Taylor Rodrigues', 'Casey Mascarenhas',
  'Robin Sequeira', 'Drew Vaz', 'Morgan Lobo', 'Avery D\'Costa', 'Quinn Pereira',
];

const CITIES = ['Belagavi', 'Karwar', 'Hubli', 'Dharwad', 'Goa'];
const CONDITIONS = [
  'Back Pain', 'Neck Pain', 'Knee Pain', 'Shoulder Pain',
  'Sciatica', 'Arthritis', 'Sports Injury', 'General Consultation',
];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// age group: [label, minAge, maxAge]
const AGE_GROUPS = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-60', min: 46, max: 60 },
  { label: '60+', min: 61, max: 78 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n, w = 2) => String(n).padStart(w, '0');

async function upsertUser(where, data, include = {}) {
  const existing = await prisma.user.findUnique({ where, include });
  if (existing) return existing;
  return prisma.user.create({ data, include });
}

// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  PulseMate Full Simulation Seed — 60 Virtual Users    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const hash = await bcrypt.hash(DEFAULT_PASS, 12);

  // ─── 1. SUPER ADMIN (Root) ──────────────────────────────────────────────────
  console.log('▶  Creating Super Admin…');
  const adminUser = await upsertUser(
    { email: 'root@sim.pulsemate.com' },
    {
      name: 'Sim Root Admin',
      mobile: '+917599000001',
      email: 'root@sim.pulsemate.com',
      role: 'SUPER_ADMIN',
      approvalStatus: 'VERIFIED',
      passwordHash: hash,
      isPhoneVerified: true,
      isEmailVerified: true,
      adminProfile: { create: { level: 'ROOT' } },
    },
    { adminProfile: true }
  );
  console.log(`   ✓ ${adminUser.name}  [${adminUser.email}]`);

  // ─── 2. CLINIC OWNERS (2) + CLINICS (2) ────────────────────────────────────
  console.log('\n▶  Creating Clinic Owners & Clinics…');

  const ownerAUser = await upsertUser(
    { email: 'owner.a@sim.pulsemate.com' },
    {
      name: 'Dr. Basavraj Patil',
      mobile: '+917599000002',
      email: 'owner.a@sim.pulsemate.com',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash: hash,
      isPhoneVerified: true,
      isEmailVerified: true,
    }
  );

  const ownerBUser = await upsertUser(
    { email: 'owner.b@sim.pulsemate.com' },
    {
      name: 'Dr. Nalini D\'Souza',
      mobile: '+917599000003',
      email: 'owner.b@sim.pulsemate.com',
      role: 'CLINIC_OWNER',
      approvalStatus: 'VERIFIED',
      passwordHash: hash,
      isPhoneVerified: true,
      isEmailVerified: true,
    }
  );

  const clinicAData = {
    name: 'SIM PulseMate Wellness Centre',
    ownerId: ownerAUser.id,
    phone: '+917599100001',
    address: '12 MG Road, Camp Area',
    city: 'Belagavi', state: 'Karnataka', pincode: '590001', district: 'Belagavi',
    latitude: 15.8497, longitude: 74.4977,
    isVerified: true, approvalStatus: 'VERIFIED',
    openingTime: '09:00', closingTime: '20:00',
    openingHours: 'Mon–Sat 09:00–20:00',
    specialties: ['Physiotherapy', 'Orthopedics', 'Pain Management'],
    description: 'Simulation Clinic A — full workflow testing',
    submittedAt: new Date(), verifiedAt: new Date(),
    avgConsultationMinutes: 20, dailyPatientCapacity: 80,
    consultationModes: ['OFFLINE', 'ONLINE'],
    facilities: ['ECG', 'X-Ray', 'Pharmacy', 'Parking'],
    languagesSpoken: ['English', 'Kannada', 'Hindi'],
    paymentMethods: ['CASH', 'UPI', 'CARD'],
    weeklySchedule: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
  };

  let clinicA = await prisma.clinic.findFirst({ where: { name: clinicAData.name } });
  if (!clinicA) clinicA = await prisma.clinic.create({ data: clinicAData });

  const clinicBData = {
    name: 'SIM Coastal Health Clinic',
    ownerId: ownerBUser.id,
    phone: '+917599100002',
    address: '45 Harbour View Road',
    city: 'Karwar', state: 'Karnataka', pincode: '581301', district: 'Uttara Kannada',
    latitude: 14.8133, longitude: 74.1288,
    isVerified: true, approvalStatus: 'VERIFIED',
    openingTime: '09:00', closingTime: '19:00',
    openingHours: 'Mon–Sat 09:00–19:00',
    specialties: ['General Medicine', 'Neurology'],
    description: 'Simulation Clinic B — full workflow testing',
    submittedAt: new Date(), verifiedAt: new Date(),
    avgConsultationMinutes: 15, dailyPatientCapacity: 60,
    consultationModes: ['OFFLINE'],
    facilities: ['Lab', 'Pharmacy'],
    languagesSpoken: ['English', 'Kannada', 'Konkani'],
    paymentMethods: ['CASH', 'UPI'],
    weeklySchedule: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false },
  };

  let clinicB = await prisma.clinic.findFirst({ where: { name: clinicBData.name } });
  if (!clinicB) clinicB = await prisma.clinic.create({ data: clinicBData });

  // Owner → ClinicStaff
  for (const [uid, cid] of [[ownerAUser.id, clinicA.id], [ownerBUser.id, clinicB.id]]) {
    const exists = await prisma.clinicStaff.findFirst({ where: { clinicId: cid, userId: uid } });
    if (!exists) await prisma.clinicStaff.create({ data: { clinicId: cid, userId: uid, role: 'OWNER' } });
  }

  console.log(`   ✓ Owner A: ${ownerAUser.name}  →  ${clinicA.name}`);
  console.log(`   ✓ Owner B: ${ownerBUser.name}  →  ${clinicB.name}`);

  // ─── 3. DOCTORS (5) ─────────────────────────────────────────────────────────
  console.log('\n▶  Creating Doctors…');

  const DOCTOR_DEFS = [
    {
      email: 'dr.physio@sim.pulsemate.com',
      mobile: '+917599000010',
      name: 'Dr. Pradeep Kulkarni',
      specialization: 'Physiotherapy',
      qualification: 'MPT (Musculoskeletal)',
      experience: 8, fee: 600,
      regNo: 'SIM-DR-001',
      bio: 'Senior physio specialising in post-surgical rehab and chronic pain management.',
      langs: ['English', 'Kannada', 'Hindi'],
      online: true, offline: true,
      clinicId: clinicA.id,
      availDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
      start: '09:00', end: '17:00', slotMin: 20,
    },
    {
      email: 'dr.ortho@sim.pulsemate.com',
      mobile: '+917599000011',
      name: 'Dr. Suhas Mahajan',
      specialization: 'Orthopedics',
      qualification: 'MS (Ortho)',
      experience: 12, fee: 800,
      regNo: 'SIM-DR-002',
      bio: 'Orthopedic surgeon with expertise in joint replacement and spine surgery.',
      langs: ['English', 'Hindi', 'Marathi'],
      online: false, offline: true,
      clinicId: clinicA.id,
      availDays: [1, 2, 3, 4, 5], // Mon–Fri
      start: '10:00', end: '16:00', slotMin: 25,
    },
    {
      email: 'dr.gp@sim.pulsemate.com',
      mobile: '+917599000012',
      name: 'Dr. Rekha Amin',
      specialization: 'General Medicine',
      qualification: 'MBBS MD',
      experience: 6, fee: 400,
      regNo: 'SIM-DR-003',
      bio: 'General physician providing comprehensive primary healthcare services.',
      langs: ['English', 'Kannada', 'Konkani'],
      online: true, offline: true,
      clinicId: clinicB.id,
      availDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
      start: '09:00', end: '18:00', slotMin: 15,
    },
    {
      email: 'dr.neuro@sim.pulsemate.com',
      mobile: '+917599000013',
      name: 'Dr. Anand Prabhu',
      specialization: 'Neurology',
      qualification: 'DM Neurology',
      experience: 15, fee: 1000,
      regNo: 'SIM-DR-004',
      bio: 'Neurologist specialising in headache, epilepsy and neuropathy.',
      langs: ['English', 'Hindi', 'Kannada'],
      online: false, offline: true,
      clinicId: clinicB.id,
      availDays: [1, 3, 5], // Mon, Wed, Fri
      start: '10:00', end: '14:00', slotMin: 30,
    },
    {
      email: 'dr.pain@sim.pulsemate.com',
      mobile: '+917599000014',
      name: 'Dr. Fatima Sheikh',
      specialization: 'Pain Management',
      qualification: 'MD Fellowship Pain',
      experience: 10, fee: 750,
      regNo: 'SIM-DR-005',
      bio: 'Pain specialist offering interventional procedures and multimodal treatment.',
      langs: ['English', 'Hindi', 'Urdu', 'Kannada'],
      online: true, offline: true,
      clinicId: clinicA.id,
      availDays: [2, 4, 6], // Tue, Thu, Sat
      start: '11:00', end: '17:00', slotMin: 25,
    },
  ];

  const createdDoctors = [];
  for (const dd of DOCTOR_DEFS) {
    let docUser = await prisma.user.findUnique({
      where: { email: dd.email },
      include: { doctorProfile: true },
    });
    if (!docUser) {
      docUser = await prisma.user.create({
        data: {
          name: dd.name, mobile: dd.mobile, email: dd.email,
          role: 'DOCTOR', approvalStatus: 'VERIFIED', passwordHash: hash,
          isPhoneVerified: true, isEmailVerified: true,
          doctorProfile: {
            create: {
              approvalStatus: 'VERIFIED',
              qualification: dd.qualification,
              specialization: dd.specialization,
              experienceYears: dd.experience,
              consultationFee: dd.fee,
              onlineAvailable: dd.online,
              offlineAvailable: dd.offline,
              bio: dd.bio,
              avgConsultationMins: dd.slotMin,
              medicalRegistrationNumber: dd.regNo,
              languagesKnown: dd.langs,
              marketplaceVisible: true,
            },
          },
        },
        include: { doctorProfile: true },
      });
    }
    createdDoctors.push({ user: docUser, def: dd });

    const dp = docUser.doctorProfile;
    if (!dp) continue;

    // ClinicStaff
    const staffExists = await prisma.clinicStaff.findFirst({ where: { clinicId: dd.clinicId, userId: docUser.id } });
    if (!staffExists) {
      await prisma.clinicStaff.create({ data: { clinicId: dd.clinicId, userId: docUser.id, role: 'DOCTOR' } });
    }

    // DoctorClinic
    const dcExists = await prisma.doctorClinic.findFirst({ where: { doctorId: dp.id, clinicId: dd.clinicId } });
    if (!dcExists) {
      const dayNames = { 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT', 0: 'SUN' };
      await prisma.doctorClinic.create({
        data: {
          doctorId: dp.id, clinicId: dd.clinicId,
          inviteStatus: 'ACCEPTED',
          consultationFee: dd.fee,
          availableDays: dd.availDays.map(d => dayNames[d]),
          startTime: dd.start, endTime: dd.end,
          avgConsultationMins: dd.slotMin,
          joinedAt: new Date(),
        },
      });
    }

    // DoctorAvailability (one row per day)
    for (const dow of dd.availDays) {
      await prisma.doctorAvailability.upsert({
        where: { doctorId_clinicId_dayOfWeek: { doctorId: dp.id, clinicId: dd.clinicId, dayOfWeek: dow } },
        update: { startTime: dd.start, endTime: dd.end, slotDurationMin: dd.slotMin, maxPatients: 30, isActive: true },
        create: { doctorId: dp.id, clinicId: dd.clinicId, dayOfWeek: dow, startTime: dd.start, endTime: dd.end, slotDurationMin: dd.slotMin, maxPatients: 30 },
      });
    }

    console.log(`   ✓ ${dd.name}  (${dd.specialization})  ₹${dd.fee}`);
  }

  // ─── 4. RECEPTIONISTS (2) ───────────────────────────────────────────────────
  console.log('\n▶  Creating Receptionists…');

  const RECEPT_DEFS = [
    { email: 'recept.a@sim.pulsemate.com', mobile: '+917599000020', name: 'Mangala Kore', clinicId: clinicA.id, ownerId: ownerAUser.id },
    { email: 'recept.b@sim.pulsemate.com', mobile: '+917599000021', name: 'Savitha Naik', clinicId: clinicB.id, ownerId: ownerBUser.id },
  ];

  const createdReceptionists = [];
  for (const rd of RECEPT_DEFS) {
    let rUser = await prisma.user.findUnique({ where: { email: rd.email }, include: { receptionistProfile: true } });
    if (!rUser) {
      rUser = await prisma.user.create({
        data: {
          name: rd.name, mobile: rd.mobile, email: rd.email,
          role: 'RECEPTIONIST', approvalStatus: 'VERIFIED', passwordHash: hash,
          isPhoneVerified: true,
          receptionistProfile: { create: { assignedClinicId: rd.clinicId, createdByOwnerId: rd.ownerId } },
        },
        include: { receptionistProfile: true },
      });
    }
    const staffExists = await prisma.clinicStaff.findFirst({ where: { clinicId: rd.clinicId, userId: rUser.id } });
    if (!staffExists) {
      await prisma.clinicStaff.create({ data: { clinicId: rd.clinicId, userId: rUser.id, role: 'RECEPTIONIST' } });
    }
    createdReceptionists.push(rUser);
    console.log(`   ✓ ${rd.name}  → ${rd.clinicId === clinicA.id ? clinicA.name : clinicB.name}`);
  }

  // ─── 5. PATIENTS (50) ───────────────────────────────────────────────────────
  console.log('\n▶  Creating 50 Patients…');
  const createdPatients = [];
  let mobileSeq = 100;
  let mIdx = 0, fIdx = 0, oIdx = 0; // name counters

  for (const group of AGE_GROUPS) {
    process.stdout.write(`   Age ${group.label}: `);
    for (let i = 0; i < 10; i++) {
      // 4 MALE · 4 FEMALE · 2 OTHER per group
      const gender = i < 4 ? 'MALE' : i < 8 ? 'FEMALE' : 'OTHER';
      const nameMap = { MALE: MALE_NAMES[mIdx++ % MALE_NAMES.length], FEMALE: FEMALE_NAMES[fIdx++ % FEMALE_NAMES.length], OTHER: OTHER_NAMES[oIdx++ % OTHER_NAMES.length] };
      const fullName = nameMap[gender];
      const age = randInt(group.min, group.max);
      const city = CITIES[i % CITIES.length];
      const state = city === 'Goa' ? 'Goa' : 'Karnataka';
      const cond = CONDITIONS[mobileSeq % CONDITIONS.length];
      const bg = BLOOD_GROUPS[mobileSeq % BLOOD_GROUPS.length];
      const mobile = `+9175990${pad(mobileSeq, 5)}`;
      const email = `patient${mobileSeq}@sim.pulsemate.com`;
      mobileSeq++;

      let pUser = await prisma.user.findUnique({ where: { email } });
      if (!pUser) {
        pUser = await prisma.user.create({
          data: {
            name: fullName, mobile, email,
            role: 'PATIENT', approvalStatus: 'VERIFIED',
            isPhoneVerified: true, freeBookingUsed: false,
            patientProfile: {
              create: {
                age, gender, bloodGroup: bg, city, state,
                address: `${100 + mobileSeq} ${city} Main Road`,
                pincode: city === 'Goa' ? '403001' : '590001',
                emergencyContact: `+9175990${pad(mobileSeq + 500, 5)}`,
                allergies: i % 5 === 0 ? 'Penicillin' : null,
                existingDiseases: i % 3 === 0 ? cond : null,
                profileCompleted: true,
              },
            },
          },
          include: { patientProfile: true },
        });
      }
      createdPatients.push({ user: pUser, condition: cond, ageGroup: group.label, city, gender });
      process.stdout.write('.');
    }
    console.log(` (10)`);
  }

  // ─── 6. TODAY'S QUEUE — first 25 patients booked with physio ────────────────
  console.log('\n▶  Seeding today\'s appointments & live queue…');

  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const physioUser = createdDoctors[0].user;
  const physioDp = physioUser.doctorProfile;

  if (physioDp) {
    let queue = await prisma.queue.findFirst({
      where: { clinicId: clinicA.id, doctorId: physioDp.id, date: today },
    });
    if (!queue) {
      queue = await prisma.queue.create({
        data: { clinicId: clinicA.id, doctorId: physioDp.id, date: today, status: 'ACTIVE' },
      });
    }

    const qPatients = createdPatients.slice(0, 25);
    for (let i = 0; i < qPatients.length; i++) {
      const { user: p, condition } = qPatients[i];
      const qNum = i + 1;
      const status = qNum <= 3 ? 'COMPLETED' : qNum === 4 ? 'IN_CONSULTATION' : 'IN_QUEUE';
      const qiStatus = qNum <= 3 ? 'COMPLETED' : qNum === 4 ? 'IN_CONSULTATION' : 'WAITING';

      const existingAppt = await prisma.appointment.findFirst({
        where: { patientId: p.id, doctorId: physioDp.id, clinicId: clinicA.id, appointmentDate: today },
      });
      if (existingAppt) continue;

      const appt = await prisma.appointment.create({
        data: {
          patientId: p.id, doctorId: physioDp.id, clinicId: clinicA.id,
          appointmentType: 'OFFLINE', appointmentDate: today,
          slotTime: `${pad(9 + Math.floor(i / 3))}:${pad((i % 3) * 20)}`,
          status, queueNumber: qNum,
          estimatedWaitMinutes: qNum * 20, symptoms: condition,
        },
      });

      await prisma.user.update({ where: { id: p.id }, data: { freeBookingUsed: true, freeBookingUsedAt: new Date() } });

      const existingPay = await prisma.payment.findUnique({ where: { appointmentId: appt.id } });
      if (!existingPay) {
        await prisma.payment.create({
          data: {
            appointmentId: appt.id, patientId: p.id,
            amount: 0, status: 'PAID', method: 'RAZORPAY',
            razorpayOrderId: `free_${appt.id}`,
            razorpayPaymentId: `free_${appt.id}`,
            razorpaySignature: 'free_booking',
            paidAt: new Date(),
          },
        });
      }

      const existingQI = await prisma.queueItem.findFirst({ where: { queueId: queue.id, patientId: p.id } });
      if (!existingQI) {
        await prisma.queueItem.create({
          data: {
            queueId: queue.id, appointmentId: appt.id, patientId: p.id,
            queueNumber: qNum, status: qiStatus, position: qNum,
          },
        });
      }
    }
    console.log(`   ✓ 25 appointments created | queue status: ACTIVE | currently serving: #4`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  const [uc, dc, cc, ac, qc] = await Promise.all([
    prisma.user.count(),
    prisma.doctorProfile.count(),
    prisma.clinic.count(),
    prisma.appointment.count(),
    prisma.queueItem.count(),
  ]);

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              SIMULATION SEED COMPLETE                  ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  Total Users in DB :  ${String(uc).padEnd(34)}║`);
  console.log(`║  Doctor Profiles   :  ${String(dc).padEnd(34)}║`);
  console.log(`║  Clinics           :  ${String(cc).padEnd(34)}║`);
  console.log(`║  Appointments      :  ${String(ac).padEnd(34)}║`);
  console.log(`║  Queue Items       :  ${String(qc).padEnd(34)}║`);
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  DEFAULT PASSWORD  :  Simulation@123                   ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  root@sim.pulsemate.com          Super Admin (ROOT)    ║');
  console.log('║  owner.a@sim.pulsemate.com       Clinic Owner A        ║');
  console.log('║  owner.b@sim.pulsemate.com       Clinic Owner B        ║');
  console.log('║  dr.physio@sim.pulsemate.com     Physiotherapist       ║');
  console.log('║  dr.ortho@sim.pulsemate.com      Orthopedic            ║');
  console.log('║  dr.gp@sim.pulsemate.com         General Physician     ║');
  console.log('║  dr.neuro@sim.pulsemate.com      Neurologist           ║');
  console.log('║  dr.pain@sim.pulsemate.com       Pain Specialist       ║');
  console.log('║  recept.a@sim.pulsemate.com      Receptionist A        ║');
  console.log('║  recept.b@sim.pulsemate.com      Receptionist B        ║');
  console.log('║  patient100–149@sim.pulsemate.com  50 patients         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
