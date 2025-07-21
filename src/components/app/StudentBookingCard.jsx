// src/components/app/StudentBookingCard.jsx

import React from 'react';
import { Paper, Box, Typography, Chip, Stack, Button, Divider } from '@mui/material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { QrCodeScanner, Chat, Cancel, Dashboard } from '@mui/icons-material';

const StudentBookingCard = ({ booking, onWithdraw }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const getStatusChip = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <Chip label="Active" color="primary" size="small" variant="filled"/>;
            case 'AWAITING_CHECKIN':
                return <Chip label="Approved" color="success" size="small" variant="filled"/>;
            case 'pending':
                return <Chip label="Pending" color="warning" size="small" />;
            case 'rejected':
                return <Chip label="Rejected" color="error" size="small" />;
            case 'COMPLETED':
                return <Chip label="Completed" color="default" size="small" variant="outlined"/>;
            default:
                return <Chip label={status || "Unknown"} color="default" size="small" />;
        }
    };

    const handleStartChat = async (ownerId) => {
        if (!currentUser || !ownerId) return;
        
        const participants = [currentUser.uid, ownerId].sort();
        const connectionId = participants.join('_');
        const connectionRef = doc(db, 'connections', connectionId);

        try {
            const connectionSnap = await getDoc(connectionRef);
            if (!connectionSnap.exists()) {
                await setDoc(connectionRef, {
                    participants: participants,
                    lastMessage: { text: "You can now chat regarding your booking.", senderId: 'system', timestamp: new Date() },
                    createdAt: new Date(),
                });
            }
            navigate(`/chat/${connectionId}`);
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    const requestDate = booking.requestDate?.toDate ? format(booking.requestDate.toDate(), 'PPP') : 'N/A';
    const moveInDate = booking.moveInDate?.toDate ? format(booking.moveInDate.toDate(), 'PPP') : 'N/A';

    // --- FIX: ACTIVE BOOKING KE LIYE NAYA UI ---
    if (booking.status === 'ACTIVE') {
        return (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderLeft: '5px solid', borderColor: 'primary.main' }}>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{booking.listingName}</Typography>
                        {getStatusChip(booking.status)}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Your stay is currently active. You can manage your bills, complaints, and other details from your dashboard.
                    </Typography>
                    <Divider />
                    <Button
                        variant="contained"
                        startIcon={<Dashboard />}
                        onClick={() => navigate('/dashboard')} // Yeh student ke Tenant Dashboard par le jayega
                    >
                        Manage Your Stay
                    </Button>
                </Stack>
            </Paper>
        );
    }

    // Purana UI baaki sab statuses ke liye
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{booking.listingName}</Typography>
                    {getStatusChip(booking.status)}
                </Box>
                
                <Box>
                    <Typography variant="body2" color="text.secondary">Requested Move-in Date</Typography>
                    <Typography>{moveInDate}</Typography>
                </Box>
                
                <Box>
                    <Typography variant="body2" color="text.secondary">Your Message</Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', pl: 1, borderLeft: '3px solid #eee' }}>"{booking.message}"</Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary" align="right">
                    Sent on: {requestDate}
                </Typography>
                
                {booking.status === 'AWAITING_CHECKIN' && (
                    <>
                        <Divider sx={{ pt: 1 }} />
                        <Box>
                             <Typography variant="body2" color="text.secondary" mb={1}>
                                 Your request is approved! Show this QR to the owner for check-in.
                             </Typography>
                            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    startIcon={<QrCodeScanner />}
                                    onClick={() => navigate(`/booking/${booking.id}/check-in`)}
                                >
                                    Show Check-in QR Code
                                </Button>
                                <Button 
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Chat />}
                                    onClick={() => handleStartChat(booking.ownerId)}
                                >
                                    Chat with Owner
                                </Button>
                            </Stack>
                        </Box>
                    </>
                )}

                {booking.status === 'pending' && (
                     <>
                        <Divider sx={{ pt: 1 }} />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                                variant="outlined" 
                                color="error"
                                size="small"
                                startIcon={<Cancel />}
                                onClick={() => onWithdraw(booking.id)}
                            >
                                Withdraw Request
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default StudentBookingCard;
