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
    Tooltip,
    Button,
    Fade
} from '@mui/material';
import { Search, FavoriteBorder, MyLocation, Tune } from '@mui/icons-material';

import AdvancedSearchModal from '../../components/search/AdvancedSearchModal';
import { searchProperties, getCurrentLocation, getPopularAreas } from '../../services/searchService';

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
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({});
    const [popularAreas, setPopularAreas] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

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
        <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh', pb: { xs: '80px', md: 0 } }}>
            <Container maxWidth="md" sx={{ pt: { xs: 2, md: 3 }, px: { xs: 2, md: 3 } }}>
                {/* Header Section */}
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        Hi there! 👋
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                        Find your perfect rental
                    </Typography>
                </Box>

                {/* Search Section */}
                <Box
                    component="form"
                    onSubmit={handleSearchSubmit}
                    sx={{ mb: 3 }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by location, college, or property..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="View Wishlist">
                                        <IconButton
                                            onClick={() => navigate('/wishlist')}
                                            sx={{
                                                bgcolor: 'grey.50',
                                                '&:hover': { bgcolor: 'grey.100' }
                                            }}
                                        >
                                            <FavoriteBorder />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 3,
                                backgroundColor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { boxShadow: 2 },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }
                        }}
                        sx={{ mb: 2 }}
                    />
                </Box>

                {/* Filter Chips */}
                <Box sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    py: 1,
                    mb: 3,
                    gap: 2,
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}>
                    {FILTERS.map((filter) => (
                        <Chip
                            key={filter}
                            label={filter}
                            onClick={() => setActiveFilter(filter)}
                            sx={{
                                flexShrink: 0,
                                backgroundColor: activeFilter === filter ? 'primary.main' : 'grey.100',
                                color: activeFilter === filter ? 'white' : 'text.primary',
                                fontWeight: activeFilter === filter ? 600 : 500,
                                '&:hover': {
                                    backgroundColor: activeFilter === filter ? 'primary.dark' : 'grey.200'
                                },
                                px: 2,
                                py: 1,
                            }}
                        />
                    ))}
                </Box>

                {/* Featured Stays Section */}
                {featuredListings.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                            Featured Stays
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            gap: 3,
                            pb: 1,
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none'
                        }}>
                            {featuredListings.map(item => (
                                <Box key={item.id} sx={{
                                    flex: { xs: '0 0 75%', sm: '0 0 60%', md: '0 0 40%' },
                                    maxWidth: '380px'
                                }}>
                                    <FeaturedCard item={item} />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* New Listings Section */}
                {newListings.length > 0 && (
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                            New on EasyNest
                        </Typography>
                        <Grid container spacing={3}>
                            {newListings.slice(0, 6).map(item => (
                                <Grid item key={item.id} xs={12} sm={6} md={4}>
                                    <ListingRow item={item} />
                                </Grid>
                            ))}
                        </Grid>

                        {newListings.length > 6 && (
                            <Box sx={{ textAlign: 'center', mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/search')}
                                    sx={{
                                        borderRadius: 3,
                                        px: 4,
                                        py: 1.5,
                                        fontWeight: 500
                                    }}
                                >
                                    View all properties
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Empty State */}
                {!loading && listings.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                            No properties available yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Check back soon for new listings!
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default HomeScreen;