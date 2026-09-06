const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n🏥 Creating Pain Clinic...\n');
    
    const clinic = await prisma.clinic.create({
      data: {
        id: 'pain-clinic-karwar-001',
        name: 'Pain Clinic Physiotherapy',
        ownerId: '9ebe5161-026b-46a1-9ae3-c2725470d06e',
        phone: '+919740809295',
        address: 'G8, Suman Laxmi Enclave, Kajubag',
        city: 'Karwar',
        state: 'Karnataka',
        pincode: '581301',
        landmark: 'Next to Nagmangala Hospital',
        latitude: 14.8118,
        longitude: 74.1284,
        description: 'Pain Clinic Physiotherapy and Rehabilitation Center run by Dr. Arjun R. Upadhyay',
        clinicType: 'Physiotherapy',
        clinicRegistrationNumber: 'KA-KAR-PAIN-2024',
        registrationYear: 2010,
        registrationAuthority: 'Karnataka Medical Council',
        specialties: ['Physiotherapy', 'Pain Management', 'Spine Care'],
        facilities: ['WAITING_AREA', 'PARKING', 'XRAY'],
        languagesSpoken: ['English', 'Hindi', 'Kannada'],
        emergencyContactNumber: '+919901958611',
        avgConsultationMinutes: 30,
        appointmentSlotMinutes: 30,
        approvalStatus: 'VERIFIED',
        isVerified: true,
        isActive: true,
        verifiedAt: new Date(),
        submittedAt: new Date()
      }
    });
    
    console.log('✅ Clinic created successfully!');
    console.log('   ID:', clinic.id);
    console.log('   Name:', clinic.name);
    console.log('   Status:', clinic.approvalStatus);
    console.log('   Verified:', clinic.isVerified);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
