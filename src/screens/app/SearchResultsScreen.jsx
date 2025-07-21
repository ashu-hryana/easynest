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
        <Box sx={{ flex: 1, backgroundColor: 'white' }}>
            {/* Custom Header */}
            <AppBar position="sticky" color="inherit" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" onClick={() => navigate(-1)}>
                        <ArrowBack />
                    </IconButton>
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ ml: 1 }}
                        InputProps={{
                            disableUnderline: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    {searchQuery && (
                                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                                            <Close />
                                        </IconButton>
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Toolbar>
            </AppBar>

            {/* Results Info */}
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {filteredStays.length} stays found
                    </Typography>
                    <Button variant="outlined" startIcon={<Tune />} sx={{ borderRadius: '20px', color: 'black', borderColor: 'grey.400' }}>
                        Filters
                    </Button>
                </Box>

                {/* Results List */}
                <List>
                    {filteredStays.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <SearchResultCard item={item} />
                            {index < filteredStays.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            </Container>

            {/* Floating Map Button */}
            <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30, backgroundColor: 'black' }}>
                <MapOutlined />
            </Fab>
        </Box>
    );
};

export default SearchResultsScreen;