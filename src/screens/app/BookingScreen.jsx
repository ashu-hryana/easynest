// src/screens/app/BookingScreen.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
    Box, Container, Typography, CircularProgress, Paper, Stack, Divider, Avatar, Button, TextField,
    ToggleButtonGroup, ToggleButton, Chip, IconButton // IconButton ko yahan import kiya gaya hai
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';

const BookingScreen = () => {
    const { id } = useParams(); // Listing ID
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [moveInDate, setMoveInDate] = useState('');
    const [message, setMessage] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState('');
    const [existingBooking, setExistingBooking] = useState(null);

    useEffect(() => {
        const fetchListingAndCheckBooking = async () => {
            if (!id || !currentUser) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Fetch listing details
                const docRef = doc(db, 'listings', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const listingData = { id: docSnap.id, ...docSnap.data() };
                    setListing(listingData);
                    // Automatically select the property type
                    if (listingData.propertyType) {
                        setSelectedRoomType(listingData.propertyType);
                    }
                } else {
                    showNotification("Listing not found.", "error");
                    navigate('/home');
                    return;
                }

                // Check if a booking request already exists for this listing by this user
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where('listingId', '==', id),
                    where('studentId', '==', currentUser.uid)
                );
                const querySnapshot = await getDocs(bookingsQuery);
                if (!querySnapshot.empty) {
                    setExistingBooking(querySnapshot.docs[0].data());
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                showNotification("Failed to load booking details.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchListingAndCheckBooking();
    }, [id, currentUser, navigate, showNotification]);

    const handleSendRequest = async () => {
        if (!moveInDate) {
            return showNotification("Please select a move-in date.", "error");
        }
         if (!selectedRoomType) {
            return showNotification("A room type must be selected.", "error");
        }
        setIsSubmitting(true);
        try {
            const bookingRequest = {
                listingId: listing.id,
                listingName: listing.name,
                ownerId: listing.ownerId,
                studentId: currentUser.uid,
                studentName: currentUser.displayName,
                studentPhotoURL: currentUser.photoURL,
                status: 'pending',
                moveInDate: new Date(moveInDate),
                roomType: selectedRoomType,
                message: message || `I am interested in booking your ${listing.propertyType}.`,
                requestDate: serverTimestamp(),
                isActive: false, // Yeh sabse zaroori hai
            };

            await addDoc(collection(db, 'bookings'), bookingRequest);
            showNotification("Booking request sent successfully!", "success");
            navigate('/my-bookings');

        } catch (error) {
            console.error("Error sending booking request:", error);
            showNotification("Failed to send request.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!listing) {
        return <Typography sx={{ textAlign: 'center', mt: 4 }}>Listing not found.</Typography>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh', py: 3 }}>
            <Container maxWidth="sm">
                <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h5" fontWeight="bold">Request to Book</Typography>
                    </Box>

                    <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 3 }}>
                        <Box component="img" src={listing.image} sx={{ width: 100, height: 100, borderRadius: 2, objectFit: 'cover' }} />
                        <Box>
                            <Typography fontWeight="bold">{listing.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{listing.address}</Typography>
                        </Box>
                    </Paper>

                    {existingBooking ? (
                         <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="h6">Request Already Sent</Typography>
                            <Typography color="text.secondary">
                                You have already sent a booking request for this property. The current status is:
                            </Typography>
                             <Chip label={existingBooking.status} color={existingBooking.status === 'accepted' || existingBooking.status === 'AWAITING_CHECKIN' ? 'success' : 'warning'} sx={{mt: 1, textTransform: 'capitalize'}}/>
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Stack spacing={3}>
                                <Typography variant="h6" fontWeight="bold">Your Request</Typography>
                                <TextField
                                    label="Preferred Move-in Date"
                                    type="date"
                                    value={moveInDate}
                                    onChange={(e) => setMoveInDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />
                                <Box>
                                    <Typography fontWeight="bold" gutterBottom>Confirm Property Type</Typography>
                                    <ToggleButtonGroup
                                        color="primary"
                                        value={selectedRoomType}
                                        exclusive
                                        fullWidth
                                    >
                                        <ToggleButton value={listing.propertyType} selected>
                                            {listing.propertyType}
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                <TextField
                                    label="Message to Owner (Optional)"
                                    multiline
                                    rows={3}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    fullWidth
                                />
                                <Button 
                                    variant="contained" 
                                    size="large" 
                                    onClick={handleSendRequest}
                                    disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                                >
                                    Send Request
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>
        </Box>
    );
};

export default BookingScreen;
