// src/components/connections/SentRequestItem.jsx
import React from 'react';
import { Paper, Box, Typography, Avatar, Chip, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SentRequestItem = ({ connection }) => {
    const navigate = useNavigate();

    const getStatusChip = (status) => {
        switch (status) {
            case 'accepted':
                return <Chip label="Accepted" color="success" size="small" />;
            case 'rejected':
                return <Chip label="Rejected" color="error" size="small" />;
            case 'pending':
            default:
                return <Chip label="Pending" color="warning" size="small" />;
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2
            }}
        >
            <Box 
                sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                onClick={() => navigate(`/user/${connection.receiverId}`)}
            >
                <Avatar src={connection.receiverPhotoURL}>
                    {connection.receiverName?.[0]}
                </Avatar>
                <Box>
                    <Typography>Request sent to</Typography>
                    <Typography sx={{ fontWeight: 'bold' }}>{connection.receiverName}</Typography>
                </Box>
            </Box>
            
            {getStatusChip(connection.status)}
        </Paper>
    );
};

export default SentRequestItem;
