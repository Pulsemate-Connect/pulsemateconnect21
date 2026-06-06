/**
 * seed-clinics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds dummy clinic owners + clinics for admin approval testing.
 * Safe to run multiple times — skips existing owners by email / mobile.
 *
 * Run:  node prisma/seed-clinics.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── Schedule helpers ─────────────────────────────────────────────────────────
const weekdays = (open, close, bs = '', be = '') =>
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => ({
    day, enabled: true, openingTime: open, closingTime: close, breakStart: bs, breakEnd: be,
  }));

const allDays = (open, close, bs = '', be = '') =>
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({
    day, enabled: true, openingTime: open, closingTime: close, breakStart: bs, breakEnd: be,
  }));

const withSaturday = (open, close, satOpen, satClose, bs = '', be = '') => [
  ...weekdays(open, close, bs, be),
  { day: 'Saturday', enabled: true, openingTime: satOpen, closingTime: satClose, breakStart: '', breakEnd: '' },
  { day: 'Sunday', enabled: false, openingTime: '09:00', closingTime: '13:00', breakStart: '', breakEnd: '' },
];

const withWeekend = (open, close, satOpen, satClose, sunOpen, sunClose, bs = '', be = '') => [
  ...weekdays(open, close, bs, be),
  { day: 'Saturday', enabled: true, openingTime: satOpen, closingTime: satClose, breakStart: '', breakEnd: '' },
  { day: 'Sunday', enabled: true, openingTime: sunOpen, closingTime: sunClose, breakStart: '', breakEnd: '' },
];

// ── Dummy document paths ─────────────────────────────────────────────────────
const DOCS = {
  license: '/uploads/clinic-owner/seed-license-doc.pdf',
  medCert: '/uploads/clinic-owner/seed-medical-establishment-cert.pdf',
  gstCert: '/uploads/clinic-owner/seed-gst-certificate.pdf',
  panCard: '/uploads/clinic-owner/seed-pan-card.pdf',
  logo: '/uploads/clinic-owner/seed-clinic-logo.png',
  cover: '/uploads/clinic-owner/seed-clinic-cover.png',
};

// ── Clinic definitions ────────────────────────────────────────────────────────
const CLINICS = [

  // ────────────────────────────────────────────────────────────────────────────
  //  BATCH 1 — original 5 (kept so the file is idempotent on fresh DBs)
  // ────────────────────────────────────────────────────────────────────────────
  {
    owner: { name: 'Rahul Sharma', mobile: '+919100000001', email: 'rahul.sharma@seedclinic.com' },
    clinic: {
      name: 'Sunrise Multispecialty Clinic', clinicType: 'Multi-specialty Clinic',
      description: 'A comprehensive multispecialty clinic offering cardiology, orthopedics, dermatology, and general medicine under one roof.',
      phone: '+918000000101', address: '42, 5th Block, Koramangala', landmark: 'Near Sony Signal',
      city: 'Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban', pincode: '560095',
      googleMapsLocation: 'https://maps.google.com/?q=Koramangala+Bengaluru',
      latitude: 12.9352, longitude: 77.6245,
      emergencyContactNumber: '+918000000100', alternateEmail: 'info@sunriseclinic.com',
      specialties: ['Cardiology', 'Orthopedics', 'Dermatology', 'General Medicine'], doctorCount: 6,
      clinicRegistrationNumber: 'KAR-CLN-2024-0001', gstNumber: '29ABCDE1234F1Z5', panNumber: 'ABCDE1234F',
      consultationModes: ['OFFLINE', 'VIDEO'],
      weeklySchedule: withSaturday('08:30', '20:00', '09:00', '15:00', '13:00', '14:00'),
      openingHours: 'Mon-Fri 08:30-20:00, Sat 09:00-15:00',
      avgConsultationMinutes: 15, appointmentSlotMinutes: 15, dailyPatientCapacity: 80,
      facilities: ['Parking', 'Wheelchair Access', 'Pharmacy', 'Laboratory', 'AC Waiting Area', 'Drinking Water', 'CCTV Security', 'Lift Access'],
      languagesSpoken: ['English', 'Hindi', 'Kannada'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Insurance'],
      insuranceSupported: ['Star Health', 'ICICI Lombard', 'HDFC Ergo'],
      approvalStatus: 'PENDING', isVerified: false, isActive: false,
      submittedAt: new Date('2026-05-20T10:00:00Z'),
    },
  },
  {
    owner: { name: 'Priya Nair', mobile: '+919100000002', email: 'priya.nair@seedclinic.com' },
    clinic: {
      name: 'CarePoint Dental Studio', clinicType: 'Dental Clinic',
      description: 'A modern dental studio specialising in orthodontics, cosmetic dentistry, and oral surgery.',
      phone: '+918000000102', address: 'MG Road, Ernakulam', landmark: 'Above SBI Bank',
      city: 'Kochi', state: 'Kerala', district: 'Ernakulam', pincode: '682001',
      googleMapsLocation: 'https://maps.google.com/?q=MG+Road+Kochi',
      latitude: 9.9312, longitude: 76.2673,
      emergencyContactNumber: '+918000000102', alternateEmail: 'dental@carepoint.com',
      specialties: ['Dentistry', 'Orthodontics', 'Oral Surgery', 'Endodontics'], doctorCount: 3,
      clinicRegistrationNumber: 'KER-CLN-2024-0022', gstNumber: '32FGHIJ5678K2L6', panNumber: 'FGHIJ5678K',
      consultationModes: ['OFFLINE'],
      weeklySchedule: withSaturday('09:00', '19:00', '09:00', '14:00'),
      openingHours: 'Mon-Fri 09:00-19:00, Sat 09:00-14:00',
      avgConsultationMinutes: 20, appointmentSlotMinutes: 20, dailyPatientCapacity: 40,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Child Friendly Area', 'Online Payment'],
      languagesSpoken: ['English', 'Malayalam', 'Hindi'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card'],
      insuranceSupported: ['Star Health', 'Care Health'],
      approvalStatus: 'PENDING', isVerified: false, isActive: false,
      submittedAt: new Date('2026-05-22T08:30:00Z'),
    },
  },
  {
    owner: { name: 'Amit Verma', mobile: '+919100000003', email: 'amit.verma@seedclinic.com' },
    clinic: {
      name: 'NewLife Pediatrics', clinicType: 'Individual Clinic',
      description: 'Dedicated pediatric clinic providing comprehensive child healthcare from newborns to adolescents.',
      phone: '+918000000103', address: 'FC Road, Shivajinagar', landmark: 'Next to Deccan College Gate',
      city: 'Pune', state: 'Maharashtra', district: 'Pune', pincode: '411005',
      googleMapsLocation: 'https://maps.google.com/?q=FC+Road+Pune',
      latitude: 18.5204, longitude: 73.8567,
      emergencyContactNumber: '+918000000103', alternateEmail: 'newlife.pediatrics@gmail.com',
      specialties: ['Pediatrics', 'General Medicine'], doctorCount: 2,
      clinicRegistrationNumber: 'MH-CLN-2023-0145', gstNumber: '27KLMNO9012P3Q7', panNumber: 'KLMNO9012P',
      consultationModes: ['OFFLINE', 'VIDEO', 'ONLINE'],
      weeklySchedule: withSaturday('09:00', '19:00', '10:00', '14:00', '13:30', '14:30'),
      openingHours: 'Mon-Fri 09:00-19:00, Sat 10:00-14:00',
      avgConsultationMinutes: 15, appointmentSlotMinutes: 15, dailyPatientCapacity: 50,
      facilities: ['Parking', 'Wheelchair Access', 'AC Waiting Area', 'Drinking Water', 'Child Friendly Area', 'Online Payment', 'WiFi'],
      languagesSpoken: ['English', 'Hindi', 'Marathi'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Insurance', 'Net Banking'],
      insuranceSupported: ['Star Health', 'Niva Bupa', 'Aditya Birla'],
      approvalStatus: 'VERIFIED', isVerified: true, isActive: true,
      submittedAt: new Date('2026-03-10T09:00:00Z'), verifiedAt: new Date('2026-03-13T11:00:00Z'),
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'VERIFIED', remark: 'All documents verified. Clinic meets PulseMate standards.' },
  },
  {
    owner: { name: 'Sandeep Iyer', mobile: '+919100000004', email: 'sandeep.iyer@seedclinic.com' },
    clinic: {
      name: 'Metro Care Diagnostics', clinicType: 'Diagnostic Center',
      description: 'Full-service diagnostic centre offering pathology, radiology, and imaging services.',
      phone: '+918000000104', address: 'Banjara Hills, Road No. 12', landmark: 'Near Yashoda Hospital',
      city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad', pincode: '500034',
      googleMapsLocation: 'https://maps.google.com/?q=Banjara+Hills+Hyderabad',
      latitude: 17.4126, longitude: 78.4071,
      emergencyContactNumber: '+918000000104', alternateEmail: 'metro.diagnostics@mail.com',
      specialties: ['Pathology', 'Radiology', 'Imaging', 'Laboratory Medicine'], doctorCount: 4,
      clinicRegistrationNumber: 'TS-CLN-2024-0087', gstNumber: '', panNumber: 'RSTUV3456W',
      consultationModes: ['OFFLINE', 'HOME_VISIT'],
      weeklySchedule: allDays('07:00', '21:00', '13:00', '14:00'),
      openingHours: 'All days 07:00-21:00',
      avgConsultationMinutes: 10, appointmentSlotMinutes: 10, dailyPatientCapacity: 120,
      facilities: ['Parking', 'Wheelchair Access', 'AC Waiting Area', 'Drinking Water', 'Online Payment', 'CCTV Security', 'Lift Access'],
      languagesSpoken: ['English', 'Hindi', 'Telugu'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Net Banking'],
      insuranceSupported: ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'Niva Bupa'],
      approvalStatus: 'CHANGES_REQUIRED', isVerified: false, isActive: false,
      submittedAt: new Date('2026-05-01T10:00:00Z'),
      changesRequestedReason: 'Please provide a valid GST number and re-upload a clearer copy of the clinic registration certificate. The uploaded document is blurry and cannot be verified.',
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'CHANGES_REQUIRED', remark: 'GST number missing. Registration certificate image is unclear.' },
  },
  {
    owner: { name: 'Neha Joshi', mobile: '+919100000005', email: 'neha.joshi@seedclinic.com' },
    clinic: {
      name: 'Harmony Physiotherapy Center', clinicType: 'Physiotherapy Center',
      description: 'Specialised physiotherapy centre offering sports rehabilitation, post-surgical recovery, and pain management.',
      phone: '+918000000105', address: 'CG Road, Navrangpura', landmark: 'Above Cafe Coffee Day',
      city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad', pincode: '380009',
      googleMapsLocation: 'https://maps.google.com/?q=CG+Road+Ahmedabad',
      latitude: 23.0395, longitude: 72.5686,
      emergencyContactNumber: '+918000000105', alternateEmail: 'harmony.physio@gmail.com',
      specialties: ['Physiotherapy', 'Sports Rehabilitation', 'Pain Management'], doctorCount: 2,
      clinicRegistrationNumber: 'GJ-CLN-2024-0033', gstNumber: '24VWXYZ7890A4B8', panNumber: 'VWXYZ7890A',
      consultationModes: ['OFFLINE', 'HOME_VISIT'],
      weeklySchedule: withSaturday('08:00', '20:00', '09:00', '14:00', '13:00', '14:00'),
      openingHours: 'Mon-Fri 08:00-20:00, Sat 09:00-14:00',
      avgConsultationMinutes: 30, appointmentSlotMinutes: 30, dailyPatientCapacity: 30,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Wheelchair Access'],
      languagesSpoken: ['English', 'Hindi', 'Gujarati'],
      paymentMethods: ['Cash', 'UPI'], insuranceSupported: [],
      approvalStatus: 'REJECTED', isVerified: false, isActive: false,
      submittedAt: new Date('2026-04-15T09:00:00Z'),
      rejectionReason: 'The submitted medical establishment certificate is expired (valid until 2023). Please renew the certificate and resubmit the application with a valid, government-issued document.',
      rejectedAt: new Date('2026-04-18T14:00:00Z'),
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'REJECTED', remark: 'Medical establishment certificate expired. Owner must renew and resubmit.' },
  },

  // ────────────────────────────────────────────────────────────────────────────
  //  BATCH 2 — 5 new clinics
  // ────────────────────────────────────────────────────────────────────────────

  // 6. UNDER_REVIEW — Eye Clinic, Chennai
  {
    owner: { name: 'Kavitha Rajan', mobile: '+919100000006', email: 'kavitha.rajan@seedclinic.com' },
    clinic: {
      name: 'VisionFirst Eye Care Centre', clinicType: 'Eye Clinic',
      description: 'Advanced eye care clinic offering cataract surgery, glaucoma management, retinal treatments, and LASIK vision correction. Equipped with digital slit-lamp and OCT imaging.',
      phone: '+918000000106', address: '18, Anna Salai, Teynampet', landmark: 'Opposite Spencer Plaza',
      city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', pincode: '600018',
      googleMapsLocation: 'https://maps.google.com/?q=Anna+Salai+Chennai',
      latitude: 13.0543, longitude: 80.2522,
      emergencyContactNumber: '+918000000106', alternateEmail: 'info@visionfirst.in',
      specialties: ['Ophthalmology', 'Optometry'], doctorCount: 4,
      clinicRegistrationNumber: 'TN-CLN-2024-0056', gstNumber: '33PQRST2345U5V9', panNumber: 'PQRST2345U',
      consultationModes: ['OFFLINE', 'VIDEO'],
      weeklySchedule: withSaturday('09:00', '18:00', '09:00', '13:00', '13:00', '14:00'),
      openingHours: 'Mon-Fri 09:00-18:00, Sat 09:00-13:00',
      avgConsultationMinutes: 20, appointmentSlotMinutes: 20, dailyPatientCapacity: 60,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Wheelchair Access', 'Online Payment', 'CCTV Security', 'Lift Access'],
      languagesSpoken: ['English', 'Tamil', 'Hindi'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Insurance'],
      insuranceSupported: ['Star Health', 'HDFC Ergo', 'Care Health'],
      approvalStatus: 'UNDER_REVIEW', isVerified: false, isActive: false,
      submittedAt: new Date('2026-06-01T09:00:00Z'),
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'UNDER_REVIEW', remark: 'Documents received. Under detailed review by compliance team.' },
  },

  // 7. SUSPENDED — Hospital, Mumbai
  {
    owner: { name: 'Devraj Mehta', mobile: '+919100000007', email: 'devraj.mehta@seedclinic.com' },
    clinic: {
      name: 'Shree Balaji Hospital & Research Centre', clinicType: 'Hospital',
      description: 'A 50-bed multi-disciplinary hospital providing surgical, medical, and emergency care with ICU, OT, and advanced imaging facilities.',
      phone: '+918000000107', address: '205, Linking Road, Bandra West', landmark: 'Near Bandra Station',
      city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai Suburban', pincode: '400050',
      googleMapsLocation: 'https://maps.google.com/?q=Bandra+West+Mumbai',
      latitude: 19.0596, longitude: 72.8295,
      emergencyContactNumber: '+918000000107', alternateEmail: 'admin@balajihospital.in',
      specialties: ['General Medicine', 'Cardiology', 'Orthopedics', 'Gynecology', 'Dentistry'], doctorCount: 12,
      clinicRegistrationNumber: 'MH-CLN-2023-0071', gstNumber: '27UVWXY6789Z6A0', panNumber: 'UVWXY6789Z',
      consultationModes: ['OFFLINE', 'VIDEO'],
      weeklySchedule: allDays('00:00', '23:59'),
      openingHours: '24 hours, all days',
      avgConsultationMinutes: 15, appointmentSlotMinutes: 15, dailyPatientCapacity: 200,
      facilities: ['Parking', 'Wheelchair Access', 'Pharmacy', 'Laboratory', 'AC Waiting Area', 'Drinking Water', 'Emergency Care', 'CCTV Security', 'Lift Access', 'WiFi'],
      languagesSpoken: ['English', 'Hindi', 'Marathi', 'Gujarati'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Insurance', 'Net Banking'],
      insuranceSupported: ['Star Health', 'Niva Bupa', 'ICICI Lombard', 'HDFC Ergo', 'Aditya Birla'],
      approvalStatus: 'SUSPENDED', isVerified: false, isActive: false,
      submittedAt: new Date('2026-02-10T08:00:00Z'),
      verifiedAt: new Date('2026-02-15T11:00:00Z'),
      suspendedReason: 'Multiple patient complaints regarding overcharging and non-compliance with fee transparency guidelines. Clinic suspended pending investigation. Owner must respond to the notice issued on 2026-05-28 before reinstatement.',
    },
    verificationLog: { oldStatus: 'VERIFIED', newStatus: 'SUSPENDED', remark: 'Suspended due to patient overcharging complaints and non-compliance.' },
  },

  // 8. PENDING — Ayurvedic, Jaipur
  {
    owner: { name: 'Suresh Pandey', mobile: '+919100000008', email: 'suresh.pandey@seedclinic.com' },
    clinic: {
      name: 'Arogya Ayurvedic Wellness Clinic', clinicType: 'Other',
      clinicTypeOther: 'Ayurvedic Clinic',
      description: 'Traditional Ayurvedic clinic offering Panchakarma treatments, herbal therapies, and holistic wellness programmes integrating classical Ayurveda with modern diagnostics.',
      phone: '+918000000108', address: 'MI Road, Panch Batti', landmark: 'Near Gaurav Tower',
      city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur', pincode: '302001',
      googleMapsLocation: 'https://maps.google.com/?q=MI+Road+Jaipur',
      latitude: 26.9124, longitude: 75.7873,
      emergencyContactNumber: '+918000000108', alternateEmail: 'arogya.ayurveda@mail.com',
      specialties: ['Specialty Care', 'General Medicine'], doctorCount: 3,
      clinicRegistrationNumber: 'RJ-CLN-2024-0019', gstNumber: '08BCDEF3456G7H1', panNumber: 'BCDEF3456G',
      consultationModes: ['OFFLINE', 'HOME_VISIT'],
      weeklySchedule: withSaturday('07:00', '12:00', '16:00', '20:00'),
      openingHours: 'Mon-Sat 07:00-12:00 and 16:00-20:00',
      avgConsultationMinutes: 30, appointmentSlotMinutes: 30, dailyPatientCapacity: 40,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Wheelchair Access'],
      languagesSpoken: ['Hindi', 'English'],
      paymentMethods: ['Cash', 'UPI'], insuranceSupported: [],
      approvalStatus: 'PENDING', isVerified: false, isActive: false,
      submittedAt: new Date('2026-06-02T11:00:00Z'),
    },
  },

  // 9. VERIFIED — Skin Clinic, Chandigarh
  {
    owner: { name: 'Ananya Kapoor', mobile: '+919100000009', email: 'ananya.kapoor@seedclinic.com' },
    clinic: {
      name: 'GlowMed Skin & Cosmetology Clinic', clinicType: 'Skin & Cosmetology',
      description: 'Premium dermatology and cosmetology clinic offering acne treatment, laser therapy, hair transplant consultations, anti-ageing treatments, and chemical peels.',
      phone: '+918000000109', address: 'Sector 17, City Centre', landmark: 'Near PNB Bank',
      city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh', pincode: '160017',
      googleMapsLocation: 'https://maps.google.com/?q=Sector+17+Chandigarh',
      latitude: 30.7400, longitude: 76.7780,
      emergencyContactNumber: '+918000000109', alternateEmail: 'glowmed@clinic.com',
      specialties: ['Dermatology', 'General Medicine'], doctorCount: 3,
      clinicRegistrationNumber: 'CH-CLN-2023-0008', gstNumber: '04GHIJK4567L8M2', panNumber: 'GHIJK4567L',
      consultationModes: ['OFFLINE', 'VIDEO', 'ONLINE'],
      weeklySchedule: withWeekend('10:00', '19:00', '10:00', '17:00', '11:00', '15:00', '13:30', '14:30'),
      openingHours: 'Mon-Fri 10:00-19:00, Sat 10:00-17:00, Sun 11:00-15:00',
      avgConsultationMinutes: 20, appointmentSlotMinutes: 20, dailyPatientCapacity: 45,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Online Payment', 'WiFi', 'CCTV Security'],
      languagesSpoken: ['English', 'Hindi', 'Punjabi'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card', 'Net Banking'],
      insuranceSupported: ['Star Health', 'Care Health'],
      approvalStatus: 'VERIFIED', isVerified: true, isActive: true,
      submittedAt: new Date('2026-04-05T10:00:00Z'),
      verifiedAt: new Date('2026-04-09T16:00:00Z'),
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'VERIFIED', remark: 'Complete documentation. Infrastructure meets standards. Approved.' },
  },

  // 10. REJECTED — Orthopedic, Lucknow
  {
    owner: { name: 'Vikram Singh', mobile: '+919100000010', email: 'vikram.singh@seedclinic.com' },
    clinic: {
      name: 'OrthoPlus Joint & Spine Clinic', clinicType: 'Individual Clinic',
      description: 'Dedicated orthopedic clinic focusing on joint replacements, spine disorders, sports injuries, and fracture management. Equipped with digital X-ray and physiotherapy unit.',
      phone: '+918000000110', address: 'Hazratganj, Mahatma Gandhi Marg', landmark: 'Opposite Janpath Hotel',
      city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow', pincode: '226001',
      googleMapsLocation: 'https://maps.google.com/?q=Hazratganj+Lucknow',
      latitude: 26.8467, longitude: 80.9462,
      emergencyContactNumber: '+918000000110', alternateEmail: 'orthoplus@mail.com',
      specialties: ['Orthopedics', 'General Medicine'], doctorCount: 2,
      clinicRegistrationNumber: 'UP-CLN-2024-0044', gstNumber: '09LMNOP5678Q9R3', panNumber: 'LMNOP5678Q',
      consultationModes: ['OFFLINE'],
      weeklySchedule: withSaturday('09:00', '19:00', '09:00', '14:00', '14:00', '15:00'),
      openingHours: 'Mon-Fri 09:00-19:00, Sat 09:00-14:00',
      avgConsultationMinutes: 20, appointmentSlotMinutes: 20, dailyPatientCapacity: 35,
      facilities: ['Parking', 'AC Waiting Area', 'Drinking Water', 'Wheelchair Access', 'Online Payment'],
      languagesSpoken: ['Hindi', 'English'],
      paymentMethods: ['Cash', 'UPI', 'Credit/Debit Card'],
      insuranceSupported: ['Star Health', 'ICICI Lombard'],
      approvalStatus: 'REJECTED', isVerified: false, isActive: false,
      submittedAt: new Date('2026-05-10T10:00:00Z'),
      rejectionReason: 'The clinic address could not be verified — it does not match the registration certificate. Additionally, the uploaded PAN card belongs to an individual rather than the clinic entity. Please resubmit with correct documents.',
      rejectedAt: new Date('2026-05-14T12:00:00Z'),
    },
    verificationLog: { oldStatus: 'PENDING', newStatus: 'REJECTED', remark: 'Address mismatch and invalid PAN card. Resubmission required.' },
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  Seeding dummy clinics...\n');

  const passwordHash = await bcrypt.hash('Clinic@123', 12);
  let created = 0;
  let skipped = 0;

  for (const entry of CLINICS) {
    const { owner: ownerData, clinic: clinicData, verificationLog } = entry;

    // Find or create owner
    let owner = await prisma.user.findFirst({
      where: { OR: [{ email: ownerData.email }, { mobile: ownerData.mobile }] },
    });

    if (!owner) {
      owner = await prisma.user.create({
        data: {
          name: ownerData.name,
          mobile: ownerData.mobile,
          email: ownerData.email,
          role: 'CLINIC_OWNER',
          approvalStatus: clinicData.approvalStatus,
          passwordHash,
          isPhoneVerified: true,
          isEmailVerified: true,
          isActive: clinicData.approvalStatus === 'VERIFIED',
          ...(clinicData.rejectionReason && { rejectionReason: clinicData.rejectionReason }),
          ...(clinicData.suspendedReason && { suspendedReason: clinicData.suspendedReason }),
        },
      });
      console.log(`  + Owner:   ${ownerData.name} <${ownerData.email}>`);
    } else {
      console.log(`  ~ Exists:  ${ownerData.name} <${ownerData.email}>`);
    }

    // Skip if clinic already exists for this owner
    const existing = await prisma.clinic.findFirst({ where: { ownerId: owner.id } });
    if (existing) {
      console.log(`  ~ Clinic:  "${existing.name}" already exists — skipped\n`);
      skipped++;
      continue;
    }

    // Pull out special fields
    const {
      approvalStatus, isVerified, isActive,
      submittedAt, verifiedAt, rejectedAt,
      rejectionReason, changesRequestedReason, suspendedReason,
      weeklySchedule,
      ...rest
    } = clinicData;

    const clinic = await prisma.clinic.create({
      data: {
        ownerId: owner.id,
        ...rest,
        weeklySchedule,
        approvalStatus,
        isVerified,
        isActive,
        submittedAt,
        ownerMobileVerified: true,
        ownerEmailVerified: true,
        mobileOtpVerifiedAt: submittedAt,
        emailVerifiedAt: submittedAt,
        ...(verifiedAt && { verifiedAt }),
        ...(rejectionReason && { rejectionReason }),
        ...(rejectedAt && { rejectedAt }),
        ...(changesRequestedReason && { changesRequestedReason }),
        ...(suspendedReason && { suspendedReason }),
        clinicLogoUrl: DOCS.logo,
        clinicCoverImageUrl: DOCS.cover,
        licenseDocumentUrl: DOCS.license,
        clinicLicenseDocument: DOCS.license,
        medicalEstablishmentCertificateUrl: DOCS.medCert,
        gstCertificateUrl: DOCS.gstCert,
        panCardUrl: DOCS.panCard,
      },
    });

    console.log(`  + Clinic:  "${clinic.name}" [${approvalStatus}]`);

    // Owner as staff member
    await prisma.clinicStaff.create({
      data: { clinicId: clinic.id, userId: owner.id, role: 'OWNER' },
    });

    // Verification log
    if (verificationLog) {
      await prisma.clinicVerificationLog.create({
        data: {
          clinicId: clinic.id,
          adminId: null,
          oldStatus: verificationLog.oldStatus,
          newStatus: verificationLog.newStatus,
          remark: verificationLog.remark,
          createdAt: verifiedAt || rejectedAt || new Date(),
        },
      });
      console.log(`  + Log:     ${verificationLog.oldStatus} -> ${verificationLog.newStatus}`);
    }

    console.log('');
    created++;
  }

  console.log('='.repeat(60));
  console.log(`Done! Created: ${created}  Skipped: ${skipped}\n`);
  console.log('All clinic owner passwords: Clinic@123\n');

  const tally = {};
  CLINICS.forEach(({ clinic: c }) => {
    tally[c.approvalStatus] = (tally[c.approvalStatus] || 0) + 1;
  });
  console.log('Status spread across all defined clinics:');
  Object.entries(tally).sort().forEach(([s, n]) =>
    console.log(`  ${s.padEnd(20)} x${n}`)
  );
}

main()
  .catch((err) => { console.error('\nSeed failed:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
