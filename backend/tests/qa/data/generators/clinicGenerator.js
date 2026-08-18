/**
 * Clinic Test Data Generator
 * Generates 20 unique clinic test records
 */

const config = require('../../config/test.config');

class ClinicGenerator {
  constructor() {
    this.clinics = [];
  }

  /**
   * Generate complete clinic data
   */
  generate() {
    const { totalClinics } = config.scale;
    const { clinic: pattern } = config.patterns;

    for (let i = 1; i <= totalClinics; i++) {
      const clinicNumber = String(i).padStart(3, '0');
      const cityIndex = (i - 1) % pattern.cities.length;
      const stateIndex = (i - 1) % pattern.states.length;

      const clinic = {
        // Identifiers
        testId: `CLINIC-${clinicNumber}`,
        clinicNumber: i,

        // Basic Information
        name: `${pattern.namePrefix} ${clinicNumber}`,
        email: `clinic${clinicNumber}@${pattern.emailDomain}`,
        mobile: `${pattern.mobilePrefix}${String(i).padStart(5, '0')}`,
        
        // Owner Information
        ownerName: `${pattern.ownerNamePrefix} ${clinicNumber}`,
        
        // Password (for testing)
        password: 'Test@123',
        
        // Location
        address: `${i} Medical Street, Test Area`,
        city: pattern.cities[cityIndex],
        state: pattern.states[stateIndex],
        pincode: `40000${String(i).padStart(2, '0')}`,
        
        // Contact
        phone: `022-2400${String(i).padStart(4, '0')}`,
        
        // Timing
        openingTime: '09:00',
        closingTime: '21:00',
        
        // Features
        facilities: [
          'Pharmacy',
          'Lab',
          'X-Ray',
          'Emergency Care',
        ],
        
        // Registration Details
        registrationNumber: `CLINIC-REG-${clinicNumber}`,
        establishedYear: 2000 + i,
        
        // Status Tracking
        status: 'PENDING',
        approvalStatus: 'PENDING',
        isPhoneVerified: false,
        isEmailVerified: false,
        
        // Metadata
        createdAt: null,
        updatedAt: null,
        approvedAt: null,
      };

      this.clinics.push(clinic);
    }

    return this.clinics;
  }

  /**
   * Get clinic by test ID
   */
  getByTestId(testId) {
    return this.clinics.find(c => c.testId === testId);
  }

  /**
   * Get clinic by number
   */
  getByNumber(number) {
    return this.clinics.find(c => c.clinicNumber === number);
  }

  /**
   * Get all clinics
   */
  getAll() {
    return this.clinics;
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return JSON.stringify(this.clinics, null, 2);
  }

  /**
   * Save to file
   */
  saveToFile(filepath) {
    const fs = require('fs');
    const path = require('path');
    
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, this.toJSON());
    console.log(`✓ Generated ${this.clinics.length} clinics → ${filepath}`);
  }

  /**
   * Load from file
   */
  loadFromFile(filepath) {
    const fs = require('fs');
    
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf8');
      this.clinics = JSON.parse(data);
      console.log(`✓ Loaded ${this.clinics.length} clinics from ${filepath}`);
      return this.clinics;
    }
    
    throw new Error(`File not found: ${filepath}`);
  }
}

// CLI Usage
if (require.main === module) {
  const generator = new ClinicGenerator();
  const clinics = generator.generate();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('CLINIC TEST DATA GENERATOR');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`Total Clinics Generated: ${clinics.length}\n`);
  
  console.log('Sample Clinics:');
  console.log('───────────────────────────────────────────────────────');
  clinics.slice(0, 3).forEach(clinic => {
    console.log(`${clinic.testId}: ${clinic.name}`);
    console.log(`  Email: ${clinic.email}`);
    console.log(`  Mobile: ${clinic.mobile}`);
    console.log(`  Owner: ${clinic.ownerName}`);
    console.log(`  Location: ${clinic.city}, ${clinic.state}`);
    console.log('');
  });
  
  console.log('...\n');
  
  // Save to file
  const outputPath = './tests/qa/data/fixtures/clinics.json';
  generator.saveToFile(outputPath);
  
  console.log('\n✓ Clinic data generation complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

module.exports = ClinicGenerator;
