
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add manifest link
const manifestLink = document.createElement('link');
manifestLink.rel = 'manifest';
manifestLink.href = '/manifest.json';
document.head.appendChild(manifestLink);

// Create a fixed version ID based on current timestamp if not already set during build
// This ensures all users get a consistent version number in a given session
const VERSION = typeof __BUILD_TIMESTAMP__ !== 'undefined' 
  ? __BUILD_TIMESTAMP__ 
  : new Date().toISOString().split('T')[0] + '-' + Math.floor(Math.random() * 1000);

console.log(`App Version: ${VERSION}`);

// Check if there was a version change
if (localStorage.getItem('app_version') !== VERSION) {
  localStorage.setItem('app_version', VERSION);
  
  // Check if this is not the first load (avoid reload loops)
  if (localStorage.getItem('first_load')) {
    console.log('New version detected, refreshing...');
    
    // Clear any stored auth tokens to ensure proper logout
    localStorage.removeItem('supabase.auth.token');
    
    // Force reload only if this isn't the first load
    window.location.reload();
  } else {
    // Mark as first load to prevent reload loops
    localStorage.setItem('first_load', 'true');
  }
}

// Add custom global declaration for the build timestamp
declare global {
  var __BUILD_TIMESTAMP__: string | undefined;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
