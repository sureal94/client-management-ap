import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Apply theme IMMEDIATELY before React renders to prevent flash
(function applyThemeImmediately() {
  const savedTheme = localStorage.getItem('theme');
  let theme = savedTheme;
  
  if (!theme || (theme !== 'dark' && theme !== 'light')) {
    // Check user profile
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    theme = user.darkMode === true ? 'dark' : 'light';
  }
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
})();

// Error boundary for better error handling
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found. Check index.html</div>';
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h1>Error Loading App</h1>
        <p>${error.message}</p>
        <p>Check the browser console for more details.</p>
      </div>
    `;
  }
}








