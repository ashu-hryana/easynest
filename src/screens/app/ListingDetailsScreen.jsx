import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Divider, Avatar, CircularProgress, AppBar,
    Toolbar, Button, IconButton, Paper, Grid, Stack, Chip, Link,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField // Dialog ke liye imports
} from '@mui/material';
import { Star, ArrowBack, Favorite, FavoriteBorder, Bed, Kitchen, Bathtub, Balcony, Gavel } from '@mui/icons-material';

// Firebase & Contexts
// --- FIX: Timestamp import add karein ---
import { doc, onSnapshot, addDoc, collection, serverTimestamp, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useWishlist } from '../../contexts/WishlistContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';

// Components and data
import AmenityChip from '../../components/details/AmenityChip';
import { AVAILABLE_AMENITIES, AVAILABLE_RULES } from '../../constants/data.jsx';

// Map Component
const ListingMap = ({ lat, lng }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (typeof window.L === 'undefined' || !lat || !lng || !mapContainerRef.current) return;
        if (mapRef.current) {
             mapRef.current.setView([lat, lng], 15);
             return;
        }
        
        const L = window.L;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
        L.marker([lat, lng]).addTo(mapRef.current);

    }, [lat, lng]);

    return <Paper ref={mapContainerRef} sx={{ height: '300px', borderRadius: 2, zIndex: 1, mt: 2 }} />;
};


const ListingDetailsScreen = () => {
    const { id: listingId } = useParams();
    const navigate = useNavigate();
    const { currentUser, currentUserDetails } = useAuth();
    const { addItem, removeItem, isSaved } = useWishlist();
    const { showNotification } = useNotification();

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);

    // --- NEW: Popup ke liye states ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [moveInDate, setMoveInDate] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!listingId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const docRef = doc(db, 'listings', listingId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setListing({ id: docSnap.id, ...docSnap.data() });
            } else {
                setListing(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching listing:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [listingId]);
    
    const handleWishlistToggle = () => {
        if (!currentUser) {
            showNotification("Please log in to use the wishlist.", "info");
            navigate('/login');
            return;
        }
        const saved = isSaved(listing.id);
        if (saved) {
            removeItem(listing.id);
            showNotification('Removed from wishlist', 'error');
        } else {
            addItem(listing);
            showNotification('Added to wishlist!', 'success');
        }
    };

    // --- FIX: handleBookNow ab popup se data lega ---
    const handleSendRequest = async () => {
        if (!currentUser) {
            showNotification("Please log in to book a property.", "info");
            navigate('/login');
            return;
        }
        if (!moveInDate) {
            showNotification("Please select a move-in date.", "error");
            return;
        }

        setIsBooking(true);
        try {
            const bookingsRef = collection(db, "bookings");
            const q = query(
                bookingsRef, 
                where("listingId", "==", listingId), 
                where("studentId", "==", currentUser.uid),
                where("status", "in", ["pending", "AWAITING_CHECKIN", "ACTIVE"])
            );
            const existingBookingSnap = await getDocs(q);

            if (!existingBookingSnap.empty) {
               const existingBooking = existingBookingSnap.docs[0].data();
               showNotification(`You already have an active or pending request. Status: ${existingBooking.status}`, "warning");
               setIsBooking(false);
               return;
            }

            await addDoc(bookingsRef, {
                listingId: listingId,
                listingName: listing.name,
                ownerId: listing.ownerId,
                studentId: currentUser.uid,
                studentName: currentUser.displayName || "Anonymous",
                studentPhotoURL: currentUser.photoURL || null,
                status: 'pending',
                requestDate: serverTimestamp(),
                moveInDate: Timestamp.fromDate(new Date(moveInDate)), // Save selected date
                message: message || `I am interested in booking your ${listing.propertyType || 'property'}.`, // Save user's message
                isActive: false
            });
            showNotification("Booking request sent successfully!", "success");
            setIsModalOpen(false); // Close the modal
            navigate('/my-bookings');

        } catch (error) {
            console.error("Error creating booking request:", error);
            showNotification("Failed to send booking request.", "error");
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!listing) {
        return <Box sx={{ textAlign: 'center', mt: 10 }}><Typography variant="h5">Listing not found</Typography></Box>;
    }

    const saved = isSaved(listing.id);
    const isOwnerViewing = currentUserDetails && currentUserDetails.role === 'owner' && currentUser.uid === listing.ownerId;

    return (
        <Box sx={{ pb: { xs: '90px', md: 0 } }}>
            <IconButton 
                onClick={() => navigate(-1)} 
                sx={{ 
                    position: 'fixed', 
                    top: 16, 
                    left: { xs: 16, md: 32 }, 
                    zIndex: 1300,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    '&:hover': { backgroundColor: 'white' } 
                }}
            >
                <ArrowBack />
            </IconButton>

            <Box sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    {(listing.photos && listing.photos.length > 0) ? (
                        listing.photos.map((photo, index) => (
                            <Box
                                key={index}
                                component="img"
                                src={photo.url || photo}
                                sx={{
                                    width: '100%', height: { xs: '300px', md: '450px' }, objectFit: 'cover',
                                    flex: '0 0 100%', scrollSnapAlign: 'start'
                                }}
                            />
                        ))
                    ) : (
                        <Box component="img" src={'https://placehold.co/1200x600/EEE/31343C?text=No+Photos+Available'} sx={{ width: '100%', height: { xs: '300px', md: '450px' }, objectFit: 'cover' }}/>
                    )}
                </Box>
                <IconButton onClick={handleWishlistToggle} sx={{ position: 'absolute', top: 16, right: { xs: 16, md: 32 }, zIndex: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)', '&:hover': { backgroundColor: 'white' } }}>
                    {saved ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
                <Button
                    variant="contained"
                    sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', '&:hover': {backgroundColor: 'black'} }}
                    onClick={() => navigate(`/listing/${listingId}/photos`)}
                >
                    Show all photos
                </Button>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                <Grid container spacing={{ xs: 3, md: 5 }}>
                    <Grid item xs={12} md={7}>
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{listing.name}</Typography>
                                <Typography sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                                    <Star sx={{ color: '#FFC700', mr: 0.5 }} /> {listing.rating || 'New'} ({listing.reviews || 0} reviews) · <Link component="button" variant="body2" onClick={() => {}} sx={{ ml: 0.5 }}>{listing.city}</Link>
                                </Typography>
                            </Box>
                            <Divider />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Property managed by {listing.ownerName}</Typography>
                                <Avatar src={listing.ownerPhotoURL} />
                            </Box>
                            <Divider />
                            
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>About this property</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                                    {listing.description || "No description provided."}
                                </Typography>
                                <Chip label={listing.propertyType} sx={{mt: 2}} />
                            </Box>
                            
                            {listing.propertyType === 'Full House' && listing.houseDetails && (
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>House Configuration</Typography>
                                    <Grid container spacing={2} mt={1}>
                                        <Grid item xs={6} sm={3}><Stack alignItems="center" spacing={1}><Bed/><Typography variant="caption">{listing.houseDetails.bedrooms} Bedrooms</Typography></Stack></Grid>
                                        <Grid item xs={6} sm={3}><Stack alignItems="center" spacing={1}><Kitchen/><Typography variant="caption">{listing.houseDetails.kitchens} Kitchen</Typography></Stack></Grid>
                                        <Grid item xs={6} sm={3}><Stack alignItems="center" spacing={1}><Bathtub/><Typography variant="caption">{listing.houseDetails.washrooms} Washrooms</Typography></Stack></Grid>
                                        {listing.houseDetails.hasTerrace && <Grid item xs={6} sm={3}><Stack alignItems="center" spacing={1}><Balcony/><Typography variant="caption">Terrace</Typography></Stack></Grid>}
                                    </Grid>
                                </Box>
                            )}

                            <Divider />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>What this place offers</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                    {listing.amenities?.map((amenityLabel) => {
                                        const amenity = AVAILABLE_AMENITIES.find(a => a.label === amenityLabel);
                                        if (!amenity) return null;
                                        return <AmenityChip key={amenity.label} icon={amenity.icon} label={amenity.label} />;
                                    })}
                                </Box>
                            </Box>
                            
                            {listing.rules && listing.rules.length > 0 && (
                                <>
                                    <Divider/>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>House Rules</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                            {listing.rules.map((ruleLabel) => {
                                                const rule = AVAILABLE_RULES.find(r => r.label === ruleLabel);
                                                if (!rule) {
                                                    return <AmenityChip key={ruleLabel} label={ruleLabel} />;
                                                }
                                                return <AmenityChip key={rule.label} icon={rule.icon} label={rule.label} />;
                                            })}
                                        </Box>
                                    </Box>
                                </>
                            )}

                            <Divider/>
                             <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Location</Typography>
                                <Typography color="text.secondary">{listing.address}, {listing.city}</Typography>
                                <ListingMap lat={listing.latitude} lng={listing.longitude} />
                            </Box>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 90, display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>₹{listing.price} / month</Typography>
                            <Divider sx={{my: 2}}/>
                            <Stack spacing={1.5}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography color="text.secondary">Security Deposit</Typography>
                                    <Typography fontWeight="bold">₹{listing.securityDeposit}</Typography>
                                </Box>
                                {listing.electricityRate && 
                                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                        <Typography color="text.secondary">Electricity Rate</Typography>
                                        <Typography fontWeight="bold">₹{listing.electricityRate} / unit</Typography>
                                    </Box>
                                }
                            </Stack>
                            {isOwnerViewing && (
                                <Button fullWidth variant="contained" size="large" onClick={() => navigate(`/owner/my-listings`)} sx={{ mt: 2, borderRadius: '8px', py: 1.5 }}>Manage Listing</Button>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            
            <AppBar position="fixed" color="inherit" sx={{ top: 'auto', bottom: 0, display: { xs: 'block', md: 'none' } }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{listing.price} / month</Typography>
                        <Typography variant="caption" color="text.secondary">
                            + ₹{listing.securityDeposit} security
                        </Typography>
                    </Box>
                    {isOwnerViewing ? (
                        <Button variant="contained" size="large" onClick={() => navigate(`/owner/my-listings`)}>Manage</Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            size="large" 
                            onClick={() => setIsModalOpen(true)}
                            sx={{ borderRadius: '20px', backgroundColor: '#FF385C', '&:hover': {backgroundColor: '#E01E5A'} }}
                        >
                            Request to Book
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            {/* --- NEW: Booking Request Popup (Dialog) --- */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Request to Book: {listing.name}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{pt: 1}}>
                        <TextField
                            fullWidth
                            label="Preferred Move-in Date"
                            type="date"
                            value={moveInDate}
                            onChange={(e) => setMoveInDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth
                            label="Message to Owner (Optional)"
                            multiline
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell the owner a bit about yourself, why you are interested, etc."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{p: 2}}>
                    <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSendRequest} 
                        variant="contained" 
                        disabled={isBooking}
                    >
                        {isBooking ? <CircularProgress size={24} /> : "Send Request"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ListingDetailsScreen;