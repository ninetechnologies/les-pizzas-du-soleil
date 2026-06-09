import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import CuisinePage from './components/CuisinePage.jsx';
import './styles/global.css';

// Cleanup éventuels résidus localStorage d'anciennes démos (grill-chicken etc.)
['gc_orders', 'gc_loyalty', 'gc_kds_auth'].forEach((k) => {
  try { localStorage.removeItem(k); } catch (e) {}
});

// Routage minimal : /cuisine = écran cuisine (accès commerçant), sinon le site client.
const isKitchen = window.location.pathname.replace(/\/+$/, '').toLowerCase().endsWith('/cuisine')
  || window.location.pathname.toLowerCase() === '/cuisine';

ReactDOM.createRoot(document.getElementById('root')).render(
  isKitchen ? <CuisinePage /> : <App />
);
