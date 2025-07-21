// src/components/owner/OwnerListingCard.jsx
import React from 'react';
import { Paper, Box, Typography, Avatar, Stack, Button, Divider } from '@mui/material';

const OwnerListingCard = ({ item, onEdit, onDelete }) => {
    
    const calculateBeds = () => {
        if (!item.roomTypes || item.roomTypes.length === 0) {
            return '0 Beds';
        }
        const totalBeds = item.roomTypes.reduce((sum, room) => sum + (room.beds || 0), 0);
        return `${totalBeds} Beds`;
    };

    return (
        <Paper sx={{ padding: 2, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                    variant="rounded"
                    src={item.image}
                    alt={item.name}
                    sx={{ width: 60, height: 60, marginRight: 1.5, borderRadius: 2 }}
                />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', marginTop: 0.5 }}>
                        {calculateBeds()} Total
                    </Typography>
                </Box>
            </Box>

            <Divider />

            {/* --- BUTTONS AB NEECHE HAIN --- */}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button variant="outlined" color="primary" onClick={onEdit} fullWidth>
                    Edit
                </Button>
                <Button variant="contained" color="error" onClick={onDelete} fullWidth>
                    Delete
                </Button>
            </Stack>
        </Paper>
    );
};

export default OwnerListingCard;