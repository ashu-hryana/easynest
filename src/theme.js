// src/theme.js
import { createTheme } from '@mui/material/styles';

// Hamari app ke liye custom theme define karo
const theme = createTheme({
  palette: {
    // Hum hamesha 'light' mode use karenge
    mode: 'light', 
    primary: {
      // Yeh aapka brand color ho sakta hai
      main: '#1a1a1a', // Black
    },
    secondary: {
      main: '#f50057', // Example secondary color
    },
    background: {
      // Page ka default background color
      default: '#f8f9fa', // Light gray
      paper: '#ffffff', // Cards, Headers, etc. ka color
    },
  },
  typography: {
    fontFamily: [
      'Poppins', // Isko sabse pehle rakhein
      'sans-serif', // Yeh fallback hai
    ].join(','),
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    }
  },
  components: {
    // Kuch default components ki styling aage ke liye
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
