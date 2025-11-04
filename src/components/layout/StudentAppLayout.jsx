// src/components/layout/StudentAppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import BottomNavBar from './BottomNavBar';

const StudentAppLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    // Adjusted padding for new bottom nav height
                    pb: { xs: '70px', md: 0 },
                    // Add some horizontal padding for better mobile experience
                    px: { xs: 0, sm: 0 }
                }}
            >
                <Outlet />
            </Box>

            <BottomNavBar />
        </Box>
    );
};

export default StudentAppLayout;
