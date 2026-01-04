import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Get API base URL from environment or use default
const getApiBaseUrl = (): string => {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  // In development/localhost, ALWAYS use relative paths to leverage Vite proxy
  // This ensures we use the local server even if VITE_API_URL is set
  if (isLocalhost || isDevelopment) {
    return '';
  }

  // In production, use full URL from env or default
  return import.meta.env.VITE_API_URL || 'https://pwa-app-nudl.onrender.com';
};

const baseURL = getApiBaseUrl();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : '/api',
  withCredentials: true, // Support cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

