import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Import your main App component
import './index.css'; // Import your global CSS

// Get the root element from index.html
const rootElement = document.getElementById('root');

// Create a React root and render your App component
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
