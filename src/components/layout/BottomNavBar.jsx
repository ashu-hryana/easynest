// src/components/layout/BottomNavBar.jsx
import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction, Box, useTheme } from '@mui/material';
import {
    Home,
    Favorite,
    ReceiptLong,
    AccountCircle,
    PeopleAlt,
    Chat,
    Search,
    Explore
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    {
        label: 'Explore',
        value: '/home',
        icon: Explore,
        to: '/home'
    },
    {
        label: 'Search',
        value: '/search',
        icon: Search,
        to: '/search'
    },
    {
        label: 'Saved',
        value: '/wishlist',
        icon: Favorite,
        to: '/wishlist'
    },
    {
        label: 'Bookings',
        value: '/my-bookings',
        icon: ReceiptLong,
        to: '/my-bookings'
    },
    {
        label: 'Profile',
        value: '/profile',
        icon: AccountCircle,
        to: '/profile'
    }
];

const BottomNavBar = () => {
    const location = useLocation();
    const theme = useTheme();
    const currentBasePath = "/" + location.pathname.split('/')[1];

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
            }}
            elevation={0}
        >
            <BottomNavigation
                value={currentBasePath}
                sx={{
                    backgroundColor: 'transparent',
                    height: 70,
                    '& .MuiBottomNavigationAction-root': {
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'text.secondary',
                        minWidth: 60,
                        '&.Mui-selected': {
                            color: 'primary.main',
                            '& .MuiSvgIcon-root': {
                                transform: 'scale(1.1)',
                            }
                        },
                        '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem',
                            transition: 'transform 0.2s ease-in-out',
                            mb: 1
                        }
                    }
                }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentBasePath === item.value;

                    return (
                        <BottomNavigationAction
                            key={item.value}
                            label={item.label}
                            value={item.value}
                            icon={<Icon />}
                            component={Link}
                            to={item.to}
                            sx={{
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                }
                            }}
                        />
                    );
                })}
            </BottomNavigation>
        </Paper>
    );
};

export default BottomNavBar;
