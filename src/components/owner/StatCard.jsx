// src/components/owner/StatCard.jsx
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, icon }) => {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography color="text.secondary" sx={{ mb: 1 }}>{title}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value}</Typography>
            </Box>
            {icon && (
                <Box sx={{ color: 'primary.main' }}>
                    {icon}
                </Box>
            )}
        </Paper>
    );
};

export default StatCard;