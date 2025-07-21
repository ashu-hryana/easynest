// src/screens/owner/OwnerDashboardScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Fab, Grid, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material';
import { Add, MonetizationOn, People, PendingActions, MeetingRoom } from '@mui/icons-material'; // <-- 1. IMPORT ICON

import { useAuth } from '../../contexts/AuthContext.jsx';

// Components
import StatCard from '../../components/owner/StatCard';
import PropertyCard from '../../components/owner/PropertyCard';

const OwnerDashboardScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [timeFilter, setTimeFilter] = useState('Monthly');

    const handleTimeFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setTimeFilter(newFilter);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Dashboard
                </Typography>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        mb: 3, 
                        color: 'text.secondary',
                        fontSize: { xs: '1rem', md: '1.1rem' } 
                    }}
                >
                    Welcome back, {currentUser?.displayName || 'Owner'}!
                </Typography>

                <Grid container spacing={{ xs: 2, md: 3 }}>
                    {/* Left Column (Main Stats) */}
                    <Grid item xs={12} md={8}>
                        <Stack spacing={{ xs: 2, md: 3 }}>
                            <ToggleButtonGroup
                                color="primary"
                                value={timeFilter}
                                exclusive
                                onChange={handleTimeFilterChange}
                                size="small"
                            >
                                <ToggleButton value="Monthly">Monthly</ToggleButton>
                                <ToggleButton value="Yearly">Yearly</ToggleButton>
                            </ToggleButtonGroup>
                            
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="June Earnings" value="₹45,500" icon={<MonetizationOn fontSize="large" />} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="Total Occupancy" value="7 / 9 Beds" icon={<People fontSize="large" />} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <StatCard title="New Requests" value="3" icon={<PendingActions fontSize="large" />} />
                                </Grid>
                                
                                {/* --- 2. ADDED NEW CLICKABLE CARD --- */}
                                <Grid item xs={12} sm={6} sx={{ cursor: 'pointer' }} onClick={() => navigate('/owner/rooms')}>
                                    <StatCard 
                                        title="Room Management" 
                                        value="View Bookings" 
                                        icon={<MeetingRoom fontSize="large" />} 
                                    />
                                </Grid>
                                {/* ----------------------------------- */}

                            </Grid>
                        </Stack>
                    </Grid>

                    {/* Right Column (My Properties) */}
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                My Properties
                            </Typography>
                            <Stack spacing={2}>
                                <PropertyCard image="https://images.unsplash.com/photo-1580587771525-78b9dba3b914" name="Zen Student Living" status="4/5 Beds Occupied" />
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            <Fab
                color="primary"
                onClick={() => navigate('/owner/add-listing')}
                sx={{ position: 'fixed', bottom: 80, right: 30, backgroundColor: 'black' }}
            >
                <Add />
            </Fab>
        </Box>
    );
};

export default OwnerDashboardScreen;