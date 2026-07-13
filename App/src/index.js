import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/main.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { loadGoogleAnalytics } from './analytics';

// Render every remaining Font Awesome class as inline SVG. The `nest` mode
// preserves the original <i> wrapper so existing page-specific CSS continues
// to size and color icons without relying on webfont files.
window.FontAwesomeConfig = {
  autoReplaceSvg: 'nest',
  observeMutations: true,
};
import('@fortawesome/fontawesome-free/js/all.min.js');

loadGoogleAnalytics();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
