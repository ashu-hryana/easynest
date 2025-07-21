// src/screens/owner/listing_flow/ListingFlowLayout.jsx
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Paper, IconButton, Typography, Container, Button, Toolbar } from '@mui/material';
import { Close } from '@mui/icons-material';
import ProgressBar from '../../../components/owner/listing_flow/ProgressBar';
import { useListing } from '../../../contexts/ListingContext';
import { useNotification } from '../../../contexts/NotificationContext.jsx';

const steps = [
    '/owner/add-listing',
    '/owner/add-listing/amenities',
    '/owner/add-listing/photos',
    '/owner/add-listing/pricing',
];

const ListingFlowLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { listingData, saveListingToFirebase } = useListing();
    const { showNotification } = useNotification();

    const currentStepIndex = steps.findIndex(step => step === location.pathname);
    
    const isLastStep = currentStepIndex === steps.length - 1;
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = () => {
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < steps.length) {
            navigate(steps[nextStepIndex]);
        }
    };

    const handleBack = () => {
        const prevStepIndex = currentStepIndex - 1;
        if (prevStepIndex >= 0) {
            navigate(steps[prevStepIndex]);
        }
    };
    
    const isLastStepValid = () => {
        const { propertyType, price, securityDeposit, availableUnits, electricityRate, electricityPaymentBy } = listingData;
        if (propertyType === 'Full House') {
            return price && securityDeposit && electricityPaymentBy;
        } else {
            return price && securityDeposit && availableUnits && electricityRate;
        }
    };

    const handlePublish = async () => {
        if (!isLastStepValid()) {
            showNotification('Please fill all the pricing details before publishing.', 'error');
            return;
        }
        
        if (!listingData.photos || !Array.isArray(listingData.photos) || listingData.photos.length === 0) {
             showNotification('Please add at least one photo before publishing.', 'error');
             navigate('/owner/add-listing/photos');
             return;
        }

        const allPhotosHaveUrls = listingData.photos.every(p => p && typeof p.url === 'string' && p.url.startsWith('http'));
        
        if (!allPhotosHaveUrls) {
            showNotification('Some photos are still uploading or failed. Please try again.', 'error');
            navigate('/owner/add-listing/photos');
            return;
        }

        // --- YEH SABSE ZAROORI CHANGE HAI ---
        // Ab hum `listingData` ko direct bhej rahe hain bina photos se category hataye.
        // `saveListingToFirebase` function ab poora photo object save karega.
        try {
            await saveListingToFirebase(listingData); 
            showNotification('Success! Your property has been listed.', 'success');
            navigate('/owner/my-listings');
        } catch (error) {
            console.error("Error in handlePublish:", error);
            showNotification('Error: Could not save your listing. Please check all details.', 'error');
        }
    };

    const getIsNextDisabled = () => {
        switch (currentStepIndex) {
            case 0:
                return !listingData.name || !listingData.address || !listingData.city || !listingData.pincode || !listingData.propertyType;
            case 1:
                return (!listingData.amenities || listingData.amenities.length === 0) || (!listingData.rules || listingData.rules.length === 0);
            case 2:
                const allPhotosHaveUrls = listingData.photos?.every(p => p && typeof p.url === 'string' && p.url.startsWith('http'));
                return !listingData.photos || listingData.photos.length < 1 || !allPhotosHaveUrls;
            case 3:
                return !isLastStepValid();
            default:
                return false;
        }
    };

    const isNextDisabled = getIsNextDisabled();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Paper component="header" square elevation={1} sx={{ backgroundColor: 'white' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <IconButton onClick={() => navigate('/owner/dashboard')}>
                        <Close />
                    </IconButton>
                    <Typography sx={{ fontWeight: 'bold' }}>List your property</Typography>
                    <Box sx={{ width: 40 }} />
                </Toolbar>
            </Paper>
            <ProgressBar value={progress} />

            <Container maxWidth="md" sx={{ py: 4, flex: 1, overflowY: 'auto' }}>
                <Outlet />
            </Container>

            <Paper component="footer" square elevation={2} sx={{ p: 2, backgroundColor: 'white' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Button variant="text" onClick={handleBack} disabled={currentStepIndex === 0} sx={{ textDecoration: 'underline' }}>Back</Button>
                    {isLastStep ? (
                        <Button variant="contained" onClick={handlePublish} disabled={isNextDisabled}>Finish & Publish</Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext} disabled={isNextDisabled}>Next</Button>
                    )}
                </Toolbar>
            </Paper>
        </Box>
    );
};

export default ListingFlowLayout;