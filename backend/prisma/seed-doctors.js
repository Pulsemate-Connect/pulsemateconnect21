require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const doctors = [
  {
    name: 'Dr. Aisha Kapoor',
    mobile: '+919200000001',
    email: 'aisha.kapoor@pulsemate.com',
    specialization: 'Cardiology',
    qualification: 'MD, DM (Cardiology)',
    education: 'AIIMS New Delhi',
    experience: 12,
    fee: 1200,
    bio: 'Senior cardiologist with expertise in interventional cardiology and heart failure management.',
    regNo: 'PM-DR-1001',
    languages: ['English', 'Hindi'],
    online: true,
    offline: true,
    avgMins: 30,
  },
  {
    name: 'Dr. Ravi Menon',
    mobile: '+919200000002',
    email: 'ravi.menon@pulsemate.com',
    specialization: 'Neurology',
    qualification: 'MD, DM (Neurology)',
    education: 'NIMHANS Bangalore',
    experience: 15,
    fee: 1500,
    bio: 'Neurologist specializing in epilepsy, stroke, and movement disorders.',
    regNo: 'PM-DR-1002',
    languages: ['English', 'Hindi', 'Malayalam'],
    online: true,
    offline: true,
    avgMins: 35,
  },
  {
    name: 'Dr. Priya Desai',
    mobile: '+919200000003',
    email: 'priya.desai@pulsemate.com',
    specialization: 'Dermatology',
    qualification: 'MD (Dermatology)',
    education: 'KEM Hospital Mumbai',
    experience: 8,
    fee: 800,
    bio: 'Dermatologist specializing in acne, psoriasis, hair disorders, and cosmetic dermatology.',
    regNo: 'PM-DR-1003',
    languages: ['English', 'Hindi', 'Marathi'],
    online: true,
    offline: false,
    avgMins: 20,
  },
  {
    name: 'Dr. Suresh Nambiar',
    mobile: '+919200000004',
    email: 'suresh.nambiar@pulsemate.com',
    specialization: 'Orthopedics',
    qualification: 'MS (Orthopedics)',
    education: 'Madras Medical College',
    experience: 18,
    fee: 1000,
    bio: 'Orthopedic surgeon with specialization in joint replacement and sports injuries.',
    regNo: 'PM-DR-1004',
    languages: ['English', 'Tamil', 'Malayalam'],
    online: false,
    offline: true,
    avgMins: 25,
  },
  {
    name: 'Dr. Kavita Sharma',
    mobile: '+919200000005',
    email: 'kavita.sharma@pulsemate.com',
    specialization: 'Gynecology',
    qualification: 'MD, DNB (Obstetrics & Gynecology)',
    education: 'Lady Hardinge Medical College Delhi',
    experience: 10,
    fee: 900,
    bio: 'Gynecologist with expertise in high-risk pregnancies, infertility, and minimal access surgery.',
    regNo: 'PM-DR-1005',
    languages: ['English', 'Hindi'],
    online: true,
    offline: true,
    avgMins: 25,
  },
  {
    name: 'Dr. Farhan Sheikh',
    mobile: '+919200000006',
    email: 'farhan.sheikh@pulsemate.com',
    specialization: 'Gastroenterology',
    qualification: 'MD, DM (Gastroenterology)',
    education: 'Grant Medical College Mumbai',
    experience: 11,
    fee: 1100,
    bio: 'Gastroenterologist skilled in advanced endoscopy, liver disorders, and IBD management.',
    regNo: 'PM-DR-1006',
    languages: ['English', 'Hindi', 'Urdu'],
    online: true,
    offline: true,
    avgMins: 30,
  },
  {
    name: 'Dr. Ananya Iyer',
    mobile: '+919200000007',
    email: 'ananya.iyer@pulsemate.com',
    specialization: 'Pediatrics',
    qualification: 'MD (Pediatrics)',
    education: 'Jawaharlal Institute Puducherry',
    experience: 7,
    fee: 700,
    bio: 'Pediatrician specializing in newborn care, childhood development, and pediatric infections.',
    regNo: 'PM-DR-1007',
    languages: ['English', 'Tamil', 'Kannada'],
    online: true,
    offline: true,
    avgMins: 20,
  },
  {
    name: 'Dr. Vikram Patel',
    mobile: '+919200000008',
    email: 'vikram.patel@pulsemate.com',
    specialization: 'Psychiatry',
    qualification: 'MD (Psychiatry)',
    education: 'GMERS Medical College Gujarat',
    experience: 9,
    fee: 1000,
    bio: 'Psychiatrist with focus on anxiety disorders, depression, OCD, and addiction therapy.',
    regNo: 'PM-DR-1008',
    languages: ['English', 'Hindi', 'Gujarati'],
    online: true,
    offline: true,
    avgMins: 45,
  },
  {
    name: 'Dr. Lakshmi Rajan',
    mobile: '+919200000009',
    email: 'lakshmi.rajan@pulsemate.com',
    specialization: 'Ophthalmology',
    qualification: 'MS (Ophthalmology)',
    education: 'Regional Institute of Ophthalmology Chennai',
    experience: 13,
    fee: 800,
    bio: 'Ophthalmologist experienced in cataract surgery, glaucoma management, and retinal disorders.',
    regNo: 'PM-DR-1009',
    languages: ['English', 'Tamil'],
    online: false,
    offline: true,
    avgMins: 20,
  },
  {
    name: 'Dr. Aryan Mehta',
    mobile: '+919300000010',
    email: 'aryan.mehta2@pulsemate.com',
    specialization: 'Endocrinology',
    qualification: 'MD, DM (Endocrinology)',
    education: 'Seth GS Medical College Mumbai',
    experience: 10,
    fee: 1200,
    bio: 'Endocrinologist specializing in diabetes, thyroid disorders, and hormonal imbalances.',
    regNo: 'PM-DR-1010',
    languages: ['English', 'Hindi', 'Gujarati'],
    online: true,
    offline: true,
    avgMins: 30,
  },
];

async function main() {
  console.log('🌱  Seeding 10 dummy doctors...\n');

  const passwordHash = await bcrypt.hash('Password@123', 12);
  const results = [];

  for (const d of doctors) {
    // Skip if already exists (mobile or email)
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: d.mobile }, { email: d.email }] },
    });

    if (existing) {
      console.log(`⚠️  Skipped (already exists): ${d.name}`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        name: d.name,
        mobile: d.mobile,
        email: d.email,
        role: 'DOCTOR',
        approvalStatus: 'VERIFIED',
        passwordHash,
        isPhoneVerified: true,
        isEmailVerified: true,
        doctorProfile: {
          create: {
            approvalStatus: 'VERIFIED',
            qualification: d.qualification,
            specialization: d.specialization,
            experienceYears: d.experience,
            education: d.education,
            consultationFee: d.fee,
            onlineAvailable: d.online,
            offlineAvailable: d.offline,
            bio: d.bio,
            avgConsultationMins: d.avgMins,
            medicalRegistrationNumber: d.regNo,
            certificates: [],
            languagesKnown: d.languages,
            marketplaceVisible: true,
          },
        },
      },
      include: { doctorProfile: true },
    });

    results.push(user);
    console.log(`✅  Created: ${d.name} — ${d.specialization}`);
  }

  console.log(`\n🎉  Done! ${results.length} doctors added.`);
  console.log('🔑  Login password for all: Password@123\n');

  console.log('──────────────────────────────────────────────────────────');
  console.log('Name                     | Specialization   | Email');
  console.log('──────────────────────────────────────────────────────────');
  for (const d of doctors) {
    console.log(`${d.name.padEnd(25)}| ${d.specialization.padEnd(17)}| ${d.email}`);
  }
  console.log('──────────────────────────────────────────────────────────');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
