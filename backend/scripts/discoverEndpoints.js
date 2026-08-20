#!/usr/bin/env node

/**
 * Endpoint Discovery Script
 * Maps all available API endpoints from route files
 */

const fs = require('fs');
const path = require('path');

console.log('\n═══════════════════════════════════════════════════════');
console.log('API ENDPOINT DISCOVERY');
console.log('═══════════════════════════════════════════════════════\n');

const routesDir = path.join(__dirname, '../src/routes');
const endpoints = {
  auth: [],
  clinic: [],
  doctor: [],
  admin: [],
  patient: [],
  other: [],
};

function parseRouteFile(filename) {
  const filepath = path.join(routesDir, filename);
  if (!fs.existsSync(filepath)) return [];

  const content = fs.readFileSync(filepath, 'utf8');
  const routes = [];

  // Match router.METHOD('path', ...)
  const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = routeRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
    });
  }

  return routes;
}

// Parse all route files
console.log('Discovering routes...\n');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));

routeFiles.forEach(file => {
  const baseName = file.replace('.routes.js', '');
  const routes = parseRouteFile(file);
  
  if (routes.length > 0) {
    console.log(`\n${baseName.toUpperCase()} ROUTES (${routes.length} endpoints)`);
    console.log('─'.repeat(60));
    
    routes.forEach(route => {
      const fullPath = `/api/${baseName}${route.path}`;
      console.log(`${route.method.padEnd(7)} ${fullPath}`);
      
      // Categorize
      if (baseName === 'auth' || fullPath.includes('/auth/')) {
        endpoints.auth.push({ method: route.method, path: fullPath });
      } else if (fullPath.includes('/clinic')) {
        endpoints.clinic.push({ method: route.method, path: fullPath });
      } else if (fullPath.includes('/doctor')) {
        endpoints.doctor.push({ method: route.method, path: fullPath });
      } else if (fullPath.includes('/admin')) {
        endpoints.admin.push({ method: route.method, path: fullPath });
      } else if (fullPath.includes('/patient')) {
        endpoints.patient.push({ method: route.method, path: fullPath });
      } else {
        endpoints.other.push({ method: route.method, path: fullPath });
      }
    });
  }
});

console.log('\n\n═══════════════════════════════════════════════════════');
console.log('CATEGORIZED ENDPOINTS');
console.log('═══════════════════════════════════════════════════════\n');

console.log('🔐 AUTHENTICATION ENDPOINTS');
console.log('─'.repeat(60));
endpoints.auth.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));

console.log('\n\n🏥 CLINIC ENDPOINTS');
console.log('─'.repeat(60));
endpoints.clinic.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));

console.log('\n\n👨‍⚕️  DOCTOR ENDPOINTS');
console.log('─'.repeat(60));
endpoints.doctor.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));

console.log('\n\n👤 ADMIN ENDPOINTS');
console.log('─'.repeat(60));
endpoints.admin.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));

console.log('\n\n🤒 PATIENT ENDPOINTS');
console.log('─'.repeat(60));
endpoints.patient.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));

if (endpoints.other.length > 0) {
  console.log('\n\n📋 OTHER ENDPOINTS');
  console.log('─'.repeat(60));
  endpoints.other.forEach(e => console.log(`${e.method.padEnd(7)} ${e.path}`));
}

console.log('\n\n═══════════════════════════════════════════════════════');
console.log('TEST REQUIREMENTS VERIFICATION');
console.log('═══════════════════════════════════════════════════════\n');

const requiredEndpoints = [
  { method: 'POST', path: '/api/auth/clinic/register', description: 'Clinic registration' },
  { method: 'POST', path: '/api/auth/clinic/send-mobile-otp', description: 'Send mobile OTP' },
  { method: 'POST', path: '/api/auth/clinic/verify-mobile-otp', description: 'Verify mobile OTP' },
  { method: 'POST', path: '/api/auth/clinic/send-email-otp', description: 'Send email OTP' },
  { method: 'POST', path: '/api/auth/clinic/verify-email-otp', description: 'Verify email OTP' },
  { method: 'POST', path: '/api/auth/login', description: 'Admin login' },
  { method: 'POST', path: '/api/admin/clinics/:id/approve', description: 'Approve clinic' },
  { method: 'POST', path: '/api/clinic/invite-doctor', description: 'Invite doctor' },
  { method: 'GET', path: '/api/clinic/dashboard', description: 'Clinic dashboard' },
];

console.log('Checking required endpoints for tests:\n');

requiredEndpoints.forEach(req => {
  // Check if endpoint exists (allowing for :id params)
  const pathPattern = req.path.replace(':id', '[^/]+');
  const regex = new RegExp(pathPattern);
  
  const found = [...endpoints.auth, ...endpoints.clinic, ...endpoints.admin, ...endpoints.doctor, ...endpoints.other]
    .find(e => e.method === req.method && regex.test(e.path));
  
  if (found) {
    console.log(`✅ ${req.method.padEnd(7)} ${req.path}`);
    console.log(`   ${req.description}`);
  } else {
    console.log(`❌ ${req.method.padEnd(7)} ${req.path}`);
    console.log(`   ${req.description} - NOT FOUND`);
  }
  console.log('');
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

console.log(`Total Endpoints:      ${endpoints.auth.length + endpoints.clinic.length + endpoints.doctor.length + endpoints.admin.length + endpoints.patient.length + endpoints.other.length}`);
console.log(`Authentication:       ${endpoints.auth.length}`);
console.log(`Clinic:               ${endpoints.clinic.length}`);
console.log(`Doctor:               ${endpoints.doctor.length}`);
console.log(`Admin:                ${endpoints.admin.length}`);
console.log(`Patient:              ${endpoints.patient.length}`);
console.log(`Other:                ${endpoints.other.length}`);

// Save to file
const outputPath = path.join(__dirname, '../tests/qa/reports/endpoint-map.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(endpoints, null, 2));

console.log(`\n✅ Endpoint map saved to: ${outputPath}`);
console.log('\n');

process.exit(0);
