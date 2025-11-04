// src/components/roommates/RoommatePostCard.jsx
import React, { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    Avatar,
    Chip,
    Button,
    Stack,
    Tooltip,
    IconButton,
    Badge,
    useTheme,
    alpha,
    Fade,
    Skeleton
} from '@mui/material';
import {
    LocationOn,
    AccountBalanceWallet,
    PersonSearch,
    CheckCircle,
    Home,
    Person,
    Schedule,
    Favorite,
    FavoriteBorder,
    Message,
    Star,
    SmokingRooms,
    LocalBar,
    Restaurant
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConnections } from '../../contexts/ConnectionContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWishlist } from '../../contexts/WishlistContext.jsx';

const RoommatePostCard = ({ post }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { currentUser, currentUserDetails } = useAuth();
    const { connections, sendConnectionRequest } = useConnections();
    const { showNotification } = useNotification();
    const { addItem, removeItem, isSaved } = useWishlist();

    const [isHovered, setIsHovered] = useState(false);
    const [saved, setSaved] = useState(isSaved(post.id));

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

    const handleSaveToggle = (e) => {
        e.stopPropagation();
        if (saved) {
            removeItem(post.id);
            setSaved(false);
        } else {
            addItem(post);
            setSaved(true);
        }
    };

    const handleMessage = (e) => {
        e.stopPropagation();
        navigate(`/chat/${post.authorId}`);
    };

    // Check karo ki connection pehle se hai ya nahi
    const existingConnection = connections.find(c =>
        (c.requesterId === currentUser?.uid && c.receiverId === post.authorId) ||
        (c.requesterId === post.authorId && c.receiverId === currentUser?.uid)
    );

    const getPostAge = () => {
        const now = new Date();
        const postDate = post.createdAt?.toDate();
        if (!postDate) return '';

        const diffInDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return `${Math.floor(diffInDays / 30)} months ago`;
    };

    const getLifestyleChips = () => {
        const chips = [];
        if (post.smokingAllowed !== undefined) {
            chips.push({
                icon: <SmokingRooms fontSize="small" />,
                label: post.smokingAllowed ? 'Smoking OK' : 'No Smoking',
                color: post.smokingAllowed ? 'warning' : 'success'
            });
        }
        if (post.drinkingAllowed !== undefined) {
            chips.push({
                icon: <LocalBar fontSize="small" />,
                label: post.drinkingAllowed ? 'Drinking OK' : 'No Drinking',
                color: post.drinkingAllowed ? 'warning' : 'success'
            });
        }
        if (post.vegetarian !== undefined) {
            chips.push({
                icon: <Restaurant fontSize="small" />,
                label: post.vegetarian ? 'Veg' : 'Non-Veg',
                color: post.vegetarian ? 'success' : 'info'
            });
        }
        return chips;
    };

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
            elevation={isHovered ? 6 : 2}
            sx={{
                p: 3,
                borderRadius: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/user/${post.authorId}`)}
        >
            {/* Save Button */}
            <IconButton
                onClick={handleSaveToggle}
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: saved ? 'error.main' : 'text.secondary',
                    boxShadow: 1,
                    '&:hover': {
                        backgroundColor: 'white',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                {saved ? <Favorite /> : <FavoriteBorder />}
            </IconButton>

            {/* Profile Header */}
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        post.authorVerificationStatus === 'verified' ? (
                            <CheckCircle
                                color="success"
                                sx={{ fontSize: 16, backgroundColor: 'white', borderRadius: '50%' }}
                            />
                        ) : null
                    }
                >
                    <Avatar
                        src={post.authorPhotoURL}
                        sx={{ width: 56, height: 56, border: '2px solid white' }}
                    >
                        {post.authorName?.[0]}
                    </Avatar>
                </Badge>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {post.authorName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            label={post.lookingFor === 'only_roommate' ? "Has a Room" : "Needs a Room"}
                            color={post.lookingFor === 'only_roommate' ? "success" : "primary"}
                            size="small"
                            icon={post.lookingFor === 'only_roommate' ? <Home /> : <Person />}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {getPostAge()}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            {/* Key Information */}
            <Stack spacing={2} sx={{ flexGrow: 1 }}>
                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        {post.location}
                    </Typography>
                </Box>

                {/* Budget */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWallet sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                        Budget: <Typography component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            ₹{post.budget}
                        </Typography>/month
                    </Typography>
                </Box>

                {/* Preferences */}
                {post.preferences && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <PersonSearch sx={{ fontSize: 18, color: 'text.secondary', mt: 0.5 }} />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                lineHeight: 1.4
                            }}
                        >
                            {post.preferences}
                        </Typography>
                    </Box>
                )}

                {/* Lifestyle Chips */}
                {getLifestyleChips().length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {getLifestyleChips().map((chip, index) => (
                            <Chip
                                key={index}
                                icon={chip.icon}
                                label={chip.label}
                                size="small"
                                color={chip.color}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                        ))}
                    </Box>
                )}
            </Stack>

            {/* Action Buttons */}
            {currentUser?.uid !== post.authorId && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {renderConnectButton()}
                    {existingConnection?.status === 'accepted' && (
                        <Tooltip title="Send Message">
                            <IconButton
                                onClick={handleMessage}
                                sx={{
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <Message />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default RoommatePostCard;