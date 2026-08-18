/**
 * Verification script to check upload system configuration
 * Run: node verify-uploads.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Upload System Configuration...\n');

// 1. Check uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (fs.existsSync(uploadsDir)) {
    console.log('✅ uploads/ directory exists');
    const files = fs.readdirSync(uploadsDir);
    console.log(`   Found ${files.length} file(s)`);
    if (files.length > 0) {
      console.log('   Files:');
      files.slice(0, 5).forEach(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file} (${sizeKB} KB)`);
      });
      if (files.length > 5) {
        console.log(`   ... and ${files.length - 5} more`);
      }
    }
  } else {
    console.log('❌ uploads/ directory does NOT exist');
    console.log('   Creating uploads/ directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ uploads/ directory created');
  }
} catch (err) {
  console.log('❌ Error checking uploads/ directory:', err.message);
}

console.log('');

// 2. Check upload controller exists
const controllerPath = path.join(__dirname, 'src', 'controllers', 'upload.controller.js');
try {
  if (fs.existsSync(controllerPath)) {
    console.log('✅ upload.controller.js exists');
    const content = fs.readFileSync(controllerPath, 'utf8');
    if (content.includes('uploadDoctorDocument')) {
      console.log('   ✅ uploadDoctorDocument function found');
    } else {
      console.log('   ❌ uploadDoctorDocument function NOT found');
    }
    if (content.includes('uploadDoctorProfilePhoto')) {
      console.log('   ✅ uploadDoctorProfilePhoto function found');
    } else {
      console.log('   ❌ uploadDoctorProfilePhoto function NOT found');
    }
  } else {
    console.log('❌ upload.controller.js does NOT exist');
  }
} catch (err) {
  console.log('❌ Error checking upload.controller.js:', err.message);
}

console.log('');

// 3. Check upload routes
const routesPath = path.join(__dirname, 'src', 'routes', 'upload.routes.js');
try {
  if (fs.existsSync(routesPath)) {
    console.log('✅ upload.routes.js exists');
    const content = fs.readFileSync(routesPath, 'utf8');
    if (content.includes('uploadDoctorDocument')) {
      console.log('   ✅ uploadDoctorDocument imported');
    } else {
      console.log('   ❌ uploadDoctorDocument NOT imported');
    }
    if (content.includes('uploadDoctorProfilePhoto')) {
      console.log('   ✅ uploadDoctorProfilePhoto imported');
    } else {
      console.log('   ❌ uploadDoctorProfilePhoto NOT imported');
    }
    if (content.includes("router.post('/doctor-document'")) {
      console.log('   ✅ /doctor-document route defined');
    } else {
      console.log('   ❌ /doctor-document route NOT defined');
    }
    if (content.includes("router.post('/doctor-profile-photo'")) {
      console.log('   ✅ /doctor-profile-photo route defined');
    } else {
      console.log('   ❌ /doctor-profile-photo route NOT defined');
    }
  } else {
    console.log('❌ upload.routes.js does NOT exist');
  }
} catch (err) {
  console.log('❌ Error checking upload.routes.js:', err.message);
}

console.log('');

// 4. Check server.js for static file serving
const serverPath = path.join(__dirname, 'src', 'server.js');
try {
  if (fs.existsSync(serverPath)) {
    console.log('✅ server.js exists');
    const content = fs.readFileSync(serverPath, 'utf8');
    if (content.includes("app.use('/uploads'")) {
      console.log('   ✅ /uploads static route configured');
    } else {
      console.log('   ❌ /uploads static route NOT configured');
    }
    if (content.includes("app.use('/api/upload'")) {
      console.log('   ✅ /api/upload routes mounted');
    } else {
      console.log('   ❌ /api/upload routes NOT mounted');
    }
  } else {
    console.log('❌ server.js does NOT exist');
  }
} catch (err) {
  console.log('❌ Error checking server.js:', err.message);
}

console.log('');

// 5. Check upload service
const servicePath = path.join(__dirname, 'src', 'services', 'upload.service.js');
try {
  if (fs.existsSync(servicePath)) {
    console.log('✅ upload.service.js exists');
    const content = fs.readFileSync(servicePath, 'utf8');
    if (content.includes('multer')) {
      console.log('   ✅ multer configured');
    } else {
      console.log('   ❌ multer NOT configured');
    }
    if (content.includes('getFileUrl')) {
      console.log('   ✅ getFileUrl function defined');
    } else {
      console.log('   ❌ getFileUrl function NOT defined');
    }
  } else {
    console.log('❌ upload.service.js does NOT exist');
  }
} catch (err) {
  console.log('❌ Error checking upload.service.js:', err.message);
}

console.log('');

// 6. Check doctor controller
const doctorControllerPath = path.join(__dirname, 'src', 'controllers', 'doctor.controller.js');
try {
  if (fs.existsSync(doctorControllerPath)) {
    console.log('✅ doctor.controller.js exists');
    const content = fs.readFileSync(doctorControllerPath, 'utf8');
    if (content.includes('updateDoctorProfile')) {
      console.log('   ✅ updateDoctorProfile function found');
    } else {
      console.log('   ❌ updateDoctorProfile function NOT found');
    }
    if (content.includes('certificates')) {
      console.log('   ✅ certificates field handled');
    } else {
      console.log('   ⚠️  certificates field not explicitly handled (may still work)');
    }
  } else {
    console.log('❌ doctor.controller.js does NOT exist');
  }
} catch (err) {
  console.log('❌ Error checking doctor.controller.js:', err.message);
}

console.log('');
console.log('───────────────────────────────────────────────');
console.log('📋 Summary:');
console.log('───────────────────────────────────────────────');
console.log('');
console.log('To test the upload system:');
console.log('1. Start backend: cd backend && npm run dev');
console.log('2. Start frontend: cd frontend && npm run dev');
console.log('3. Create doctor invitation as clinic owner');
console.log('4. Accept invitation and upload files');
console.log('5. Check uploads/ directory for files');
console.log('6. Verify admin can see documents');
console.log('');
console.log('For detailed testing guide, see TEST-FILE-UPLOAD.md');
console.log('');
