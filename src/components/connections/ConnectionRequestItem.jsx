// src/components/connections/ConnectionRequestItem.jsx
import React from 'react';
import { Paper, Box, Typography, Avatar, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ConnectionRequestItem = ({ connection, onAccept, onDecline }) => {
    const navigate = useNavigate();

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
                onClick={() => navigate(`/user/${connection.requesterId}`)}
            >
                <Avatar src={connection.requesterPhotoURL}>
                    {connection.requesterName?.[0]}
                </Avatar>
                <Typography sx={{ fontWeight: 'bold' }}>{connection.requesterName}</Typography>
            </Box>

            {connection.status === 'pending' && (
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" onClick={() => onAccept(connection.id)}>
                        Accept
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => onDecline(connection.id)}>
                        Decline
                    </Button>
                </Stack>
            )}
        </Paper>
    );
};

export default ConnectionRequestItem;
