// src/screens/app/HomeScreen.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    InputAdornment, 
    Chip, 
    CircularProgress, 
    Grid, 
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import { Search, FavoriteBorder } from '@mui/icons-material';

import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

import FeaturedCard from '../../components/home/FeaturedCard';
import ListingRow from '../../components/home/ListingRow';

const FILTERS = ['Near You', 'Top Rated', 'Boys PGs', 'Girls PGs'];

const HomeScreen = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [activeFilter, setActiveFilter] = useState('Near You');

    useEffect(() => {
        const listingsCollectionRef = collection(db, 'listings');
        
        const q = query(
            listingsCollectionRef, 
            where('status', '==', 'live'),
            orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const listingsArray = [];
            querySnapshot.forEach((doc) => {
                listingsArray.push({
                    // --- FIX: `id: doc.id` ko spread operator ke BAAD rakha gaya hai ---
                    // Isse document ke andar wali 'id: null' field overwrite ho jayegi.
                    ...doc.data(),
                    id: doc.id, 
                });
            });
            setListings(listingsArray);
            setLoading(false);
        }, (error) => {
            console.error("Firestore listener error: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchText.trim()) {
            navigate(`/search?q=${searchText.trim()}`);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const featuredListings = listings.slice(0, 4);
    const newListings = listings.slice(4);

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', pb: '80px' }}>
            <Container maxWidth="lg" sx={{ pt: 2, px: { xs: 1, sm: 2 } }}>
                <Stack 
                    direction="row" 
                    spacing={1} 
                    alignItems="center" 
                    component="form" 
                    onSubmit={handleSearchSubmit} 
                    sx={{ mb: 1 }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by college, city, or locality..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>),
                            sx: { borderRadius: '25px', backgroundColor: 'white' }
                        }}
                    />
                    <Tooltip title="View Wishlist">
                        <IconButton onClick={() => navigate('/wishlist')} sx={{ bgcolor: 'white', p: 1.5, boxShadow: 1 }}>
                            <FavoriteBorder />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Box sx={{ display: 'flex', overflowX: 'auto', py: 2, '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    {FILTERS.map((filter) => (
                        <Chip
                            key={filter}
                            label={filter}
                            onClick={() => setActiveFilter(filter)}
                            sx={{
                                mr: 1,
                                flexShrink: 0,
                                backgroundColor: activeFilter === filter ? 'black' : '#e0e0e0',
                                color: activeFilter === filter ? 'white' : 'black',
                                '&:hover': { backgroundColor: activeFilter === filter ? '#333' : '#d1d1d1' }
                            }}
                        />
                    ))}
                </Box>
                
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Featured Stays</Typography>
                    <Box sx={{ display: 'flex', overflowX: 'auto', py: 2, gap: 2, '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        {featuredListings.map(item => (
                            <Box key={item.id} sx={{ flex: '0 0 85%', maxWidth: '320px' }}>
                                <FeaturedCard item={item} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>New on EasyNest</Typography>
                    <Grid container spacing={2}>
                        {newListings.map(item => (
                            <Grid item key={item.id} xs={12} sm={6}>
                                <ListingRow item={item} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default HomeScreen;