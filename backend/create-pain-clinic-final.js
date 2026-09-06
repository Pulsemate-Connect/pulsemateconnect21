const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPainClinic() {
  try {
    // The owner user ID from previous creation
    const ownerId = '9ebe5161-026b-46a1-9ae3-c2725470d06e';

    // Verify owner exists
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!owner) {
      console.error('❌ Owner user not found!');
      return;
    }

    console.log('✅ Owner found:', owner.name, owner.email, owner.mobile);

    // Create clinic with minimal required fields + essential info
    const clinic = await prisma.clinic.create({
      data: {
        name: 'Pain Clinic Physiotherapy and Rehabilitation Center',
        ownerId: ownerId,
        phone: '+919740809295',
        address: 'G8, Suman Laxmi Enclave, Kajubag, Next to Nagmangala Hospital, Kodibag Road',
        city: 'Karwar',
        state: 'Karnataka',
        pincode: '581301',
        isVerified: true,
        approvalStatus: 'VERIFIED',
        isActive: true,
        description: 'Pain Clinic Physiotherapy and Rehabilitation Center in Karwar is run by Dr. Arjun R. Upadhyay. Specializes in personalized exercise programs, back/joint pain relief, and spine care.',
        emergencyContactNumber: '+919901958611',
        specialties: ['Physiotherapy', 'Pain Management', 'Rehabilitation', 'Spine Care'],
        facilities: ['Waiting area', 'Parking', 'X-ray services', 'Home visit options'],
        consultationModes: ['IN_PERSON'],
        paymentMethods: ['CASH', 'UPI'],
        languagesSpoken: ['English', 'Hindi', 'Kannada'],
        ownerMobileVerified: true,
        verifiedAt: new Date(),
        submittedAt: new Date(),
      }
    });

    console.log('✅ Clinic created successfully!');
    console.log('Clinic ID:', clinic.id);
    console.log('Clinic Name:', clinic.name);
    console.log('Owner ID:', clinic.ownerId);
    console.log('Approval Status:', clinic.approvalStatus);
    console.log('Is Verified:', clinic.isVerified);

    // Create working hours (Monday to Saturday: 9:30 AM – 1:00 PM and 4:00 PM – 8:00 PM)
    // Days: 0=Sunday, 1=Monday, ..., 6=Saturday
    const workingDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
    
    for (const dayOfWeek of workingDays) {
      await prisma.clinicWorkingHours.create({
        data: {
          clinicId: clinic.id,
          dayOfWeek: dayOfWeek,
          isOpen: true,
          morningStartTime: '09:30',
          morningEndTime: '13:00',
          eveningStartTime: '16:00',
          eveningEndTime: '20:00',
        }
      });
    }

    console.log('✅ Working hours created (Mon-Sat: 9:30-13:00 & 16:00-20:00)');

    // Verify the clinic is visible
    const verifyClinic = await prisma.clinic.findUnique({
      where: { id: clinic.id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            mobile: true,
            role: true
          }
        },
        workingHours: true
      }
    });

    console.log('\n📋 Clinic Details:');
    console.log('ID:', verifyClinic.id);
    console.log('Name:', verifyClinic.name);
    console.log('Owner:', verifyClinic.owner.name, `(${verifyClinic.owner.mobile})`);
    console.log('Address:', verifyClinic.address);
    console.log('City:', verifyClinic.city);
    console.log('Phone:', verifyClinic.phone);
    console.log('Verified:', verifyClinic.isVerified);
    console.log('Status:', verifyClinic.approvalStatus);
    console.log('Working Hours:', verifyClinic.workingHours.length, 'slots');

    console.log('\n✅ All done! Clinic is now visible in the system.');
    console.log('\n📱 Test Login Credentials:');
    console.log('Mobile: +919876543210 or 9876543210');
    console.log('Test OTP: 123456');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.meta) {
      console.error('Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

createPainClinic();
