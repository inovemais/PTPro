/**
 * API Configuration
 * 
 * This file manages the API base URL for all API calls.
 * Uses environment variable or defaults to localhost in development and Render URL in production
 */

// Get API URL from environment variable or use default
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || 
                       (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

// Check if we're running on localhost
const isLocalhost = typeof window !== 'undefined' && 
                    (window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === '');

// In development/localhost, use relative paths to leverage Vite proxy
// In production, use full URL from env or default to Render URL
const rawApiBase = import.meta.env.VITE_API_URL || 
                   import.meta.env.REACT_APP_API_URL || 
                   (isProduction ? 'https://pwa-app-nudl.onrender.com' : '');

console.log('🔧 [API Config] Initialization:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  REACT_APP_API_URL: import.meta.env.REACT_APP_API_URL,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  isProduction,
  isDevelopment,
  isLocalhost,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
  rawApiBase
});

/**
 * Builds a complete API URL from a relative path
 * @param {string} path - Relative API path (e.g., '/api/auth/login')
 * @returns {string} Complete API URL or relative path (for Vite proxy)
 */
export function buildApiUrl(path) {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development/localhost, ALWAYS use relative paths to leverage Vite proxy (http://127.0.0.1:3000)
  // This ensures we use the local backend when testing locally
  if (isLocalhost || (isDevelopment && !import.meta.env.VITE_API_URL && !import.meta.env.REACT_APP_API_URL)) {
    // Use relative path - Vite proxy will handle it
    console.log(`🔧 [API Config] Using relative path (Vite proxy): ${cleanPath}`);
    return cleanPath;
  }
  
  // Build full URL for production or when explicit API URL is set
  const baseUrl = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
  const url = `${baseUrl}${cleanPath}`;
  console.log(`🔧 [API Config] Using base URL: ${baseUrl} -> ${url}`);
  return url;
}

/**
 * Get the base API URL
 * @returns {string} Base API URL
 */
export function getApiBase() {
  const base = rawApiBase || '';
  console.log('🔧 [API Config] getApiBase() called:', {
    rawApiBase,
    result: base,
    isDev: import.meta.env.DEV,
    envVars: {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      REACT_APP_API_URL: import.meta.env.REACT_APP_API_URL
    }
  });
  return base;
}

// Export default for convenience
export default {
  buildApiUrl,
  getApiBase,
  rawApiBase
};
