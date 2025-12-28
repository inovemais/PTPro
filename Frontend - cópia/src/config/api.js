/**
 * API Configuration
 * 
 * This file manages the API base URL for all API calls.
 * In development, it uses the proxy configured in vite.config.js
 * In production, it uses the environment variable or the Render URL
 */

// Get API URL from environment variable or use default
// IMPORTANTE: Em produção, sempre usar a URL do Render se não houver variável de ambiente
// Usar import.meta.env.PROD para detectar produção de forma mais confiável
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
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
  rawApiBase
});

/**
 * Builds a complete API URL from a relative path
 * @param {string} path - Relative API path (e.g., '/api/auth/login')
 * @returns {string} Complete API URL
 */
export function buildApiUrl(path) {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In development with proxy, return relative path
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  if (!isProduction && !rawApiBase) {
    const url = cleanPath;
    console.log(`🔧 [API Config] Development mode - using proxy: ${url}`);
    return url;
  }
  
  // In production or when API URL is set, build full URL
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
