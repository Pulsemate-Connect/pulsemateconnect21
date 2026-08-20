/**
 * Doctor Test Data Generator
 * Generates 500 unique doctor test records (25 per clinic)
 */

const config = require('../../config/test.config');

class DoctorGenerator {
  constructor() {
    this.doctors = [];
    this.usedRegistrationNumbers = new Set();
  }

  /**
   * Generate unique registration number
   */
  generateRegistrationNumber(doctorIndex) {
    const { registrationPrefix } = config.patterns.doctor;
    let regNumber;
    let attempts = 0;
    
    do {
      regNumber = `${registrationPrefix}-${String(doctorIndex).padStart(5, '0')}`;
      attempts++;
      
      if (attempts > 10) {
        // Fallback with random suffix
        regNumber = `${registrationPrefix}-${doctorIndex}-${Math.floor(Math.random() * 1000)}`;
      }
    } while (this.usedRegistrationNumbers.has(regNumber));
    
    this.usedRegistrationNumbers.add(regNumber);
    return regNumber;
  }

  /**
   * Generate date of birth (21-65 years old)
   */
  generateDOB(index) {
    const currentYear = new Date().getFullYear();
    const age = 21 + (index % 44); // 21-65 years
    const birthYear = currentYear - age;
    const month = String((index % 12) + 1).padStart(2, '0');
    const day = String((index % 28) + 1).padStart(2, '0');
    
    return `${birthYear}-${month}-${day}`;
  }

  /**
   * Calculate experience years from DOB and registration year
   */
  calculateExperience(dob, registrationYear) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - new Date(dob).getFullYear();
    const maxExperience = Math.min(age - 21, currentYear - registrationYear);
    
    return Math.max(1, Math.min(maxExperience, 40));
  }

  /**
   * Generate complete doctor data for all clinics
   */
  generate() {
    const { totalClinics, doctorsPerClinic } = config.scale;
    const { doctor: pattern } = config.patterns;
    
    let globalDoctorIndex = 1;

    for (let clinicNum = 1; clinicNum <= totalClinics; clinicNum++) {
      const clinicId = `CLINIC-${String(clinicNum).padStart(3, '0')}`;
      
      for (let doctorNum = 1; doctorNum <= doctorsPerClinic; doctorNum++) {
        const doctorNumber = String(doctorNum).padStart(3, '0');
        const mobileNumber = `${pattern.mobilePrefix}${String(globalDoctorIndex).padStart(5, '0')}`;
        
        // Vary specialization, medical system, etc.
        const specializationIndex = (globalDoctorIndex - 1) % pattern.specializations.length;
        const medicalSystemIndex = (globalDoctorIndex - 1) % pattern.medicalSystems.length;
        const authorityIndex = (globalDoctorIndex - 1) % pattern.registrationAuthorities.length;
        const qualificationIndex = (globalDoctorIndex - 1) % pattern.qualifications.length;
        
        const gender = globalDoctorIndex % 3 === 0 ? 'Male' : globalDoctorIndex % 3 === 1 ? 'Female' : 'Other';
        const dob = this.generateDOB(globalDoctorIndex);
        const registrationYear = 2000 + (globalDoctorIndex % 24); // 2000-2023
        const experience = this.calculateExperience(dob, registrationYear);
        
        const doctor = {
          // Identifiers
          testId: `${clinicId}-DOCTOR-${doctorNumber}`,
          clinicTestId: clinicId,
          clinicNumber: clinicNum,
          doctorNumber: doctorNum,
          globalIndex: globalDoctorIndex,

          // Basic Information
          fullLegalName: `${pattern.namePrefix} ${clinicNum}-${doctorNumber}`,
          email: `clinic${String(clinicNum).padStart(3, '0')}.doctor${doctorNumber}@${pattern.emailDomain}`,
          mobile: mobileNumber,
          
          // Personal Information
          dateOfBirth: dob,
          gender: gender,
          
          // Professional Information
          medicalSystem: pattern.medicalSystems[medicalSystemIndex],
          qualification: pattern.qualifications[qualificationIndex],
          specialization: pattern.specializations[specializationIndex],
          medicalRegistrationNumber: this.generateRegistrationNumber(globalDoctorIndex),
          registrationAuthority: pattern.registrationAuthorities[authorityIndex],
          registrationYear: registrationYear,
          experienceYears: experience,
          
          // Optional Professional Details
          languagesKnown: this.generateLanguages(globalDoctorIndex),
          bio: this.generateBio(globalDoctorIndex, experience, pattern.specializations[specializationIndex]),
          consultationFee: this.generateConsultationFee(globalDoctorIndex, experience),
          avgConsultationMins: [10, 15, 20, 30][globalDoctorIndex % 4],
          areasOfExpertise: this.generateExpertise(pattern.specializations[specializationIndex]),
          onlineAvailable: globalDoctorIndex % 3 === 0,
          offlineAvailable: true,
          
          // Documents (will be uploaded during test)
          documents: {
            degreeCertificate: null,
            registrationCertificate: null,
            experienceCertificate: null,
            idProof: null,
          },
          
          // Status Tracking
          invitationStatus: 'NOT_INVITED',
          onboardingStatus: 'NOT_STARTED',
          verificationStatus: 'NOT_VERIFIED',
          approvalStatus: 'PENDING',
          
          // Timestamps
          invitedAt: null,
          acceptedAt: null,
          onboardedAt: null,
          approvedAt: null,
          createdAt: null,
          updatedAt: null,
        };

        this.doctors.push(doctor);
        globalDoctorIndex++;
      }
    }

    return this.doctors;
  }

  /**
   * Generate languages based on index
   */
  generateLanguages(index) {
    const allLanguages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'];
    const numLanguages = 2 + (index % 3); // 2-4 languages
    const languages = [];
    
    for (let i = 0; i < numLanguages; i++) {
      languages.push(allLanguages[(index + i) % allLanguages.length]);
    }
    
    return languages;
  }

  /**
   * Generate professional bio
   */
  generateBio(index, experience, specialization) {
    const bios = [
      `Experienced ${specialization} specialist with ${experience}+ years of clinical practice. Dedicated to providing comprehensive patient care.`,
      `${experience} years of expertise in ${specialization}. Committed to evidence-based medicine and patient-centered care.`,
      `Board-certified ${specialization} physician with extensive experience in diagnosis and treatment.`,
      `Passionate about ${specialization} with a focus on innovative treatment approaches and patient education.`,
    ];
    
    return bios[index % bios.length];
  }

  /**
   * Generate consultation fee based on experience
   */
  generateConsultationFee(index, experience) {
    const { min, max } = config.patterns.doctor.consultationFeeRange;
    const baseByExperience = min + (experience * 50);
    const variation = (index % 10) * 50;
    
    return Math.min(max, baseByExperience + variation);
  }

  /**
   * Generate areas of expertise
   */
  generateExpertise(specialization) {
    const expertiseMap = {
      'Cardiology': ['Angioplasty', 'ECG', 'Echocardiography', 'Cardiac Rehabilitation'],
      'Dermatology': ['Acne Treatment', 'Skin Cancer Screening', 'Cosmetic Procedures', 'Laser Therapy'],
      'Orthopedics': ['Joint Replacement', 'Sports Medicine', 'Fracture Management', 'Arthroscopy'],
      'Pediatrics': ['Child Development', 'Vaccinations', 'Pediatric Nutrition', 'Infectious Diseases'],
      'Gynecology': ['Prenatal Care', 'OBGYN Procedures', 'Family Planning', 'Menopause Management'],
      'Neurology': ['Stroke Management', 'Epilepsy', 'Migraine Treatment', 'Neuromuscular Disorders'],
      'Gastroenterology': ['Endoscopy', 'IBS Treatment', 'Liver Diseases', 'Colonoscopy'],
      'ENT': ['Ear Infections', 'Sinus Surgery', 'Hearing Tests', 'Throat Disorders'],
      'Ophthalmology': ['Cataract Surgery', 'LASIK', 'Glaucoma Treatment', 'Retina Care'],
      'Psychiatry': ['Cognitive Therapy', 'Anxiety Management', 'Depression Treatment', 'Counseling'],
    };
    
    return expertiseMap[specialization] || ['General Practice', 'Patient Care', 'Diagnosis'];
  }

  /**
   * Get doctors by clinic test ID
   */
  getByClinicTestId(clinicTestId) {
    return this.doctors.filter(d => d.clinicTestId === clinicTestId);
  }

  /**
   * Get doctor by test ID
   */
  getByTestId(testId) {
    return this.doctors.find(d => d.testId === testId);
  }

  /**
   * Get all doctors
   */
  getAll() {
    return this.doctors;
  }

  /**
   * Get doctor by global index
   */
  getByGlobalIndex(index) {
    return this.doctors.find(d => d.globalIndex === index);
  }

  /**
   * Export to JSON
   */
  toJSON() {
    return JSON.stringify(this.doctors, null, 2);
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
    console.log(`✓ Generated ${this.doctors.length} doctors → ${filepath}`);
  }

  /**
   * Load from file
   */
  loadFromFile(filepath) {
    const fs = require('fs');
    
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf8');
      this.doctors = JSON.parse(data);
      
      // Rebuild used registration numbers
      this.doctors.forEach(doctor => {
        this.usedRegistrationNumbers.add(doctor.medicalRegistrationNumber);
      });
      
      console.log(`✓ Loaded ${this.doctors.length} doctors from ${filepath}`);
      return this.doctors;
    }
    
    throw new Error(`File not found: ${filepath}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      total: this.doctors.length,
      byClinic: {},
      bySpecialization: {},
      byMedicalSystem: {},
      byGender: {},
      avgExperience: 0,
      avgConsultationFee: 0,
    };

    this.doctors.forEach(doctor => {
      // By clinic
      stats.byClinic[doctor.clinicTestId] = (stats.byClinic[doctor.clinicTestId] || 0) + 1;
      
      // By specialization
      stats.bySpecialization[doctor.specialization] = (stats.bySpecialization[doctor.specialization] || 0) + 1;
      
      // By medical system
      stats.byMedicalSystem[doctor.medicalSystem] = (stats.byMedicalSystem[doctor.medicalSystem] || 0) + 1;
      
      // By gender
      stats.byGender[doctor.gender] = (stats.byGender[doctor.gender] || 0) + 1;
      
      // Experience
      stats.avgExperience += doctor.experienceYears;
      
      // Consultation fee
      stats.avgConsultationFee += doctor.consultationFee;
    });

    stats.avgExperience = Math.round(stats.avgExperience / this.doctors.length);
    stats.avgConsultationFee = Math.round(stats.avgConsultationFee / this.doctors.length);

    return stats;
  }
}

// CLI Usage
if (require.main === module) {
  const generator = new DoctorGenerator();
  const doctors = generator.generate();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('DOCTOR TEST DATA GENERATOR');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log(`Total Doctors Generated: ${doctors.length}\n`);
  
  console.log('Sample Doctors (Clinic 001):');
  console.log('───────────────────────────────────────────────────────');
  const clinic001Doctors = generator.getByClinicTestId('CLINIC-001').slice(0, 3);
  clinic001Doctors.forEach(doctor => {
    console.log(`${doctor.testId}: ${doctor.fullLegalName}`);
    console.log(`  Email: ${doctor.email}`);
    console.log(`  Mobile: ${doctor.mobile}`);
    console.log(`  Specialization: ${doctor.specialization}`);
    console.log(`  Experience: ${doctor.experienceYears} years`);
    console.log(`  Registration: ${doctor.medicalRegistrationNumber}`);
    console.log('');
  });
  
  console.log('...\n');
  
  // Statistics
  const stats = generator.getStats();
  console.log('Statistics:');
  console.log('───────────────────────────────────────────────────────');
  console.log(`Total Doctors: ${stats.total}`);
  console.log(`Doctors per Clinic: ${stats.byClinic['CLINIC-001'] || 0}`);
  console.log(`Average Experience: ${stats.avgExperience} years`);
  console.log(`Average Consultation Fee: ₹${stats.avgConsultationFee}`);
  console.log(`\nBy Specialization:`);
  Object.entries(stats.bySpecialization).forEach(([spec, count]) => {
    console.log(`  ${spec}: ${count}`);
  });
  console.log(`\nBy Gender:`);
  Object.entries(stats.byGender).forEach(([gender, count]) => {
    console.log(`  ${gender}: ${count}`);
  });
  console.log('');
  
  // Save to file
  const outputPath = './tests/qa/data/fixtures/doctors.json';
  generator.saveToFile(outputPath);
  
  console.log('\n✓ Doctor data generation complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

module.exports = DoctorGenerator;
