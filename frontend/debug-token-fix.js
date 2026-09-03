/**
 * TOKEN DEBUGGING AND FIX SCRIPT
 * 
 * Run this in your browser console (F12) to diagnose and fix token issues.
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Follow the prompts
 */

console.log('═══════════════════════════════════════════════════════');
console.log('   PULSEMATE TOKEN DEBUGGER');
console.log('═══════════════════════════════════════════════════════\n');

// Step 1: Check current localStorage
console.log('📦 Checking localStorage...\n');

const authKey = 'pulsemate-auth-storage';
const rawStorage = localStorage.getItem(authKey);

if (!rawStorage) {
  console.log('❌ No auth data found in localStorage');
} else {
  console.log('✅ Found auth data in localStorage');
  
  try {
    const parsed = JSON.parse(rawStorage);
    const state = parsed.state || {};
    
    console.log('\n📊 Current Storage State:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User ID:', state.user?.id);
    console.log('User Name:', state.user?.name);
    console.log('User Email:', state.user?.email);
    console.log('User Role:', state.user?.role);
    console.log('Admin Level:', state.user?.adminProfile?.level);
    console.log('Is Authenticated:', state.isAuthenticated);
    console.log('\n🎫 Token Preview:');
    if (state.accessToken) {
      console.log('First 50 chars:', state.accessToken.substring(0, 50) + '...');
      
      // Decode JWT to check payload
      try {
        const [, payloadB64] = state.accessToken.split('.');
        const payload = JSON.parse(atob(payloadB64));
        console.log('\n🔍 Token Payload:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Subject (User ID):', payload.sub);
        console.log('Role:', payload.role);
        console.log('Roles Array:', payload.roles);
        console.log('Primary Role:', payload.primaryRole);
        console.log('Active Role:', payload.activeRole);
        console.log('Status:', payload.status);
        console.log('Issued At:', new Date(payload.iat * 1000).toLocaleString());
        console.log('Expires At:', new Date(payload.exp * 1000).toLocaleString());
        console.log('Expired?', payload.exp * 1000 < Date.now());
        
        // Check for mismatch
        if (state.user?.role !== payload.role) {
          console.log('\n⚠️  MISMATCH DETECTED!');
          console.log('User object role:', state.user?.role);
          console.log('Token payload role:', payload.role);
          console.log('\nThis explains the 403 error.');
        }
        
        if (payload.role === 'PATIENT') {
          console.log('\n❌ PROBLEM FOUND: You have a PATIENT token but need SUPER_ADMIN token!');
        } else if (payload.role === 'SUPER_ADMIN') {
          console.log('\n✅ Token role is correct (SUPER_ADMIN)');
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    } else {
      console.log('❌ No token found');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (e) {
    console.error('Failed to parse storage:', e);
  }
}

// Step 2: Check sessionStorage
console.log('\n📦 Checking sessionStorage...\n');
const sessionAuth = sessionStorage.getItem(authKey);
if (sessionAuth) {
  console.log('⚠️  Found duplicate auth in sessionStorage (might cause conflicts)');
}

// Step 3: Provide fix commands
console.log('\n\n🔧 FIX OPTIONS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Option 1: Clear ALL auth data and re-login');
console.log('Command: clearAuthAndReload()');

console.log('\nOption 2: Set specific admin token (if you have one)');
console.log('Command: setAdminToken(token, userId, userName, userEmail)');

console.log('\nOption 3: Just clear storage and keep page');
console.log('Command: clearAuth()');

// Helper functions
window.clearAuthAndReload = function() {
  console.log('🧹 Clearing all auth data...');
  localStorage.removeItem('pulsemate-auth-storage');
  localStorage.removeItem('pulsemate-auth'); // Alternative key
  sessionStorage.clear();
  
  // Clear any other potential auth keys
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('token')) {
      console.log('Removing:', key);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cleared. Reloading page...');
  window.location.href = '/admin';
};

window.clearAuth = function() {
  console.log('🧹 Clearing auth data...');
  localStorage.removeItem('pulsemate-auth-storage');
  localStorage.removeItem('pulsemate-auth');
  sessionStorage.clear();
  console.log('✅ Done. You can now login again.');
};

window.setAdminToken = function(token, userId, userName, userEmail) {
  console.log('💉 Injecting admin token...');
  
  // Decode token to verify
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    if (payload.role !== 'SUPER_ADMIN') {
      console.error('❌ Token role is not SUPER_ADMIN:', payload.role);
      return;
    }
    
    const authData = {
      state: {
        user: {
          id: userId || payload.sub,
          name: userName || 'Admin User',
          email: userEmail || 'admin@pulsemate.in',
          role: 'SUPER_ADMIN',
          adminProfile: {
            level: 'ROOT'
          }
        },
        accessToken: token,
        isAuthenticated: true
      },
      version: 0
    };
    
    localStorage.setItem('pulsemate-auth-storage', JSON.stringify(authData));
    console.log('✅ Token injected successfully!');
    console.log('Reloading page...');
    window.location.reload();
  } catch (e) {
    console.error('❌ Failed to inject token:', e);
  }
};

console.log('\n═══════════════════════════════════════════════════════');
console.log('  Run one of the commands above to fix the issue');
console.log('═══════════════════════════════════════════════════════\n');
