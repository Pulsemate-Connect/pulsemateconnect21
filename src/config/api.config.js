/**
 * API Configuration
 * Central place to manage API URLs and environment settings
 */

// Check if in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// Local backend IP - UPDATE THIS if your IP changes
// For Android emulator, use 10.0.2.2 (special alias for host's localhost)
// For physical device, use 192.168.31.240 (your computer's IP on network)
export const LOCAL_BACKEND_IP = '10.0.2.2'; // Changed for emulator
export const LOCAL_BACKEND_PORT = '5000';
export const LOCAL_BACKEND_URL = `http://${LOCAL_BACKEND_IP}:${LOCAL_BACKEND_PORT}/api`;

// Production API URL
export const PRODUCTION_API_URL = 'https://api.pulsemateconnect.in/api';

// Active API URL based on environment
export const API_BASE_URL = isDev ? LOCAL_BACKEND_URL : PRODUCTION_API_URL;

// Environment info
export const ENV = {
  isDevelopment: isDev,
  isProduction: !isDev,
  apiUrl: API_BASE_URL,
  backendType: isDev ? 'LOCAL' : 'PRODUCTION',
};

// Log configuration on import
console.log(`
╔═══════════════════════════════════════════════════════════════════════════════
║ 🔧 API CONFIGURATION LOADED
╠═══════════════════════════════════════════════════════════════════════════════
║ 📱 Environment: ${ENV.isDevelopment ? '🔧 DEVELOPMENT' : '🌐 PRODUCTION'}
║ 🌐 API URL: ${ENV.apiUrl}
║ 🏠 Backend: ${ENV.backendType}
║ 
║ 💡 TIP: If backend connection fails, check:
║    1. Backend server is running on ${LOCAL_BACKEND_IP}:${LOCAL_BACKEND_PORT}
║    2. Phone/Emulator can reach this IP on your network
║    3. No firewall blocking port ${LOCAL_BACKEND_PORT}
╚═══════════════════════════════════════════════════════════════════════════════
`);

export default {
  LOCAL_BACKEND_IP,
  LOCAL_BACKEND_PORT,
  LOCAL_BACKEND_URL,
  PRODUCTION_API_URL,
  API_BASE_URL,
  ENV,
};
