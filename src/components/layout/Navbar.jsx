// src/components/layout/Navbar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
    return (
        <AppBar position="sticky" color="inherit" elevation={1}>
            <Container maxWidth="lg">
                <Toolbar disableGutters>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        <RouterLink to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
                            EasyNest
                        </RouterLink>
                    </Typography>
                    <Button component={RouterLink} to="/home" color="inherit">Home</Button>
                    <Button component={RouterLink} to="/wishlist" color="inherit">Wishlist</Button>
                    <Button component={RouterLink} to="/profile" color="inherit">Profile</Button>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;