// ═══════════════════════════════════════════════════════════════════════════
//  PulseMate Connect - Doctor Database Seeder
// ═══════════════════════════════════════════════════════════════════════════
//
//  This script populates the database with sample doctors for testing.
//
//  Usage:
//    node prisma/seed-doctors.js
//
//  What it creates:
//    - 1 clinic owner user
//    - 1 verified active clinic
//    - 5 doctors with different specializations
//    - Links all doctors to the clinic
//
//  All created data is marketplace-visible and ready to appear in the app.
//
// ═══════════════════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Sample doctor data
const DOCTORS = [
  {
    mobile: '9111111111',
    name: 'Priya Sharma',
    specialization: 'Cardiologist',
    experienceYears: 15,
    consultationFee: 800,
    rating: '4.8',
    bio: 'Experienced Cardiologist specializing in preventive cardiology and heart disease management. MBBS, MD (Medicine), DM (Cardiology).',
  },
  {
    mobile: '9222222222',
    name: 'Amit Patel',
    specialization: 'Dermatologist',
    experienceYears: 10,
    consultationFee: 600,
    rating: '4.6',
    bio: 'Expert in treating skin conditions, acne, and cosmetic dermatology. MBBS, MD (Dermatology).',
  },
  {
    mobile: '9333333333',
    name: 'Sneha Reddy',
    specialization: 'Pediatrician',
    experienceYears: 8,
    consultationFee: 500,
    rating: '4.9',
    bio: 'Compassionate pediatrician with expertise in child healthcare and immunization. MBBS, MD (Pediatrics).',
  },
  {
    mobile: '9444444444',
    name: 'Arjun Singh',
    specialization: 'Orthopedic',
    experienceYears: 12,
    consultationFee: 700,
    rating: '4.7',
    bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries. MBBS, MS (Orthopedics).',
  },
  {
    mobile: '9555555555',
    name: 'Meera Iyer',
    specialization: 'General Physician',
    experienceYears: 6,
    consultationFee: 400,
    rating: '4.5',
    bio: 'General physician providing comprehensive primary healthcare services. MBBS, MD (General Medicine).',
  },
];

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       PulseMate Connect - Doctor Database Seeder             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('🌱 Starting database seeding...\n');

  // ── Step 1: Create Clinic Owner ──────────────────────────────────────────
  console.log('[1/4] Creating clinic owner...');
  
  const ownerUser = await prisma.user.upsert({
    where: { mobile: '9876543210' },
    update: {},
    create: {
      mobile: '9876543210',
      name: 'Dr. Rajesh Kumar',
      email: 'owner@pulsemateconnect.in',
      password: await bcrypt.hash('test123', 10),
      role: 'CLINIC_OWNER',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('   ✅ Created clinic owner: Dr. Rajesh Kumar (9876543210)\n');

  // ── Step 2: Create Clinic ────────────────────────────────────────────────
  console.log('[2/4] Creating clinic...');

  const clinic = await prisma.clinic.upsert({
    where: { id: 'seed-clinic-001' },
    update: {},
    create: {
      id: 'seed-clinic-001',
      name: 'Metro Health Clinic',
      ownerId: ownerUser.id,
      city: 'Mumbai',
      state: 'Maharashtra',
      address: '123 MG Road, Andheri West, Mumbai - 400053',
      mobile: '9876543210',
      email: 'contact@metrohealthclinic.in',
      approvalStatus: 'VERIFIED',
      isActive: true,
      isVerified: true,
      description: 'Multi-specialty clinic with experienced doctors and modern facilities.',
    },
  });

  console.log('   ✅ Created clinic: Metro Health Clinic (Mumbai)\n');

  // ── Step 3: Create Doctors ───────────────────────────────────────────────
  console.log('[3/4] Creating doctors...');

  let doctorCount = 0;

  for (const doc of DOCTORS) {
    try {
      // Create user account
      const docUser = await prisma.user.upsert({
        where: { mobile: doc.mobile },
        update: {},
        create: {
          mobile: doc.mobile,
          name: doc.name,
          email: `${doc.mobile}@pulsemateconnect.in`,
          password: await bcrypt.hash('test123', 10),
          role: 'DOCTOR',
          emailVerified: true,
          isActive: true,
        },
      });

      // Create doctor profile
      const docProfile = await prisma.doctorProfile.upsert({
        where: { userId: docUser.id },
        update: {
          specialization: doc.specialization,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          rating: doc.rating,
          bio: doc.bio,
          approvalStatus: 'VERIFIED',
          marketplaceVisible: true,
          offlineAvailable: true,
        },
        create: {
          userId: docUser.id,
          specialization: doc.specialization,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          rating: doc.rating,
          bio: doc.bio,
          approvalStatus: 'VERIFIED',
          marketplaceVisible: true,
          offlineAvailable: true,
        },
      });

      console.log(`   ✅ Dr. ${doc.name} (${doc.specialization}) - ₹${doc.consultationFee}`);
      doctorCount++;
    } catch (error) {
      console.log(`   ❌ Failed to create Dr. ${doc.name}: ${error.message}`);
    }
  }

  console.log(`\n   Created ${doctorCount}/${DOCTORS.length} doctors\n`);

  // ── Step 4: Link Doctors to Clinic ───────────────────────────────────────
  console.log('[4/4] Linking doctors to clinic...');

  let linkCount = 0;

  for (const doc of DOCTORS) {
    try {
      const docUser = await prisma.user.findUnique({
        where: { mobile: doc.mobile },
        include: { doctorProfile: true },
      });

      if (!docUser || !docUser.doctorProfile) {
        console.log(`   ⚠️  Skipping Dr. ${doc.name} - not found`);
        continue;
      }

      await prisma.doctorClinic.upsert({
        where: {
          doctorId_clinicId: {
            doctorId: docUser.doctorProfile.id,
            clinicId: clinic.id,
          },
        },
        update: {
          inviteStatus: 'ACCEPTED',
          isActive: true,
        },
        create: {
          doctorId: docUser.doctorProfile.id,
          clinicId: clinic.id,
          inviteStatus: 'ACCEPTED',
          isActive: true,
        },
      });

      console.log(`   ✅ Linked Dr. ${doc.name} to ${clinic.name}`);
      linkCount++;
    } catch (error) {
      console.log(`   ❌ Failed to link Dr. ${doc.name}: ${error.message}`);
    }
  }

  console.log(`\n   Linked ${linkCount}/${DOCTORS.length} doctors to clinic\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    🎉 SEEDING COMPLETE!                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Summary:');
  console.log(`   • Clinic Owner: 1 user created`);
  console.log(`   • Clinic: 1 clinic created (${clinic.name})`);
  console.log(`   • Doctors: ${doctorCount} doctors created`);
  console.log(`   • Links: ${linkCount} doctor-clinic links created\n`);

  console.log('🎯 What to do next:');
  console.log('   1. Restart your app');
  console.log('   2. Go to "Top Doctors" screen');
  console.log('   3. You should see 5 doctors! ✅\n');

  console.log('🔐 Login credentials for testing:');
  console.log('   Clinic Owner:');
  console.log('     Mobile: 9876543210');
  console.log('     Password: test123\n');
  console.log('   Doctors (any of these):');
  DOCTORS.forEach((d) => {
    console.log(`     Mobile: ${d.mobile} (Dr. ${d.name})`);
  });
  console.log('     Password: test123\n');

  console.log('💡 Tip: Use Prisma Studio to view the data:');
  console.log('   npx prisma studio\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
