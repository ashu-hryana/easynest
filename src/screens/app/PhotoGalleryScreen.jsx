// src/screens/app/PhotoGalleryScreen.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, CircularProgress, Grid, Stack, IconButton, Paper, Divider
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const PhotoGalleryScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        const docRef = doc(db, 'listings', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                // Ensure photos are in the correct format
                const photos = (data.photos || []).map(p => 
                    typeof p === 'string' ? { url: p, category: 'Uncategorized' } : p
                );
                setListing({ ...data, photos });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);
    
    const openLightbox = (photoUrl) => {
        // Find the index of the clicked photo in the main photos array
        const photoIndex = (listing.photos || []).findIndex(p => p.url === photoUrl);
        if (photoIndex !== -1) {
            setLightboxIndex(photoIndex);
            setLightboxOpen(true);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!listing) {
        return <Typography sx={{ textAlign: 'center', mt: 4 }}>Listing not found.</Typography>;
    }

    // --- NAYA LOGIC: PHOTOS KO CATEGORY KE HISAAB SE GROUP KARNA ---
    const groupedPhotos = (listing.photos || []).reduce((acc, photo) => {
        const category = photo.category || 'Uncategorized';
        (acc[category] = acc[category] || []).push(photo);
        return acc;
    }, {});

    const lightboxImages = (listing.photos || []).map(p => ({ src: p.url }));

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Paper elevation={1} square sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
                 <Container maxWidth="lg" sx={{display: 'flex', alignItems: 'center', py: 1}}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Photos of {listing.name}
                    </Typography>
                 </Container>
            </Paper>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {/* --- NAYA LIST-STYLE LAYOUT --- */}
                <Stack spacing={4}>
                    {Object.entries(groupedPhotos).map(([category, photos]) => (
                        <Box key={category}>
                            <Typography variant="h5" fontWeight="bold">{category}</Typography>
                            <Divider sx={{my: 1}} />
                            <Grid container spacing={1} mt={1}>
                                {photos.map((photo, index) => (
                                    <Grid item xs={6} sm={4} md={3} key={index}>
                                        <Box 
                                            component="img" 
                                            src={photo.url}
                                            onClick={() => openLightbox(photo.url)}
                                            sx={{
                                                width: '100%', 
                                                height: 200, 
                                                objectFit: 'cover', 
                                                borderRadius: 2, 
                                                cursor: 'pointer', 
                                                '&:hover': {opacity: 0.8, transform: 'scale(1.02)'},
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </Stack>
            </Container>
            
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxImages}
                index={lightboxIndex}
            />
        </Box>
    );
};

export default PhotoGalleryScreen;
