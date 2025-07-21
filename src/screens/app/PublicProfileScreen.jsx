// src/screens/app/PublicProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, Avatar,
    Divider, Chip, Stack, CircularProgress, IconButton, Tooltip, Grid, 
    List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowBack, CheckCircle, Phone, Email } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConnections } from '../../contexts/ConnectionContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';


const PublicProfileScreen = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser, currentUserDetails } = useAuth();
    const { sendConnectionRequest, connections } = useConnections();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        if (userId) {
            const userDocRef = doc(db, 'users', userId);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserDetails(docSnap.data());
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [userId]);
    
    const handleConnect = () => {
        if (!currentUserDetails?.hometown || !currentUserDetails?.college || !currentUserDetails?.bio) {
            showNotification("Please complete your own profile first to send requests.", "error");
            navigate('/profile/edit');
            return;
        }
        sendConnectionRequest({
            authorId: userId,
            authorName: userDetails.fullName,
            authorPhotoURL: userDetails.photoURL,
        });
    };

    const existingConnection = connections.find(c =>
        (c.requesterId === currentUser?.uid && c.receiverId === userId) ||
        (c.requesterId === userId && c.receiverId === currentUser?.uid)
    );

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (!userDetails) {
        return <Typography sx={{textAlign: 'center', p: 4}}>User not found.</Typography>;
    }
    
    const renderVerificationBadge = () => {
        if (userDetails.verificationStatus === 'VERIFIED') {
            return (
                <Tooltip title="Verified Profile">
                    <CheckCircle color="success" sx={{ ml: 1, fontSize: '1.2rem' }} />
                </Tooltip>
            );
        }
        return null;
    };

    const isOwner = userDetails.role === 'owner';

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Paper elevation={1} square sx={{ backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
                 <Container maxWidth="sm" sx={{display: 'flex', alignItems: 'center', py: 1}}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {userDetails.displayName || userDetails.fullName}'s Profile
                    </Typography>
                 </Container>
            </Paper>

            {/* --- CONTAINER ka maxWidth "sm" kar diya gaya hai better alignment ke liye --- */}
            <Container maxWidth="sm" sx={{ py: 3 }}>
                <Stack spacing={3}>
                    <Paper component={Stack} direction="column" spacing={1} sx={{ p: 3, alignItems: 'center', borderRadius: 3 }}>
                        <Avatar src={userDetails.photoURL} sx={{ width: 100, height: 100, fontSize: '3rem', mb: 1 }}>
                            {(userDetails.displayName || userDetails.fullName)?.[0]}
                        </Avatar>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{userDetails.displayName || userDetails.fullName}</Typography>
                            {isOwner && renderVerificationBadge()}
                        </Box>
                        <Typography color="text.secondary">{isOwner ? userDetails.email : userDetails.college}</Typography>
                        
                        {!isOwner && currentUser?.uid !== userId && (
                            <Box pt={1} width="100%">
                                {existingConnection ? (
                                    <Button fullWidth variant="outlined" disabled>{existingConnection.status === 'pending' ? 'Request Sent' : 'Connected'}</Button>
                                ) : (
                                    <Button fullWidth variant="contained" onClick={handleConnect}>
                                        Send Connect Request
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Paper>

                    {isOwner ? (
                        <OwnerProfileView profile={userDetails} />
                    ) : (
                        <StudentProfileView profile={userDetails} />
                    )}
                </Stack>
            </Container>
        </Box>
    );
};


const OwnerProfileView = ({ profile }) => (
    <Paper sx={{ p: {xs: 2, sm: 3}, borderRadius: 3 }}>
        <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography variant="h6" fontWeight="bold">Contact Information</Typography>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemIcon sx={{minWidth: '40px'}}> <Email color="action" /> </ListItemIcon>
                    <ListItemText primary={profile.email} />
                </ListItem>
                <ListItem disablePadding>
                    <ListItemIcon sx={{minWidth: '40px'}}> <Phone color="action" /> </ListItemIcon>
                    <ListItemText primary={profile.phoneNumber || 'Phone not provided'} />
                </ListItem>
            </List>
        </Stack>
    </Paper>
);

const StudentProfileView = ({ profile }) => (
    <>
        <Paper sx={{ p: {xs: 2, sm: 3}, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>About</Typography>
            <Typography variant="body1" color="text.secondary">
                {profile.bio || "No bio provided."}
            </Typography>
        </Paper>
        
        <Paper sx={{ p: {xs: 2, sm: 3}, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Details</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography><b>Hometown:</b> {profile.hometown || 'N/A'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><b>College:</b> {profile.college || 'N/A'}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><b>Course & Year:</b> {profile.course && profile.year ? `${profile.course}, ${profile.year} Year` : 'N/A'}</Typography></Grid>
            </Grid>
        </Paper>

        <Paper sx={{ p: {xs: 2, sm: 3}, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Lifestyle & Habits</Typography>
            <Stack spacing={2}>
                <Box>
                    <Typography fontWeight="bold">Languages</Typography>
                    {profile.languages?.length > 0 ? (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt: 1}}>
                            {profile.languages.map(lang => <Chip key={lang} label={lang} />)}
                        </Stack>
                    ) : <Typography variant="body2" color="text.secondary">Not specified</Typography>}
                </Box>
            </Stack>
        </Paper>
    </>
);

export default PublicProfileScreen;
