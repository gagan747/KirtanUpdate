// Test script to verify API configuration
console.log('Testing API Configuration...');

// Simulate development mode
const devMode = 'development';
const prodMode = 'production';

console.log('\n=== Development Mode ===');
const devUrl = devMode === 'development' ? "http://localhost:5000" : "https://kirtanupdate.onrender.com";
console.log('API URL:', devUrl);

console.log('\n=== Production Mode ===');
const prodUrl = prodMode === 'development' ? "http://localhost:5000" : "https://kirtanupdate.onrender.com";
console.log('API URL:', prodUrl);

console.log('\n=== Current Vite Dev Environment ===');
// This simulates what happens in the browser during development
const currentUrl = 'development' === 'development' ? "http://localhost:5000" : "https://kirtanupdate.onrender.com";
console.log('Current API URL:', currentUrl);

console.log('\n=== Production Build Environment ===');
// This simulates what happens in the browser during production build
const buildUrl = 'production' === 'development' ? "http://localhost:5000" : "https://kirtanupdate.onrender.com";
console.log('Build API URL:', buildUrl);
