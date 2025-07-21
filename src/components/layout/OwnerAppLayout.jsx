import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import OwnerBottomNavBar from './OwnerBottomNavBar';

const OwnerAppLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    pb: '70px' // Padding taaki content bottom nav ke peeche na chhupe
                }}
            >
                <Outlet />
            </Box>
            <OwnerBottomNavBar />
        </Box>
    );
};

export default OwnerAppLayout;