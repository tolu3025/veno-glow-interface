
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create a fixed version ID based on build time rather than runtime
// This ensures all users get the same version number in a given deployment
const VERSION = '__BUILD_TIMESTAMP__'; // This will be replaced during build
console.log(`App Version: ${VERSION}`);

// Check if there was a version change
if (localStorage.getItem('app_version') !== VERSION) {
  localStorage.setItem('app_version', VERSION);
  
  // Check if this is not the first load (avoid reload loops)
  if (!sessionStorage.getItem('first_load')) {
    sessionStorage.setItem('first_load', 'true');
    console.log('New version detected, refreshing...');
    
    // Clear any stored auth tokens to ensure proper logout
    localStorage.removeItem('supabase.auth.token');
    
    window.location.reload();
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
