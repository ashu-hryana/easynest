// /src/screens/auth/WelcomeScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const WelcomeScreen = () => {
  // Navigation ke liye useNavigate hook
  const navigate = useNavigate();

  return (
    // Yeh Box poori screen ki height lega aur content ko vertically center karega
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'white',
      }}
    >
      {/* Container content ko center mein rakhta hai aur width manage karta hai */}
      <Container maxWidth="xs" sx={{ textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Welcome to EasyNest
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 8 }}>
          Find your next stay, or list your property with us.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/login')} // Student Login ke liye
          sx={{
            py: 1.5, // paddingVertical
            borderRadius: '30px',
            textTransform: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            mb: 2,
            backgroundColor: 'black',
            '&:hover': { backgroundColor: '#333' },
          }}
        >
          I'm a Student
        </Button>

        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/owner-login')} // Owner Login ke liye
          sx={{
            py: 1.5,
            borderRadius: '30px',
            textTransform: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: 'black',
            '&:hover': { backgroundColor: '#333' },
          }}
        >
          I'm an Owner
        </Button>
      </Container>
    </Box>
  );
};

export default WelcomeScreen;