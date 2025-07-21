// src/screens/owner/QRScannerScreen.jsx

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Container, Button, Alert, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { doc, getDoc } from 'firebase/firestore'; // runTransaction and serverTimestamp removed
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import AllocateRoomModal from '../../components/owner/AllocateRoomModal'; // Import the new modal

const QRScannerScreen = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    
    // State for the modal
    const [modalOpen, setModalOpen] = useState(false);
    const [bookingForAllocation, setBookingForAllocation] = useState(null);

    const scannerRef = useRef(null);

    useEffect(() => {
        if (typeof Html5QrcodeScanner === 'undefined') {
            showNotification("Scanner library could not be loaded.", "error");
            return;
        }
        const scanner = new Html5QrcodeScanner("qr-reader-container", { qrbox: { width: 250, height: 250 }, fps: 10 }, false);
        scannerRef.current = scanner;

        const onScanSuccess = (decodedText) => {
            scanner.clear();
            handleScanLogic(decodedText);
        };
        const onScanFailure = (error) => {};

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            if (scannerRef.current && scannerRef.current.getState() === 2) {
                scannerRef.current.clear().catch(err => console.error("Error cleaning up scanner:", err));
            }
        };
    }, []);

    // This function now just verifies the booking and decides whether to open the modal
    const handleScanLogic = async (bookingId) => {
        setIsVerifying(true); 
        showNotification("QR Code Scanned! Verifying...", "info");
        
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) throw new Error("Booking not found.");

            const bookingData = { id: bookingSnap.id, ...bookingSnap.data() };

            if (bookingData.ownerId !== currentUser.uid) throw new Error("This booking does not belong to your property.");
            if (bookingData.status !== 'AWAITING_CHECKIN') throw new Error(`This booking is already '${bookingData.status}'.`);
            
            // --- THE MAIN LOGIC CHANGE IS HERE ---
            // If roomId is missing, it's a first-time check-in.
            if (!bookingData.roomId) {
                setBookingForAllocation(bookingData);
                setModalOpen(true);
                setIsVerifying(false); // Stop the spinner to show the modal
            } else {
                // If room is already allocated, but status is AWAITING_CHECKIN, this is an inconsistent state.
                // It's better to show an error than to proceed.
                throw new Error("This booking already has a room allocated. Cannot re-check-in.");
            }

        } catch (error) {
            setIsVerifying(false);
            showNotification(`Error: ${error.message}`, "error");
            setTimeout(() => navigate('/owner/dashboard'), 2000);
        }
    };
    
    return (
        <>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Typography variant="h4" fontWeight="bold" align="center" mb={2}>
                    Scan Check-in QR Code
                </Typography>
                <Alert severity="info" sx={{mb: 2}}>
                    Point the camera at the tenant's QR code to complete their check-in process.
                </Alert>
                <Paper sx={{p: 2, borderRadius: 2, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {isVerifying ? (
                        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                            <CircularProgress />
                            <Typography sx={{mt: 2}}>Verifying and updating...</Typography>
                        </Box>
                    ) : (
                        // If modal is open, this part is hidden but still in the DOM.
                        // We could add logic to hide it if needed, but it shouldn't be visible behind the modal.
                        <Box id="qr-reader-container" sx={{ width: '100%', maxWidth: '500px', margin: 'auto' }} />
                    )}
                </Paper>
                <Button fullWidth variant="outlined" sx={{mt: 2}} onClick={() => navigate(-1)}>
                    Cancel
                </Button>
            </Container>

            {/* Render the modal */}
            {bookingForAllocation && (
                <AllocateRoomModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    bookingData={bookingForAllocation}
                    onAllocationSuccess={(allocatedBookingId) => {
                        navigate(`/owner/rooms/${allocatedBookingId}`);
                    }}
                />
            )}
        </>
    );
};

export default QRScannerScreen;