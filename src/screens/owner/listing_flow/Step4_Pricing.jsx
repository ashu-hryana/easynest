// /src/screens/owner/listing_flow/Step4_Pricing.jsx
import React from 'react';
import { useListing } from '../../../contexts/ListingContext';
import { Box, Typography, TextField, Stack, ToggleButtonGroup, ToggleButton, Paper, Divider, InputAdornment } from '@mui/material';
import { useNotification } from '../../../contexts/NotificationContext.jsx';

const Step4_Pricing = () => {
    const { listingData, updateListingData } = useListing();
    const { showNotification } = useNotification();

    // Helper function to handle input changes for pricing details
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Ensure only numbers are entered for numeric fields
        const numericValue = value.replace(/[^0-9]/g, '');
        updateListingData({ [name]: numericValue });
    };

    const handleElectricityPayerChange = (event, newValue) => {
        if (newValue !== null) {
            updateListingData({ electricityPaymentBy: newValue });
        }
    };

    // Render different UI based on the property type selected in Step 1
    const renderPricingForm = () => {
        const { propertyType } = listingData;

        // --- UI FOR STUDIO / BHKs ---
        if (propertyType && propertyType !== 'Full House') {
            return (
                <Stack spacing={3}>
                    <Typography variant="h6" fontWeight="bold">Details for {propertyType}</Typography>
                    <TextField
                        // --- "Studio" KE LIYE BHI AB "Flats" USE HOGA ---
                        label={`Number of available ${propertyType.includes('BHK') ? 'Flats' : 'Studio Flats'}`}
                        name="availableUnits"
                        type="number"
                        value={listingData.availableUnits || ''}
                        onChange={handleChange}
                        fullWidth
                    />
                    <TextField
                        label="Price per Flat (per month)"
                        name="price"
                        type="number"
                        value={listingData.price || ''}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                    />
                    <TextField
                        label="Security Deposit"
                        name="securityDeposit"
                        type="number"
                        value={listingData.securityDeposit || ''}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                    />
                    <TextField
                        label="Electricity Rate (per unit/kWh)"
                        name="electricityRate"
                        type="number"
                        value={listingData.electricityRate || ''}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        helperText="This will be used to calculate monthly electricity bills."
                    />
                </Stack>
            );
        }

        // --- UI FOR FULL HOUSE ---
        if (propertyType === 'Full House') {
            return (
                <Stack spacing={3}>
                    <Typography variant="h6" fontWeight="bold">Details for Full House</Typography>
                     <TextField
                        label="Price (per month)"
                        name="price"
                        type="number"
                        value={listingData.price || ''}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                    />
                    <TextField
                        label="Security Deposit"
                        name="securityDeposit"
                        type="number"
                        value={listingData.securityDeposit || ''}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                    />
                    <Divider/>
                    <Box>
                        <Typography fontWeight="bold" gutterBottom>Who pays the electricity bill?</Typography>
                        <ToggleButtonGroup
                            color="primary"
                            value={listingData.electricityPaymentBy || ''}
                            exclusive
                            onChange={handleElectricityPayerChange}
                            fullWidth
                        >
                            <ToggleButton value="Tenant to Company">Tenant pays directly to company</ToggleButton>
                            <ToggleButton value="Tenant to Owner">Tenant pays to owner</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Stack>
            );
        }

        // Default view if no property type is selected
        return <Typography color="text.secondary">Please select a property type in the previous step to set the pricing.</Typography>;
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Set up pricing and availability</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Provide the final details about rent and utilities.
            </Typography>
            <Paper variant="outlined" sx={{p: 3, borderRadius: 2}}>
                {renderPricingForm()}
            </Paper>
        </Box>
    );
};

export default Step4_Pricing;
