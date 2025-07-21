// src/components/owner/AllocateRoomModal.jsx

import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useNotification } from '../../contexts/NotificationContext';
import { doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const AllocateRoomModal = ({ open, onClose, bookingData, onAllocationSuccess }) => {
    const [roomId, setRoomId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const { showNotification } = useNotification();

    const handleAllocate = async () => {
        if (!roomId.trim()) {
            setError('Room number cannot be empty.');
            return;
        }
        setError('');
        setIsProcessing(true);

        try {
            await runTransaction(db, async (transaction) => {
                const bookingRef = doc(db, 'bookings', bookingData.id);
                // We don't need to get the booking again, as we already have the data.
                
                const listingRef = doc(db, 'listings', bookingData.listingId);
                const listingSnap = await transaction.get(listingRef);

                if (!listingSnap.exists()) throw new Error("The original listing was not found!");

                const listingData = listingSnap.data();
                const newAvailableUnits = (listingData.availableUnits || 0) - 1;

                // Update Booking with the new Room ID
                transaction.update(bookingRef, { 
                    status: 'ACTIVE', 
                    isActive: true, 
                    checkInDate: serverTimestamp(),
                    roomId: roomId.trim(), // The most important update
                    rentAmount: listingData.price || 0,
                    securityDeposit: listingData.securityDeposit || 0,
                    ratePerUnit: listingData.electricityRate || 10,
                });
                
                // Update Listing
                const listingUpdateData = { availableUnits: newAvailableUnits >= 0 ? newAvailableUnits : 0 };
                if (newAvailableUnits <= 0) {
                    listingUpdateData.status = 'archived';
                }
                transaction.update(listingRef, listingUpdateData);
            });

            showNotification("Room Allocated & Check-in Successful!", "success");
            onAllocationSuccess(bookingData.id); // Pass bookingId back to parent
            onClose(); // Close the modal

        } catch (err) {
            console.error("Allocation Error:", err);
            setError(`Error: ${err.message}`);
            showNotification(`Error: ${err.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" fontWeight="bold">
                    Allocate Room
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                    Assign a room number to complete the check-in for tenant: <strong>{bookingData?.studentName || ''}</strong>.
                </Typography>
                
                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

                <TextField
                    fullWidth
                    label="Enter Room Number / Name"
                    variant="outlined"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={isProcessing}
                />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose} disabled={isProcessing} color="secondary">Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAllocate} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? <CircularProgress size={24} /> : 'Allocate & Check-in'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AllocateRoomModal;