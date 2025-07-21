// src/components/owner/BookingRequestCard.jsx
import React from 'react';
import { Paper, Box, Typography, Button, Stack, Chip } from '@mui/material';
import { format } from 'date-fns';

const BookingRequestCard = ({ request, onAccept, onReject }) => {
    // Convert Firestore timestamp to a readable date
    const moveInDate = request.moveInDate?.toDate ? format(request.moveInDate.toDate(), 'PPP') : 'Not specified';
    const requestDate = request.requestDate?.toDate ? format(request.requestDate.toDate(), 'PPP') : 'Not specified';

    const getStatusChipColor = (status) => {
        if (status === 'accepted') return 'success';
        if (status === 'rejected') return 'error';
        return 'warning'; // for 'pending'
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{request.listingName}</Typography>
                    <Chip 
                        label={request.status}
                        color={getStatusChipColor(request.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize', mt: 1 }}
                    />
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">Request from:</Typography>
                    <Typography>{request.studentName}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary">Requested Move-in Date:</Typography>
                    <Typography>{moveInDate}</Typography>
                </Box>
                {request.message && (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{request.message}</Typography>
                    </Paper>
                )}
                
                {request.status === 'pending' && (
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Button variant="contained" color="success" onClick={() => onAccept(request.id)}>
                            Accept
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => onReject(request.id)}>
                            Reject
                        </Button>
                    </Stack>
                )}
                <Typography variant="caption" color="text.secondary" align="right">
                    Requested on: {requestDate}
                </Typography>
            </Stack>
        </Paper>
    );
};

export default BookingRequestCard;
