// src/components/owner/PropertyCard.jsx
import React from 'react';
import { Paper, Typography, Box, Avatar } from '@mui/material';

const PropertyCard = ({ image, name, status }) => {
    return (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Avatar src={image} variant="rounded" sx={{ width: 50, height: 50, mr: 1.5 }} />
            <Box>
                <Typography sx={{ fontWeight: 'bold' }}>{name}</Typography>
                <Typography variant="body2" color="text.secondary">{status}</Typography>
            </Box>
        </Paper>
    );
};

export default PropertyCard;