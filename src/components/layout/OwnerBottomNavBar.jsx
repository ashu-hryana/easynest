// src/components/layout/OwnerBottomNavBar.jsx

import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Dashboard, ListAlt, AccountCircle, MarkunreadMailbox, Chat } from '@mui/icons-material'; // Chat icon import kiya gaya hai
import { Link, useLocation } from 'react-router-dom';

const OwnerBottomNavBar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <Paper 
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} 
            elevation={3}
        >
            <BottomNavigation showLabels value={currentPath}>
                <BottomNavigationAction
                    label="Dashboard"
                    value="/owner/dashboard"
                    icon={<Dashboard />}
                    component={Link}
                    to="/owner/dashboard"
                />
                <BottomNavigationAction
                    label="My Listings"
                    value="/owner/my-listings"
                    icon={<ListAlt />}
                    component={Link}
                    to="/owner/my-listings"
                />
                <BottomNavigationAction
                    label="Requests"
                    value="/owner/requests"
                    icon={<MarkunreadMailbox />}
                    component={Link}
                    to="/owner/requests"
                />
                
                {/* --- YEH NAYA CHATS KA BUTTON HAI --- */}
                <BottomNavigationAction
                    label="Chats"
                    value="/owner/chats"
                    icon={<Chat />}
                    component={Link}
                    to="/owner/chats"
                />
                
                <BottomNavigationAction
                    label="Profile"
                    value="/owner/profile"
                    icon={<AccountCircle />}
                    component={Link}
                    to="/owner/profile"
                />
            </BottomNavigation>
        </Paper>
    );
};

export default OwnerBottomNavBar;
