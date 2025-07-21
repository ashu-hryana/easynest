// src/screens/owner/listing_flow/Step3_Photos.jsx

import React, { useState, useRef } from 'react';
import { useListing } from '../../../contexts/ListingContext.jsx';
import { 
    Box, Typography, Grid, Paper, IconButton, Stack, Dialog, DialogTitle, 
    List, ListItemButton, ListItemText, CircularProgress, Alert, Button
} from '@mui/material';
import { AddPhotoAlternateOutlined, DeleteOutline } from '@mui/icons-material';
import { useNotification } from '../../../contexts/NotificationContext.jsx';

// Cloudinary details
const CLOUDINARY_CLOUD_NAME = "dr0nc9xqj";
const CLOUDINARY_UPLOAD_PRESET = "easynest_preset";

const PHOTO_CATEGORIES = ['Living Room', 'Bedroom', 'Washroom', 'Kitchen', 'Common Area', 'Exterior'];

const Step3_Photos = () => {
    const { listingData, updateListingData } = useListing();
    const { showNotification } = useNotification();
    const fileInputRef = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setCategoryModalOpen(false);
        setTimeout(() => fileInputRef.current.click(), 0);
    };

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0 || !selectedCategory) return;

        setIsUploading(true);
        showNotification(`Uploading ${files.length} photo(s) to ${selectedCategory}...`, 'info');

        const uploadPromises = files.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            return fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            }).then(res => res.json());
        });

        try {
            const uploadedResults = await Promise.all(uploadPromises);

            // --- YEH NAYA AUR IMPROVED LOGIC HAI ---
            // Sirf successful uploads ko filter karo jinka URL hai
            const successfulUploads = uploadedResults.filter(result => result.secure_url);

            if (successfulUploads.length !== files.length) {
                showNotification("Some photos failed to upload. Please try again.", "warning");
            }

            if (successfulUploads.length > 0) {
                const newPhotos = successfulUploads.map(result => ({
                    url: result.secure_url,
                    public_id: result.public_id,
                    category: selectedCategory,
                }));

                const updatedPhotos = [...(listingData.photos || []), ...newPhotos];
                updateListingData({ photos: updatedPhotos });
                showNotification(`${newPhotos.length} photo(s) uploaded successfully!`, "success");
            }
            // ------------------------------------

        } catch (error) {
            console.error("Error uploading images:", error);
            showNotification("Failed to upload photos. Please try again.", "error");
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removePhoto = (publicIdToRemove) => {
        const updatedPhotos = listingData.photos.filter(p => p.public_id !== publicIdToRemove);
        updateListingData({ photos: updatedPhotos });
    };

    const groupedPhotos = listingData.photos?.reduce((acc, photo) => {
        (acc[photo.category] = acc[photo.category] || []).push(photo);
        return acc;
    }, {}) || {};

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Add photos of your property</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Good photos help students imagine themselves in your space. Upload at least 1 per category.
            </Typography>

            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />

            {Object.keys(groupedPhotos).length === 0 && !isUploading && (
                 <Alert severity="info">No photos uploaded yet. Click "Add Photos" to start.</Alert>
            )}

            <Stack spacing={3} mt={2}>
                {Object.entries(groupedPhotos).map(([category, photos]) => (
                    <Box key={category}>
                        <Typography variant="h6" fontWeight="bold">{category}</Typography>
                        <Grid container spacing={1} mt={1}>
                            {photos.map((photo) => (
                                <Grid item key={photo.public_id} xs={6} sm={4} md={3}>
                                    <Paper variant="outlined" sx={{ position: 'relative', aspectRatio: '1 / 1' }}>
                                        <IconButton onClick={() => removePhoto(photo.public_id)} sx={{ position: 'absolute', top: 4, right: 4, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                                            <DeleteOutline />
                                        </IconButton>
                                        <Box component="img" src={photo.url} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1 }} />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ))}
            </Stack>
            
            {isUploading && <CircularProgress sx={{display: 'block', margin: '20px auto'}} />}

            <Button
                fullWidth
                variant="contained"
                startIcon={<AddPhotoAlternateOutlined />}
                onClick={() => setCategoryModalOpen(true)}
                sx={{ mt: 4 }}
                disabled={isUploading}
            >
                Add Photos
            </Button>

            <Dialog open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
                <DialogTitle>Select a category for your photos</DialogTitle>
                <List>
                    {PHOTO_CATEGORIES.map(category => (
                        <ListItemButton key={category} onClick={() => handleCategorySelect(category)}>
                            <ListItemText primary={category} />
                        </ListItemButton>
                    ))}
                </List>
            </Dialog>
        </Box>
    );
};

export default Step3_Photos;
