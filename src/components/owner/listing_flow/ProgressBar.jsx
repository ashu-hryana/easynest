// src/components/owner/listing_flow/ProgressBar.jsx
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

const ProgressBar = ({ value }) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: 5 }} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(value)}%`}</Typography>
            </Box>
        </Box>
    );
};

export default ProgressBar;