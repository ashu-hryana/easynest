// src/main.jsx (Updated with ConnectionProvider)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Providers
import { WishlistProvider } from './contexts/WishlistContext.jsx';
import { ListingProvider } from './contexts/ListingContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { ConnectionProvider } from './contexts/ConnectionContext.jsx'; // <-- Naya Provider import karo
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Global Styles
import './index.css';
import "yet-another-react-lightbox/styles.css";

// Main App Component
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <NotificationProvider>
            <ConnectionProvider> {/* <-- Yahan wrap karo */}
              <ListingProvider>
                <WishlistProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </WishlistProvider>
              </ListingProvider>
            </ConnectionProvider> {/* <-- Yahan close karo */}
          </NotificationProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);