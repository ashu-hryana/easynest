// src/components/layout/BottomNavBar.jsx
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';
import { Home, Favorite, ReceiptLong, AccountCircle, PeopleAlt, Chat } from '@mui/icons-material'; // Chat icon import karo
import { Link, useLocation } from 'react-router-dom';

const BottomNavBar = () => {
    const location = useLocation();
    const currentBasePath = "/" + location.pathname.split('/')[1];
    
    const isHomeActive = currentBasePath === '/home';

    return (
        <Paper 
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} 
            elevation={3}
        >
            <BottomNavigation value={currentBasePath}>
                <BottomNavigationAction
                    label="Home"
                    value="/home"
                    icon={
                        <Box
                            component="img"
                            src={isHomeActive ? "/home-icon-active.png" : "/home-icon-inactive.png"}
                            alt="Home"
                            sx={{ width: 24, height: 24, objectFit: 'contain', filter: isHomeActive ? 'none' : 'grayscale(80%) opacity(0.7)' }}
                        />
                    }
                    component={Link} to="/home"
                />
                
                <BottomNavigationAction label="Bookings" value="/my-bookings" icon={<ReceiptLong />} component={Link} to="/my-bookings" />
                <BottomNavigationAction label="Roommates" value="/roommates" icon={<PeopleAlt />} component={Link} to="/roommates" />
                
                {/* --- YEH NAYA BUTTON ADD HUA HAI --- */}
                <BottomNavigationAction
                    label="Chats"
                    value="/chats"
                    icon={<Chat />}
                    component={Link}
                    to="/chats"
                />
                
                <BottomNavigationAction label="Profile" value="/profile" icon={<AccountCircle />} component={Link} to="/profile" />
            </BottomNavigation>
        </Paper>
    );
};

export default BottomNavBar;
