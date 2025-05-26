/**
 * This file contains application-wide constants
 */

// API and socket server URL
// Use localhost in development, production URL in production build
export const SERVER_URL: string = import.meta.env.MODE === 'development' 
  ? "http://localhost:5000" 
  : "https://kirtanupdate.onrender.com";
