// /src/screens/owner/listing_flow/Step1_BasicInfo.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useListing } from '../../../contexts/ListingContext';
import { Box, Typography, TextField, Stack, ToggleButtonGroup, ToggleButton, FormControlLabel, Checkbox, Grid, Divider, Paper, Button, CircularProgress } from '@mui/material';
import { useNotification } from '../../../contexts/NotificationContext';

const PROPERTY_TYPES = ['Studio Room', '1 BHK', '2 BHK', '3 BHK', 'Full House'];

const Step1_BasicInfo = () => {
    const { listingData, updateListingData } = useListing();
    const { showNotification } = useNotification();
    
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Map ko initialize karne ke liye useEffect
    useEffect(() => {
        if (typeof window.L === 'undefined' || mapRef.current || !mapContainerRef.current) return;

        const L = window.L;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const initialCoords = {
            lat: listingData.latitude || 28.6139,
            lng: listingData.longitude || 77.2090
        };

        mapRef.current = L.map(mapContainerRef.current).setView([initialCoords.lat, initialCoords.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        markerRef.current = L.marker([initialCoords.lat, initialCoords.lng], {
            draggable: true
        }).addTo(mapRef.current);

        markerRef.current.on('dragend', (event) => {
            const { lat, lng } = event.target.getLatLng();
            updateListingData({ latitude: lat, longitude: lng });
        });

    }, []); // Yeh effect sirf ek baar chalega

    // --- NAYA FUNCTION ADDRESS SE COORDINATES FETCH KARNE KE LIYE ---
    const handleGeocodeAddress = async () => {
        const { address, city, pincode } = listingData;
        if (!address || !city || !pincode) {
            showNotification("Please fill address, city, and pincode first.", "error");
            return;
        }

        setIsGeocoding(true);
        const fullAddress = `${address}, ${city}, ${pincode}, India`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLatLng = [parseFloat(lat), parseFloat(lon)];
                
                // Map aur marker ko nayi location par move karo
                mapRef.current.setView(newLatLng, 16);
                markerRef.current.setLatLng(newLatLng);
                
                // Context mein coordinates update karo
                updateListingData({ latitude: newLatLng[0], longitude: newLatLng[1] });
                showNotification("Location found on map!", "success");
            } else {
                showNotification("Could not find the location. Please try a more specific address.", "error");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            showNotification("An error occurred while finding the location.", "error");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleChange = (e) => {
        updateListingData({ [e.target.name]: e.target.value });
    };

    const handlePropertyTypeChange = (event, newType) => {
        if (newType !== null) {
            updateListingData({ propertyType: newType });
        }
    };

    const handleHouseDetailsChange = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        updateListingData({
            houseDetails: {
                ...(listingData.houseDetails || {}),
                [name]: fieldValue
            }
        });
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Let's start with the basics</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Tell us the name and location of your property.
            </Typography>

            <Stack spacing={3}>
                <TextField label="Property Name (e.g., Ashu's PG)" name="name" value={listingData.name || ''} onChange={handleChange} />
                <TextField label="Street Address" name="address" value={listingData.address || ''} onChange={handleChange} />
                <Stack direction="row" spacing={2}>
                    <TextField label="City" name="city" value={listingData.city || ''} onChange={handleChange} fullWidth />
                    <TextField label="Pincode" name="pincode" type="number" value={listingData.pincode || ''} onChange={handleChange} fullWidth />
                </Stack>
                <TextField label="Description of your place" name="description" value={listingData.description || ''} onChange={handleChange} multiline rows={4} />

                <Divider sx={{ pt: 2 }} />
                
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Pinpoint Location on Map</Typography>
                
                {/* --- NAYA BUTTON --- */}
                <Button variant="contained" onClick={handleGeocodeAddress} disabled={isGeocoding}>
                    {isGeocoding ? <CircularProgress size={24} color="inherit" /> : 'Find on Map from Address'}
                </Button>

                <Typography color="text.secondary" sx={{ mt: -2, mb: 1 }}>
                    Click the button above, then drag the marker to the exact location.
                </Typography>
                <Paper ref={mapContainerRef} sx={{ height: '400px', borderRadius: 2, zIndex: 1 }} />
                
                <Divider sx={{ pt: 2 }} />

                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Property Type</Typography>
                <ToggleButtonGroup
                    value={listingData.propertyType || ''}
                    exclusive
                    onChange={handlePropertyTypeChange}
                    fullWidth
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                    {PROPERTY_TYPES.map(type => (
                        <ToggleButton key={type} value={type} sx={{flexGrow: 1}}>{type}</ToggleButton>
                    ))}
                </ToggleButtonGroup>

                {listingData.propertyType === 'Full House' && (
                    <Box sx={{border: '1px solid #ddd', p: 2, borderRadius: 2, mt: 2}}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>House Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Number of Bedrooms" name="bedrooms" type="number" fullWidth value={listingData.houseDetails?.bedrooms || ''} onChange={handleHouseDetailsChange} />
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                <TextField label="Number of Kitchens" name="kitchens" type="number" fullWidth value={listingData.houseDetails?.kitchens || ''} onChange={handleHouseDetailsChange} />
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                <TextField label="Number of Washrooms" name="washrooms" type="number" fullWidth value={listingData.houseDetails?.washrooms || ''} onChange={handleHouseDetailsChange} />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                <TextField label="Attached Washrooms" name="attachedWashrooms" type="number" fullWidth value={listingData.houseDetails?.attachedWashrooms || ''} onChange={handleHouseDetailsChange} />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel 
                                    control={<Checkbox name="hasTerrace" checked={listingData.houseDetails?.hasTerrace || false} onChange={handleHouseDetailsChange} />} 
                                    label="Terrace / Balcony Available" 
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default Step1_BasicInfo;
