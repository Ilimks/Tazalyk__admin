import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// шрифт Onest лежит в сборке: CSP разрешает шрифты только со своего адреса. Тот же шрифт у ассистента
import '@fontsource-variable/onest';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);