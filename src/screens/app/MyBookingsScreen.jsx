// src/screens/app/MyBookingsScreen.jsx

import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Stack, Paper, Alert } from '@mui/material';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext';

import StudentBookingCard from '../../components/app/StudentBookingCard';

const MyBookingsScreen = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const bookingsCollectionRef = collection(db, 'bookings');
        const q = query(bookingsCollectionRef, where('studentId', '==', currentUser.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedBookings = [];
            querySnapshot.forEach((doc) => {
                fetchedBookings.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort bookings to show active ones first, then pending, then others.
            fetchedBookings.sort((a, b) => {
                const statusOrder = { 'ACTIVE': 1, 'AWAITING_CHECKIN': 2, 'pending': 3 };
                const aOrder = statusOrder[a.status] || 4;
                const bOrder = statusOrder[b.status] || 4;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return (b.requestDate?.toDate() || 0) - (a.requestDate?.toDate() || 0);
            });
            
            setBookings(fetchedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time bookings: ", error);
            setLoading(false);
        });

        return () => unsubscribe(); 
    }, [currentUser]);

    const handleWithdrawRequest = async (bookingId) => {
        if (!window.confirm("Are you sure you want to withdraw this booking request?")) {
            return;
        }
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            await deleteDoc(bookingRef);
            showNotification("Booking request withdrawn successfully.", "success");
        } catch (error) {
            console.error("Error withdrawing request: ", error);
            showNotification("Failed to withdraw request.", "error");
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ backgroundColor: 'white', p: 2, textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>My Bookings</Typography>
            </Paper>
            <Container maxWidth="md" sx={{ py: 3 }}>
                {bookings.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 3 }}>You haven't made any booking requests yet.</Alert>
                ) : (
                    <Stack spacing={3}>
                        {bookings.map(booking => (
                            <StudentBookingCard 
                                key={booking.id} 
                                booking={booking} 
                                onWithdraw={handleWithdrawRequest}
                            />
                        ))}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default MyBookingsScreen;
