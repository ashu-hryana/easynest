// src/components/layout/StudentAppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
// import Navbar from './Navbar'; // Navbar ko ab import nahi karenge
import BottomNavBar from './BottomNavBar';

const StudentAppLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Navbar ko yahan se hata diya gaya hai */}
            
            {/* Main content area */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    // Padding taaki content bottom nav ke peeche na chhupe
                    pb: '70px' 
                }}
            >
                <Outlet /> {/* Yahan par HomeScreen, WishlistScreen etc. render honge */}
            </Box>

            <BottomNavBar />
        </Box>
    );
};

export default StudentAppLayout;
