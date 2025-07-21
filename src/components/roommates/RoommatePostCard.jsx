// src/components/roommates/RoommatePostCard.jsx
import React from 'react';
import { Paper, Box, Typography, Avatar, Chip, Button, Stack, Tooltip } from '@mui/material';
import { LocationOn, AccountBalanceWallet, PersonSearch, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConnections } from '../../contexts/ConnectionContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';

const RoommatePostCard = ({ post }) => {
    const navigate = useNavigate();
    const { currentUser, currentUserDetails } = useAuth();
    // connections aur sendConnectionRequest ko context se nikalo
    const { connections, sendConnectionRequest } = useConnections();
    const { showNotification } = useNotification();

    const handleConnect = () => {
        // Profile completion check
        if (!currentUserDetails?.hometown || !currentUserDetails?.college || !currentUserDetails?.bio) {
            showNotification("Please complete your profile first to send requests.", "error");
            navigate('/profile/edit');
            return;
        }
        // Connection request bhejo
        sendConnectionRequest(post);
    };

    // Check karo ki connection pehle se hai ya nahi
    const existingConnection = connections.find(c => 
        (c.requesterId === currentUser?.uid && c.receiverId === post.authorId) ||
        (c.requesterId === post.authorId && c.receiverId === currentUser?.uid)
    );

    const renderConnectButton = () => {
        if (existingConnection) {
            let statusText = 'Request Sent';
            if (existingConnection.status === 'accepted') statusText = 'Connected';
            if (existingConnection.status === 'rejected') statusText = 'Declined';
            
            return (
                <Button variant="outlined" disabled fullWidth sx={{ mt: 2 }}>
                    {statusText}
                </Button>
            );
        }
        return (
            <Button 
                variant="contained" 
                fullWidth 
                sx={{ mt: 2, backgroundColor: 'black' }}
                onClick={handleConnect}
            >
                Send Connect Request
            </Button>
        );
    };

    return (
        <Paper 
            variant="outlined" 
            sx={{ p: 2, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <Stack 
                direction="row" spacing={2} alignItems="center" mb={2}
                onClick={() => navigate(`/user/${post.authorId}`)}
                sx={{ cursor: 'pointer' }}
            >
                <Avatar src={post.authorPhotoURL}>{post.authorName?.[0]}</Avatar>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>{post.authorName}</Typography>
                        {/* Important: Iske liye post create karte waqt 'authorVerificationStatus' save karna zaroori hai */}
                        {post.authorVerificationStatus === 'verified' && (
                            <Tooltip title="Verified Profile">
                                <CheckCircle color="success" sx={{ fontSize: '1rem' }} />
                            </Tooltip>
                        )}
                    </Box>
                    <Chip 
                        label={post.lookingFor === 'only_roommate' ? "Has a Room" : "Needs a Room"}
                        color={post.lookingFor === 'only_roommate' ? "success" : "info"}
                        size="small"
                        sx={{ mt: 0.5 }}
                    />
                </Box>
            </Stack>

            <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <LocationOn fontSize="small" />
                    <Typography variant="body2">{post.location}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
                    <AccountBalanceWallet fontSize="small" />
                    <Typography variant="body2">Budget: ₹{post.budget}/month</Typography>
                </Stack>
                <Stack direction="row" alignItems="flex-start" spacing={1} color="text.secondary">
                    <PersonSearch fontSize="small" sx={{ mt: 0.5 }} />
                    <Typography variant="body2" sx={{ 
                        display: '-webkit-box', overflow: 'hidden',
                        WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
                    }}>
                        {post.preferences || 'No preferences mentioned.'}
                    </Typography>
                </Stack>
            </Stack>
            
            {currentUser?.uid !== post.authorId && renderConnectButton()}
        </Paper>
    );
};

export default RoommatePostCard;