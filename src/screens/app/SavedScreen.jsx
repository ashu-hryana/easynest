// /src/screens/app/SavedScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { ALL_STAYS } from '../../data/dummyData'; // Make sure this path is correct
import WishlistCard from '../../components/wishlist/WishlistCard';

import { Container, Box, Typography, Button, Grid } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const SavedScreen = () => {
    const navigate = useNavigate();
    const { savedItems } = useWishlist();

    // Yeh data logic bilkul same rahega!
    const savedStays = ALL_STAYS.filter(stay => savedItems.includes(stay.id));

    // The Empty State View
    if (savedStays.length === 0) {
        return (
            <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
                <FavoriteBorderIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2 }}>
                    Create your first wishlist
                </Typography>
                <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: '400px' }}>
                    As you search, tap the heart icon to save your favorite stays.
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/home')}
                    sx={{
                        mt: 3,
                        borderRadius: '30px',
                        py: 1.5,
                        px: 4,
                        backgroundColor: 'black',
                        '&:hover': { backgroundColor: '#333' }
                    }}
                >
                    Start exploring
                </Button>
            </Container>
        );
    }

    // The Populated State View
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                Wishlist
            </Typography>
            <Grid container spacing={3}>
                {savedStays.map((item) => (
                    <Grid item key={item.id} xs={12} sm={6} md={4}>
                        <WishlistCard item={item} />
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default SavedScreen;