import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/app.css';
import App from './App.jsx';
import { registerServiceWorker } from './lib/pwa.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the PWA service worker (production builds only).
registerServiceWorker();
