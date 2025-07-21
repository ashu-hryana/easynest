// src/components/roommates/RoommateCard.jsx
import React from 'react';
import { Paper, Box, Typography, Avatar, Chip, Button, Stack, Tooltip } from '@mui/material';
import { School, Home, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RoommateCard = ({ user }) => {
    const navigate = useNavigate();

    return (
        <Paper 
            variant="outlined" 
            sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <Stack spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
                <Avatar src={user.photoURL} sx={{ width: 80, height: 80, mb: 1 }}>
                    {user.fullName?.[0]}
                </Avatar>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {user.fullName}
                    </Typography>
                    {user.verificationStatus === 'verified' && (
                        <Tooltip title="Verified Profile">
                            <CheckCircle color="success" fontSize="small" />
                        </Tooltip>
                    )}
                </Box>
                
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <School fontSize="small" />
                    <Typography variant="body2">{user.college || 'College not specified'}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <Home fontSize="small" />
                    <Typography variant="body2">{user.hometown || 'Hometown not specified'}</Typography>
                </Stack>
                
                {/* Highlight one key habit */}
                {user.habits && <Chip label={user.habits} size="small" sx={{ mt: 1 }} />}
            </Stack>

            <Button 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, backgroundColor: 'black' }}
                onClick={() => navigate(`/user/${user.id}`)} // We'll create this route later
            >
                View Profile
            </Button>
        </Paper>
    );
};

export default RoommateCard;
