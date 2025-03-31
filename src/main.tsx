
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add version timestamp for cache busting
const VERSION = new Date().getTime();
console.log(`App Version: ${VERSION}`);

// Force reload if this is a new version
if (localStorage.getItem('app_version') !== VERSION.toString()) {
  localStorage.setItem('app_version', VERSION.toString());
  if (!window.location.href.includes('first_load')) {
    window.location.href = window.location.href + 
      (window.location.href.includes('?') ? '&' : '?') + 
      'first_load=true';
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App key={VERSION} />
  </React.StrictMode>
);
