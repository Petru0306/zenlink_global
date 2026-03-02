/**
 * Centralized API configuration
 * 
 * In production (Vercel), set VITE_BACKEND_URL environment variable to your Railway backend URL
 * Example: VITE_BACKEND_URL=https://zenlinkglobal-production-55f0.up.railway.app
 * 
 * For local development, defaults to http://localhost:8080
 */
export const API_BASE_URL = 
  import.meta.env.VITE_BACKEND_URL || 
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' 
    ? `http://${window.location.hostname || 'localhost'}:8080`
    : 'http://localhost:8080');

console.log('API_BASE_URL configured as:', API_BASE_URL);
