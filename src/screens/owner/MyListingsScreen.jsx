// src/screens/owner/MyListingsScreen.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useListing } from '../../contexts/ListingContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { 
    Box, Container, Typography, Grid, Card, CardContent, CardMedia, 
    CircularProgress, Stack, Button, IconButton, Chip, Dialog, DialogActions, DialogTitle, DialogContentText, Divider, CardActionArea,
    TextField, InputAdornment, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Add, Edit, Delete, LocationOn, MeetingRoom, CurrencyRupee, PriceChange } from '@mui/icons-material';

// Naya aur improved Listing Card component
const OwnerListingCard = ({ listing, onEdit, onDelete, onPricingEdit }) => {
    const navigate = useNavigate();
    
    const getPriceText = () => {
        if (listing.price) {
            return `Starts from ₹${listing.price}/month`;
        }
        return "Price not set";
    };

    const getAvailabilityText = () => {
        if (listing.propertyType === 'Full House') {
            return "Available for Rent";
        }
        if (listing.availableUnits) {
            const unitLabel = listing.propertyType.includes('Studio') ? 'Studio Flats' : 'Flats';
            return `${listing.availableUnits} ${unitLabel} available`;
        }
        return "Availability not set";
    };

    return (
        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* --- CARD AB CLICKABLE HAI --- */}
            <CardActionArea onClick={() => navigate(`/listing/${listing.id}`)}>
                <CardMedia
                    component="img"
                    height="160"
                    image={listing.image || 'https://placehold.co/600x400?text=No+Image'}
                    alt={listing.name}
                />
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography gutterBottom variant="h6" component="div" fontWeight="bold">
                            {listing.name}
                        </Typography>
                        <Chip label={listing.propertyType || 'N/A'} size="small" />
                    </Stack>
                    
                    <Stack spacing={1} mt={1} color="text.secondary">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" />
                            <Typography variant="body2">{listing.city}</Typography>
                        </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CurrencyRupee fontSize="small" />
                            <Typography variant="body2">{getPriceText()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MeetingRoom fontSize="small" />
                            <Typography variant="body2">{getAvailabilityText()}</Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </CardActionArea>
            <Divider />
            <Stack direction="row" spacing={1} sx={{ p: 1 }} justifyContent="space-around">
                <Button size="small" startIcon={<Edit />} onClick={onEdit}>Edit</Button>
                {/* --- NAYA PRICING SHORTCUT BUTTON --- */}
                <Button size="small" startIcon={<PriceChange />} onClick={onPricingEdit}>Pricing</Button>
                <Button size="small" color="error" startIcon={<Delete />} onClick={onDelete}>Delete</Button>
            </Stack>
        </Card>
    );
};

// --- NAYA PRICING EDIT MODAL COMPONENT ---
const PricingEditModal = ({ open, onClose, listing, onSave }) => {
    const [pricingData, setPricingData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Jab bhi naya listing select ho, modal ke form ko uski details se bhar do
        if (listing) {
            setPricingData({
                price: listing.price || '',
                securityDeposit: listing.securityDeposit || '',
                availableUnits: listing.availableUnits || '',
                electricityRate: listing.electricityRate || '',
                electricityPaymentBy: listing.electricityPaymentBy || '',
            });
        }
    }, [listing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setPricingData(prev => ({ ...prev, [name]: numericValue }));
    };

    const handleToggleChange = (event, newValue) => {
        if (newValue !== null) {
            setPricingData(prev => ({ ...prev, electricityPaymentBy: newValue }));
        }
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        await onSave(listing.id, pricingData);
        setIsSaving(false);
        onClose();
    };

    if (!listing) return null;

    const { propertyType } = listing;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit Pricing for {listing.name}</DialogTitle>
            <DialogContentText sx={{px: 3, mb: 2}}>Make quick adjustments to your pricing details here.</DialogContentText>
            <Divider/>
            <Box p={3}>
                {propertyType && propertyType !== 'Full House' ? (
                    <Stack spacing={2}>
                        <TextField label={`Number of available ${propertyType.includes('Studio') ? 'Studio Flats' : 'Flats'}`} name="availableUnits" type="number" value={pricingData.availableUnits} onChange={handleChange} fullWidth />
                        <TextField label="Price per Flat (per month)" name="price" type="number" value={pricingData.price} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        <TextField label="Security Deposit" name="securityDeposit" type="number" value={pricingData.securityDeposit} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        <TextField label="Electricity Rate (per unit/kWh)" name="electricityRate" type="number" value={pricingData.electricityRate} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        <TextField label="Price (per month)" name="price" type="number" value={pricingData.price} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        <TextField label="Security Deposit" name="securityDeposit" type="number" value={pricingData.securityDeposit} onChange={handleChange} fullWidth InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        <Typography fontWeight="bold" pt={1}>Who pays the electricity bill?</Typography>
                        <ToggleButtonGroup color="primary" value={pricingData.electricityPaymentBy} exclusive onChange={handleToggleChange} fullWidth>
                            <ToggleButton value="Tenant to Company">Tenant to Company</ToggleButton>
                            <ToggleButton value="Tenant to Owner">Tenant to Owner</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                )}
            </Box>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveClick} variant="contained" disabled={isSaving}>
                    {isSaving ? <CircularProgress size={24} /> : "Save Pricing"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


const MyListingsScreen = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { updateListingData } = useListing();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // States for modals
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [listingToDelete, setListingToDelete] = useState(null);
    const [pricingModalOpen, setPricingModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'listings'), where('ownerId', '==', currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userListings = [];
            querySnapshot.forEach((doc) => {
                userListings.push({ ...doc.data(), id: doc.id });
            });
            setListings(userListings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time listings:", error);
            showNotification("Could not fetch listings.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, showNotification]);

    const handleEdit = (listing) => {
        const formattedPhotos = listing.photos.map(photoUrl => ({
            url: photoUrl,
            category: 'Uncategorized' // Edit flow ke liye default category
        }));
        updateListingData({ ...listing, photos: formattedPhotos });
        navigate('/owner/add-listing');
    };

    const handlePricingEditClick = (listing) => {
        setSelectedListing(listing);
        setPricingModalOpen(true);
    };

    const handleUpdatePricing = async (listingId, newPricingData) => {
        const listingRef = doc(db, 'listings', listingId);
        try {
            await updateDoc(listingRef, newPricingData);
            showNotification("Pricing updated successfully!", "success");
        } catch (error) {
            console.error("Error updating pricing:", error);
            showNotification("Failed to update pricing.", "error");
        }
    };

    const handleDeleteClick = (listingId) => {
        setListingToDelete(listingId);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!listingToDelete) return;
        try {
            await deleteDoc(doc(db, 'listings', listingToDelete));
            showNotification("Listing deleted successfully.", "success");
        } catch (error) {
            console.error("Error deleting listing: ", error);
            showNotification("Failed to delete listing.", "error");
        } finally {
            setOpenDeleteDialog(false);
            setListingToDelete(null);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh', py: 2 }}>
            <Container maxWidth="lg">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold"> My Listings </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/owner/add-listing')}> Add New </Button>
                </Stack>

                {listings.length > 0 ? (
                    <Grid container spacing={3}>
                        {listings.map(listing => (
                            <Grid item key={listing.id} xs={12} sm={6} md={4}>
                                <OwnerListingCard 
                                    listing={listing} 
                                    onEdit={() => handleEdit(listing)}
                                    onPricingEdit={() => handlePricingEditClick(listing)}
                                    onDelete={() => handleDeleteClick(listing.id)} 
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 5 }}>
                        You haven't listed any properties yet. Click "Add New" to get started.
                    </Typography>
                )}
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContentText sx={{px: 3, pb: 2}}>
                    Are you sure you want to permanently delete this listing? This action cannot be undone.
                </DialogContentText>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Naya Pricing Edit Modal */}
            <PricingEditModal
                open={pricingModalOpen}
                onClose={() => setPricingModalOpen(false)}
                listing={selectedListing}
                onSave={handleUpdatePricing}
            />
        </Box>
    );
};

export default MyListingsScreen;
