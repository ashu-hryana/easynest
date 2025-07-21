import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Container, Typography, Box, CircularProgress, Stack, Paper, Button, Divider, Avatar, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Date format karne ke liye
import { Event, Message, ThumbDown, ThumbUp } from '@mui/icons-material'; // Naye icons

// --- NEW & IMPROVED BOOKING REQUEST CARD ---
const BookingRequestCard = ({ request, onStatusChange }) => {
    const navigate = useNavigate();

    const getStatusChip = (status) => {
        switch (status) {
            case 'AWAITING_CHECKIN':
                return <Chip label="Approved" color="success" size="small" variant="filled" />;
            case 'rejected':
                return <Chip label="Rejected" color="error" size="small" />;
            case 'COMPLETED':
                return <Chip label="Completed" color="default" size="small" variant="outlined" />;
            case 'ACTIVE':
                return <Chip label="Active" color="primary" size="small" variant="filled" />;
            default: // pending
                return <Chip label="Pending" color="warning" size="small" />;
        }
    };

    // Safely format the timestamp from Firestore
    const moveInDate = request.moveInDate?.toDate ? format(request.moveInDate.toDate(), 'do MMMM, yyyy') : 'Not specified';

    return (
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Stack spacing={2}>
                {/* Top Section: Student and Property Info */}
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                        src={request.studentPhotoURL}
                        sx={{ width: 56, height: 56, cursor: 'pointer' }}
                        onClick={() => navigate(`/user/${request.studentId}`)}
                    >
                        {request.studentName ? request.studentName[0].toUpperCase() : 'S'}
                    </Avatar>
                    <Box flexGrow={1}>
                        <Typography variant="h6" fontWeight="bold">{request.studentName || 'Student Name'}</Typography>
                        <Typography color="text.secondary" variant="body2">
                            Wants to book: <strong>{request.listingName || 'Property'}</strong>
                        </Typography>
                    </Box>
                    {getStatusChip(request.status)}
                </Stack>

                <Divider />

                {/* Details Section: Move-in Date and Message */}
                <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Event color="action" />
                        <Typography variant="body1">
                            Requested Move-in: <strong>{moveInDate}</strong>
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Message color="action" sx={{ mt: 0.5 }}/>
                        <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{request.message || 'No message provided.'}"
                        </Typography>
                    </Box>
                </Stack>

                {/* Action Buttons for Pending Requests */}
                {request.status === 'pending' && (
                    <>
                        <Divider />
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<ThumbDown />}
                                onClick={() => onStatusChange(request.id, 'rejected')}
                            >
                                Reject
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<ThumbUp />}
                                onClick={() => onStatusChange(request.id, 'accepted')}
                            >
                                Accept
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </Paper>
    );
};


const BookingRequestsScreen = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bookings'),
            where('ownerId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allOwnerBookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            allOwnerBookings.sort((a, b) => {
                const statusOrder = { 'pending': 1, 'AWAITING_CHECKIN': 2, 'ACTIVE': 3 };
                const aOrder = statusOrder[a.status] || 4;
                const bOrder = statusOrder[b.status] || 4;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return (b.requestDate?.toDate() || 0) - (a.requestDate?.toDate() || 0);
            });
            
            setRequests(allOwnerBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching booking requests: ", error);
            showNotification("Could not fetch requests.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, showNotification]);

    const handleStatusChange = async (requestId, newStatus) => {
        const requestRef = doc(db, 'bookings', requestId);
        
        try {
            const finalStatus = newStatus === 'accepted' ? 'AWAITING_CHECKIN' : newStatus;
            await updateDoc(requestRef, { status: finalStatus });

            if (finalStatus === 'AWAITING_CHECKIN') {
                showNotification("Request approved! Tenant can now check-in.", "success");
            } else {
                 showNotification("Request has been rejected.", "info");
            }
        } catch (error) {
            console.error("Error updating status: ", error);
            showNotification("Failed to update request status.", "error");
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh', py: 2 }}>
            <Container maxWidth="md">
                <Typography variant="h4" fontWeight="bold" sx={{ my: 2 }}>
                    Booking Requests
                </Typography>
                {requests.length > 0 ? (
                    <Stack spacing={2}>
                        {requests.map(request => (
                            <BookingRequestCard 
                                key={request.id} 
                                request={request} 
                                onStatusChange={handleStatusChange} 
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 5 }}>
                        You have no new booking requests.
                    </Typography>
                )}
            </Container>
        </Box>
    );
};

export default BookingRequestsScreen;
