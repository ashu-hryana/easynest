// src/screens/app/TenantDashboardScreen.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
// --- FIX: getDoc is needed for fetching owner details ---
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, updateDoc, getDoc, limit } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Box, Container, Typography, Grid, Paper, CircularProgress, 
    List, ListItem, ListItemText, Chip, Button, Stack, Divider, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Link, ListItemIcon, ListItemButton, Avatar
} from '@mui/material';
import { Receipt, BugReport, EventNote, MonetizationOn, Person, Home, MeetingRoom, Bolt, ThumbUp, Chat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { format } from 'date-fns';

// Helper to get color for complaint/bill status chip
const getStatusColor = (status, type = 'complaint') => {
    const statusUpper = status ? status.toUpperCase() : '';
    if (type === 'complaint') {
        switch (statusUpper) {
            case 'NEW': return 'error';
            case 'IN_PROGRESS': return 'warning';
            case 'RESOLVED': return 'success';
            default: return 'default';
        }
    } else { // Bill status
         switch (statusUpper) {
            case 'DUE': return 'warning';
            case 'OVERDUE': return 'error';
            case 'PAID': return 'success';
            case 'PAID_REQUESTED': return 'info';
            default: return 'default';
         }
    }
};

const TenantDashboardScreen = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [booking, setBooking] = useState(null);
    const [owner, setOwner] = useState(null);
    const [bills, setBills] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [openComplaintModal, setOpenComplaintModal] = useState(false);
    const [billDetailModalOpen, setBillDetailModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDescription, setComplaintDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        // --- DEFINITIVE FIX: The query is now corrected to use 'studentId' and 'status' ---
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('studentId', '==', currentUser.uid),
            where('status', '==', 'ACTIVE'),
            limit(1)
        );
        
        const unsubscribeBooking = onSnapshot(q, async (bookingSnapshot) => {
            if (bookingSnapshot.empty) {
                setBooking(null);
                setLoading(false);
                return;
            }

            const bookingData = { id: bookingSnapshot.docs[0].id, ...bookingSnapshot.docs[0].data() };
            setBooking(bookingData);

            // Fetch owner details
            if (bookingData.ownerId) {
                const ownerDocRef = doc(db, 'users', bookingData.ownerId);
                const ownerDocSnap = await getDoc(ownerDocRef);
                if (ownerDocSnap.exists()) {
                    setOwner(ownerDocSnap.data());
                }
            }

            // Fetch related bills and complaints using real-time listeners
            const billsQuery = query(collection(db, 'bills'), where('bookingId', '==', bookingData.id));
            onSnapshot(billsQuery, (billsSnapshot) => {
                const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBills(billsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
            });

            const complaintsQuery = query(collection(db, 'complaints'), where('bookingId', '==', bookingData.id));
            onSnapshot(complaintsQuery, (complaintsSnapshot) => {
                const complaintsData = complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setComplaints(complaintsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
            });

            setLoading(false);
        }, (error) => {
            console.error("Error fetching tenant data:", error);
            showNotification("Could not fetch your data.", "error");
            setLoading(false);
        });

        return () => unsubscribeBooking();

    }, [currentUser]);

    const handleOpenComplaintModal = () => setOpenComplaintModal(true);
    const handleCloseComplaintModal = () => {
        setOpenComplaintModal(false);
        setComplaintTitle('');
        setComplaintDescription('');
    };

    const handleComplaintSubmit = async () => {
        if (!complaintTitle || !complaintDescription) {
            return showNotification("Please fill out all fields.", "error");
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'complaints'), {
                bookingId: booking.id,
                tenantId: currentUser.uid,
                title: complaintTitle,
                description: complaintDescription,
                status: 'NEW',
                createdAt: serverTimestamp(),
            });
            showNotification("Complaint submitted successfully!", "success");
            handleCloseComplaintModal();
        } catch (error) {
            showNotification("Failed to submit complaint.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openBillDetailModal = (bill) => {
        setSelectedBill(bill);
        setBillDetailModalOpen(true);
    };
    const closeBillDetailModal = () => {
        setSelectedBill(null);
        setBillDetailModalOpen(false);
    };

    const handleRequestPaid = async () => {
        if (!selectedBill) return;
        setIsSubmitting(true);
        const billRef = doc(db, 'bills', selectedBill.id);
        try {
            await updateDoc(billRef, { status: 'PAID_REQUESTED' });
            showNotification("Request sent to owner for confirmation.", "success");
            closeBillDetailModal();
        } catch (error) {
            showNotification("Failed to send request. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }
    
    if (!booking) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="h5" sx={{mb: 1}}>No Active Booking Found</Typography>
                <Typography color="text.secondary">You can browse listings or check your past bookings.</Typography>
                <Button variant="contained" sx={{mt: 2}} onClick={() => navigate('/home')}>Browse Properties</Button>
            </Container>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', py: 2, minHeight: '100vh' }}>
            <Container maxWidth="lg">
                <Typography variant="h4" fontWeight="bold" sx={{px: {xs: 2, md: 0}}}>Welcome, {currentUser.displayName || 'Tenant'}</Typography>
                <Typography color="text.secondary" sx={{ mb: 3, px: {xs: 2, md: 0}}}>Here's an overview of your stay.</Typography>
                
                <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid item xs={12} md={7}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    <Home sx={{ mr: 1.5, color: 'primary.main' }} /> My Stay Details
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon><MeetingRoom/></ListItemIcon>
                                        <ListItemText primary="Room No." secondary={booking.roomId || 'Not Assigned'} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><Home/></ListItemIcon>
                                        <ListItemText primary="Property Name" secondary={booking.listingName || 'N/A'} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><Person/></ListItemIcon>
                                        <ListItemText 
                                            primary="Owner" 
                                            secondary={
                                                owner ? (
                                                    <Link component="button" variant="body2" onClick={() => navigate(`/user/${booking.ownerId}`)}>
                                                        {owner.displayName || 'Owner'}
                                                    </Link>
                                                ) : 'N/A'
                                            } 
                                        />
                                    </ListItem>
                                     <ListItem>
                                        <ListItemIcon><EventNote/></ListItemIcon>
                                        <ListItemText primary="Move-in Date" secondary={booking.checkInDate ? format(booking.checkInDate.toDate(), 'PPP') : 'N/A'}/>
                                    </ListItem>
                                </List>
                            </Paper>

                            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    <Receipt sx={{ mr: 1.5, color: 'primary.main' }} /> My Bills
                                </Typography>
                                <List dense>
                                    {bills.length > 0 ? bills.map(bill => (
                                        <ListItemButton key={bill.id} divider onClick={() => openBillDetailModal(bill)}>
                                            <ListItemIcon><Bolt/></ListItemIcon>
                                            <ListItemText 
                                                primary={<Typography fontWeight="bold">Electricity Bill - ₹{bill.amount.toFixed(2)}</Typography>}
                                                secondary={`Due: ${bill.dueDate ? format(bill.dueDate.toDate(), 'PPP') : 'N/A'}`}
                                            />
                                            <Chip label={bill.status.replace('_', ' ')} color={getStatusColor(bill.status, 'bill')} size="small"/>
                                        </ListItemButton>
                                    )) : <Typography color="text.secondary" sx={{p: 2}}>No bills found.</Typography>}
                                </List>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={5}>
                         <Stack spacing={3}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                    <MonetizationOn sx={{ mr: 1.5, color: 'primary.main' }} /> Rent Details
                                </Typography>
                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="h4" fontWeight="bold">₹{booking.rentAmount}</Typography>
                                        <Typography color="text.secondary">Next rent due on Day {booking.rentDueDateDay} of the month.</Typography>
                                    </Box>
                                    <Divider/>
                                    <Button variant="contained" onClick={() => alert('Pay Rent feature coming soon!')}>Pay Rent Now</Button>
                                </Stack>
                            </Paper>
                             <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                        <BugReport sx={{ mr: 1.5, color: 'primary.main' }} /> My Complaints
                                    </Typography>
                                    <Button variant="outlined" size="small" onClick={handleOpenComplaintModal}>
                                        Raise New
                                    </Button>
                                </Stack>
                                <List dense>
                                     {complaints.length > 0 ? complaints.map(complaint => (
                                         <ListItem key={complaint.id} divider>
                                             <ListItemText 
                                                 primary={complaint.title}
                                                 secondary={`Raised: ${complaint.createdAt ? format(complaint.createdAt.toDate(), 'PPP') : 'N/A'}`}
                                             />
                                             <Chip label={complaint.status.replace('_', ' ')} color={getStatusColor(complaint.status)} size="small"/>
                                         </ListItem>
                                     )) : <Typography color="text.secondary" sx={{p: 2}}>You're all set! No complaints.</Typography>}
                                </List>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
                
                {/* Complaint Dialog */}
                <Dialog open={openComplaintModal} onClose={handleCloseComplaintModal} fullWidth maxWidth="sm">
                    <DialogTitle>Raise a New Complaint</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{mt: 1}}>
                            <TextField autoFocus margin="dense" id="title" label="Complaint Title (e.g., Leaking Tap)" type="text" fullWidth variant="outlined" value={complaintTitle} onChange={(e) => setComplaintTitle(e.target.value)} />
                            <TextField margin="dense" id="description" label="Describe the issue in detail" type="text" fullWidth multiline rows={4} variant="outlined" value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{p: 2}}>
                        <Button onClick={handleCloseComplaintModal}>Cancel</Button>
                        <Button onClick={handleComplaintSubmit} variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? <CircularProgress size={24}/> : "Submit Complaint"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bill Detail Dialog */}
                <Dialog open={billDetailModalOpen} onClose={closeBillDetailModal} fullWidth maxWidth="xs">
                    <DialogTitle>Bill Details</DialogTitle>
                    <DialogContent>
                        {selectedBill && (
                            <Stack spacing={1.5}>
                                <Typography variant="h4" fontWeight="bold">₹{selectedBill.amount.toFixed(2)}</Typography>
                                <Chip label={selectedBill.status.replace('_', ' ')} color={getStatusColor(selectedBill.status, 'bill')} sx={{width: 'fit-content'}} />
                                <Divider/>
                                <Typography><b>Generated On:</b> {selectedBill.createdAt ? format(selectedBill.createdAt.toDate(), 'PPP, p') : 'N/A'}</Typography>
                                {selectedBill.status === 'PAID' ? (
                                    <Typography><b>Paid On:</b> {selectedBill.paidOnDate ? format(selectedBill.paidOnDate.toDate(), 'PPP, p') : 'N/A'}</Typography>
                                ) : (
                                    <Typography><b>Due Date:</b> {selectedBill.dueDate ? format(selectedBill.dueDate.toDate(), 'PPP') : 'N/A'}</Typography>
                                )}
                                <Typography><b>Owner's Remarks:</b> {selectedBill.remarks || 'None'}</Typography>
                                <Divider/>
                                <Typography variant="body2">
                                    {`Reading: ${selectedBill.billDetails.previousReading} to ${selectedBill.billDetails.currentReading} (${selectedBill.billDetails.unitsConsumed} units)`}
                                </Typography>
                                 <Typography variant="body2">
                                    {`Billing Period: ${selectedBill.billDetails.dayDifference} days`}
                                </Typography>
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeBillDetailModal}>Close</Button>
                        {selectedBill?.status === 'DUE' && (
                            <Button 
                                variant="contained" 
                                onClick={handleRequestPaid}
                                disabled={isSubmitting}
                                startIcon={<ThumbUp />}
                            >
                                {isSubmitting ? 'Sending...' : 'I Have Paid'}
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default TenantDashboardScreen;
