import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element (#root) is missing.');
}

const showFatalError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#09090b;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif">
      <div style="max-width:680px;width:100%;background:#18181b;border:1px solid #3f3f46;border-radius:20px;padding:24px">
        <h1 style="margin:0 0 8px;font-size:22px">Universal Smart TV Remote</h1>
        <p style="color:#a1a1aa;margin:0 0 18px">The app could not start safely.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#09090b;border-radius:12px;padding:14px;color:#fda4af;font-size:12px">${message.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
        <button onclick="location.reload()" style="margin-top:14px;padding:10px 16px;border:0;border-radius:10px;background:#4f46e5;color:white;font-weight:700">Reload app</button>
      </div>
    </div>`;
};

const root = createRoot(rootElement, {
  onCaughtError: (error) => {
    console.error('React caught error:', error);
  },
  onUncaughtError: (error) => {
    console.error('React uncaught error:', error);
    showFatalError(error);
  },
});

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
