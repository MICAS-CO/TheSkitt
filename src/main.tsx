import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Apply persisted reduce-motion preference at boot so the class is on
// <html> before React renders. Persisted by SettingsScreen.
try {
  if (window.localStorage.getItem('theSkitt.reduceMotion.v1') === '1') {
    document.documentElement.classList.add('skitt--reduce-motion');
  }
} catch {
  // ignore (private mode)
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
