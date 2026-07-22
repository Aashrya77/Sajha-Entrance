import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { loadGoogleAnalytics } from './analytics';
import SeoHashtags from './components/Seo/SeoHashtags';

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
      <SeoHashtags />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
