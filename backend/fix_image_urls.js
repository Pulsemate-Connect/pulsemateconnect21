/**
 * fix_image_urls.js
 * 
 * Fixes clinic image/document URLs in the database that point to
 * non-existent files by finding the closest matching file on disk.
 * 
 * Run with: node fix_image_urls.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'clinic-owner');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Get all files currently on disk
function getFilesOnDisk() {
  try {
    return fs.readdirSync(UPLOADS_DIR);
  } catch {
    return [];
  }
}

// Extract the UUID / original-name part from a filename (after the timestamp prefix)
// e.g. "1780312241101-090192b7-a4c7-4eb1-85bd-b15c7eec98cd.png"
//  →  "090192b7-a4c7-4eb1-85bd-b15c7eec98cd.png"
function getFileSuffix(filename) {
  const match = filename.match(/^\d+-(.*)/);
  return match ? match[1] : filename;
}

// Given a stored URL, find the best matching file on disk
function findBestMatch(storedUrl, filesOnDisk) {
  if (!storedUrl) return null;

  // Extract the filename from the URL
  const storedFilename = storedUrl.split('/').pop();

  // 1. Exact match
  if (filesOnDisk.includes(storedFilename)) {
    return storedFilename;
  }

  // 2. Match by suffix (same UUID / original name, different timestamp)
  const storedSuffix = getFileSuffix(storedFilename);
  const suffixMatches = filesOnDisk.filter(f => getFileSuffix(f) === storedSuffix);
  if (suffixMatches.length > 0) {
    // Return the most recent one (highest timestamp)
    suffixMatches.sort((a, b) => {
      const tA = parseInt(a.split('-')[0]) || 0;
      const tB = parseInt(b.split('-')[0]) || 0;
      return tB - tA;
    });
    return suffixMatches[0];
  }

  return null; // No match found
}

function buildUrl(filename) {
  return `${BACKEND_URL}/uploads/clinic-owner/${filename}`;
}

async function fixClinicUrls() {
  const filesOnDisk = getFilesOnDisk();
  console.log(`\n📁 Files on disk: ${filesOnDisk.length}`);

  const clinics = await prisma.clinic.findMany({
    select: {
      id: true,
      name: true,
      clinicLogoUrl: true,
      clinicCoverImageUrl: true,
      licenseDocumentUrl: true,
      clinicLicenseDocument: true,
      medicalEstablishmentCertificateUrl: true,
      gstCertificateUrl: true,
      panCardUrl: true,
    },
  });

  console.log(`🏥 Clinics to check: ${clinics.length}\n`);

  let fixed = 0;
  let skipped = 0;
  let notFound = 0;

  for (const clinic of clinics) {
    const fields = [
      'clinicLogoUrl',
      'clinicCoverImageUrl',
      'licenseDocumentUrl',
      'clinicLicenseDocument',
      'medicalEstablishmentCertificateUrl',
      'gstCertificateUrl',
      'panCardUrl',
    ];

    const updates = {};
    let needsUpdate = false;

    for (const field of fields) {
      const storedUrl = clinic[field];
      if (!storedUrl) continue;

      const storedFilename = storedUrl.split('/').pop();

      // Check if file exists
      if (filesOnDisk.includes(storedFilename)) {
        // File exists — but make sure URL format is correct
        const correctUrl = buildUrl(storedFilename);
        if (storedUrl !== correctUrl) {
          updates[field] = correctUrl;
          needsUpdate = true;
          console.log(`  ✏️  ${clinic.name} [${field}]: URL format fixed`);
        }
        continue;
      }

      // File missing — try to find a match
      const match = findBestMatch(storedUrl, filesOnDisk);
      if (match) {
        updates[field] = buildUrl(match);
        needsUpdate = true;
        console.log(`  🔧 ${clinic.name} [${field}]:`);
        console.log(`     OLD: ${storedFilename}`);
        console.log(`     NEW: ${match}`);
      } else {
        console.log(`  ❌ ${clinic.name} [${field}]: no match found for ${storedFilename}`);
        notFound++;
      }
    }

    if (needsUpdate) {
      await prisma.clinic.update({
        where: { id: clinic.id },
        data: updates,
      });
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Fixed:     ${fixed} clinics`);
  console.log(`   Skipped:   ${skipped} clinics (already correct)`);
  console.log(`   Not found: ${notFound} fields with no matching file`);
}

fixClinicUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
