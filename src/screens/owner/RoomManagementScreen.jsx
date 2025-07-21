// src/screens/owner/RoomManagementScreen.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
    Box, Container, Typography, Grid, CircularProgress, 
    Paper, Fab, Tooltip 
} from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';
import BookingCard from '../../components/owner/BookingCard';

const RoomManagementScreen = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const fetchBookings = async () => {
            try {
                const bookingsRef = collection(db, 'bookings');
                const q = query(
                    bookingsRef, 
                    where("ownerId", "==", currentUser.uid),
                    where("isActive", "==", true)
                );
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBookings(bookingsData);
            } catch (error) {
                console.error("Error fetching bookings: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [currentUser]);

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', py: 4, pb: '100px' }}>
            {/* === CHANGE 1: CONTAINER PADDING ADJUSTMENT === */}
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
                    Room Management
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : bookings.length > 0 ? (
                    // === CHANGE 2: GRID SPACING ADJUSTMENT FOR MOBILE ===
                    <Grid container spacing={{ xs: 2, md: 3 }}>
                        {bookings.map((booking) => (
                            <Grid item xs={12} sm={6} md={4} key={booking.id}>
                                <BookingCard booking={booking} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ textAlign: 'center', p: 4, borderRadius: '12px' }}>
                        <Typography variant="h6">No Active Rooms Found</Typography>
                        <Typography color="text.secondary">
                            When a tenant checks in, their room will appear here.
                        </Typography>
                    </Paper>
                )}
            </Container>

            {/* Floating Scanner Button */}
            <Tooltip title="Scan to Check-in a New Tenant">
                <Fab 
                    color="primary" 
                    aria-label="scan qr code"
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 80, md: 32 },
                        right: { xs: 16, md: 32 }
                    }}
                    onClick={() => navigate('/owner/scan-qr')}
                >
                    <QrCodeScanner />
                </Fab>
            </Tooltip>
        </Box>
    );
};

export default RoomManagementScreen;