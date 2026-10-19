import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SiteConfigProvider } from './context/SiteConfigContext.tsx';
import { AccessibilityProvider } from './lib/AccessibilityContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import App from './App.tsx';
import './index.css';

// Filter out noise from Firebase
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('GrpcConnection RPC') || msg.includes('CANCELLED: Disconnecting idle stream')) return;
  if (msg.includes('failed to connect to websocket') || msg.includes('WebSocket connection to')) return;
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const msg = args.join(' ');
  if (msg.includes('GrpcConnection RPC') || msg.includes('CANCELLED: Disconnecting idle stream')) return;
  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteConfigProvider>
        <AccessibilityProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AccessibilityProvider>
      </SiteConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
