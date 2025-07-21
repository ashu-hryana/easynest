// src/screens/app/CheckInScreen.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Container, Typography, CircularProgress, Paper, Stack, IconButton, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react'; // Nayi library import karein

const CheckInScreen = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) {
                setLoading(false);
                return;
            };
            try {
                const docRef = doc(db, 'bookings', bookingId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Yahan booking data ke saath bookingId bhi store kar lo
                    setBooking({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching booking:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [bookingId]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!booking) {
        return (
            <Container maxWidth="xs" sx={{textAlign: 'center', mt: 4}}>
                <Typography variant="h6">Booking Not Found</Typography>
                <Typography>The link might be invalid or the booking has been removed.</Typography>
            </Container>
        );
    }
    
    // Sirf 'awaiting checkin' status par hi QR code dikhao
    if (booking.status !== 'AWAITING_CHECKIN') {
         return (
            <Container maxWidth="xs" sx={{textAlign: 'center', mt: 4}}>
                <Typography variant="h6">Invalid Booking Status</Typography>
                <Typography>This booking is not awaiting check-in. Its current status is '{booking.status}'.</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh', py: 2 }}>
            <Container maxWidth="xs">
                <Stack spacing={3} alignItems="center">
                    <Paper elevation={0} sx={{ p: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
                        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Your Check-in Code
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 4, borderRadius: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h5" align="center" fontWeight="bold">{booking.listingName}</Typography>
                        <Typography align="center" color="text.secondary" sx={{mb: 3}}>
                            Show this code to the owner to complete your check-in.
                        </Typography>
                        
                        {/* QR Code ab seedha aise render hoga */}
                        <QRCodeSVG 
                            value={booking.id} // <-- Sirf booking ID pass karein
                            size={250} // Size adjust kar sakte hain
                            style={{ maxWidth: '100%', height: 'auto' }}
                            imageSettings={{
                                excavate: true,
                                width: 40,
                                height: 40,
                                // src: "your_logo.png" // Aap yahan logo bhi daal sakte hain
                            }}
                        />
                    </Paper>

                    <Alert severity="warning">Do not share this code with anyone except the property owner.</Alert>
                </Stack>
            </Container>
        </Box>
    );
};

export default CheckInScreen;