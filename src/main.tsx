import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline resilience
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ MediScan Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ Service Worker registration error:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
