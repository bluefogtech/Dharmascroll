import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error("React Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="color: white; background: #0f172a; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; font-family: serif;">
        <h1 style="color: #f59e0b; font-size: 2rem;">Initialization Error</h1>
        <p style="color: #94a3b8; margin: 15px 0; max-width: 400px; line-height: 1.5;">${err.message || 'The application failed to start.'}</p>
        <button onclick="window.location.reload()" style="background: #0891b2; color: white; border: none; padding: 12px 24px; border-radius: 99px; margin-top: 20px; cursor: pointer; font-weight: bold;">Try to Reload</button>
      </div>
    `;
  }
} else {
  console.error("Root element not found");
}