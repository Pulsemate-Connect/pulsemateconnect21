const axios = require('axios');

async function testProfileAPI() {
  try {
    console.log('\n=== Testing Profile API ===\n');

    // Step 1: Send OTP
    console.log('Step 1: Sending OTP to mobile...');
    const loginRes = await axios.post('http://192.168.31.240:5000/api/auth/send-otp', {
      phoneNumber: '+917022818878',
    });
    
    if (!loginRes.data.success) {
      console.error('❌ Send OTP failed:', loginRes.data);
      process.exit(1);
    }
    
    const { verificationId } = loginRes.data.data;
    console.log('✅ OTP sent, verificationId:', verificationId);

    // Step 2: Verify OTP
    console.log('Step 2: Verifying OTP...');
    const verifyRes = await axios.post('http://192.168.31.240:5000/api/auth/verify-otp', {
      phoneNumber: '+917022818878',
      otp: '123456',
      verificationId,
    });

    if (!verifyRes.data.success) {
      console.error('❌ OTP verification failed:', verifyRes.data);
      process.exit(1);
    }

    const { accessToken, user } = verifyRes.data.data;
    console.log('✅ Logged in successfully');
    console.log('   User from login response:');
    console.log('   - ID:', user.id);
    console.log('   - Name:', user.name);
    console.log('   - Role:', user.role);
    console.log('   - Mobile:', user.mobile);
    console.log('');

    // Step 3: Get profile
    console.log('Step 3: Fetching profile with GET /api/patient/profile...');
    const profileRes = await axios.get('http://192.168.31.240:5000/api/patient/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.data.success) {
      console.error('❌ Profile fetch failed:', profileRes.data);
      process.exit(1);
    }

    const profileUser = profileRes.data.data.user;
    console.log('✅ Profile fetched successfully');
    console.log('   User from profile API:');
    console.log('   - ID:', profileUser.id);
    console.log('   - Name:', profileUser.name);
    console.log('   - Role:', profileUser.role);
    console.log('   - Mobile:', profileUser.mobile);
    console.log('   - Has patient profile:', !!profileUser.patientProfile);
    console.log('');

    // Step 4: Get /auth/me
    console.log('Step 4: Fetching user with GET /api/auth/me...');
    const meRes = await axios.get('http://192.168.31.240:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.data.success) {
      console.error('❌ Me fetch failed:', meRes.data);
      process.exit(1);
    }

    const meUser = meRes.data.data.user;
    console.log('✅ /auth/me fetched successfully');
    console.log('   User from /auth/me:');
    console.log('   - ID:', meUser.id);
    console.log('   - Name:', meUser.name);
    console.log('   - Role:', meUser.role);
    console.log('   - Mobile:', meUser.mobile);
    console.log('');

    // Summary
    console.log('=== SUMMARY ===');
    console.log('Login response name:', user.name);
    console.log('Profile API name:', profileUser.name);
    console.log('/auth/me name:', meUser.name);
    console.log('');
    
    if (user.name === 'You' && profileUser.name === 'You' && meUser.name === 'You') {
      console.log('✅ ALL APIs return correct name "You"');
      console.log('✅ Backend is working correctly');
      console.log('');
      console.log('📱 Mobile app issue:');
      console.log('   - App might be using cached JWT/user data');
      console.log('   - Solution: Logout and login again in the app');
    } else {
      console.log('❌ Name mismatch detected');
      console.log('   Expected: "You"');
      console.log('   Got:', { login: user.name, profile: profileUser.name, me: meUser.name });
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProfileAPI();
