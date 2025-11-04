// /src/screens/app/SearchResultsScreen.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, List, Divider, AppBar, Toolbar, IconButton, TextField, InputAdornment, Button, Fab } from '@mui/material';
import { ArrowBack, Search, Close, Tune, MapOutlined } from '@mui/icons-material';

// Dummy data aur converted card component import karo
import { ALL_STAYS } from '../../data/dummyData'; // Make sure this path is correct
import SearchResultCard from '../../components/search/SearchResultCard';

const SearchResultsScreen = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // URL se search query nikalo, jaise /search?q=delhi
    const initialQuery = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    // Yeh searching logic bilkul same rahega!
    const filteredStays = useMemo(() => {
        if (!searchQuery) {
            return ALL_STAYS;
        }
        return ALL_STAYS.filter(stay =>
            stay.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stay.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Search bar mein type karne par URL update karne ke liye
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery) {
                setSearchParams({ q: searchQuery });
            } else {
                setSearchParams({});
            }
        }, 300); // Thoda delay (debounce) taaki har character par URL update na ho

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, setSearchParams]);

    return (
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', pb: { xs: '80px', md: 0 } }}>
            {/* Modern Search Header */}
            <AppBar position="sticky" color="inherit" elevation={0} sx={{ backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Toolbar sx={{ minHeight: 64, py: 1 }}>
                    <IconButton
                        edge="start"
                        onClick={() => navigate(-1)}
                        sx={{
                            mr: 1,
                            color: 'text.primary',
                            '&:hover': { backgroundColor: 'grey.50' }
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search location, property..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'grey.50',
                                borderRadius: 3,
                                '& fieldset': { border: 'none' },
                                '&:hover fieldset': { border: 'none' },
                                '&.Mui-focused fieldset': { border: 'none', backgroundColor: 'background.paper' },
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {searchQuery && (
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchQuery('')}
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            <Close />
                                        </IconButton>
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Toolbar>
            </AppBar>

            {/* Search Results Info */}
            <Container maxWidth="md" sx={{ px: { xs: 2, md: 3 } }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: { xs: 2, md: 3 },
                    flexWrap: 'wrap',
                    gap: 1
                }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                            {filteredStays.length} properties found
                        </Typography>
                        {searchQuery && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                in "{searchQuery}"
                            </Typography>
                        )}
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<Tune />}
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            fontWeight: 500,
                            borderColor: 'grey.300',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'primary.50'
                            }
                        }}
                    >
                        Filters
                    </Button>
                </Box>

                {/* Results Grid */}
                {filteredStays.length > 0 ? (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr' },
                        gap: 3,
                        mb: 4
                    }}>
                        {filteredStays.map((item) => (
                            <Box key={item.id}>
                                <SearchResultCard item={item} />
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                            No properties found
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Try adjusting your search or filters
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => setSearchQuery('')}
                            sx={{ borderRadius: 3 }}
                        >
                            Clear search
                        </Button>
                    </Box>
                )}
            </Container>

            {/* Floating Map Button - Modern design */}
            <Fab
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 90, md: 30 },
                    right: 20,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    boxShadow: 3,
                    '&:hover': {
                        backgroundColor: 'primary.dark',
                        boxShadow: 4
                    }
                }}
            >
                <MapOutlined />
            </Fab>
        </Box>
    );
};

export default SearchResultsScreen;