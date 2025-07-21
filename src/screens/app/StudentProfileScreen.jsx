// src/screens/app/StudentProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Avatar, Divider, Chip, Stack, CircularProgress, IconButton, Tooltip, Grid, Alert } from '@mui/material';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Edit, CheckCircle, HourglassEmpty } from '@mui/icons-material';

const StudentProfileScreen = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserDetails(docSnap.data());
                } else {
                    console.log("User document does not exist");
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user details:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    const verificationStatus = userDetails?.verificationStatus || 'not_verified';

    const renderVerificationBadge = () => {
        if (verificationStatus === 'verified') {
            return (
                <Tooltip title="Verified Profile">
                    <CheckCircle color="success" sx={{ ml: 1 }} />
                </Tooltip>
            );
        }
        return null;
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    {/* --- PROFILE HEADER --- */}
                    <Paper component={Stack} direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{ p: 3, alignItems: 'center', borderRadius: 3 }}>
                        {/* Avatar ab userDetails se photoURL lega */}
                        <Avatar src={userDetails?.photoURL} sx={{ width: 80, height: 80 }}>
                            {currentUser?.displayName?.[0]}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, textAlign: {xs: 'center', sm: 'left'} }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: {xs: 'center', sm: 'flex-start'} }}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {currentUser?.displayName || 'Student User'}
                                </Typography>
                                {renderVerificationBadge()}
                            </Box>
                            <Typography color="text.secondary">
                                {currentUser?.email}
                            </Typography>
                        </Box>
                        <Tooltip title="Edit Profile">
                            <IconButton onClick={() => navigate('/profile/edit')}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    </Paper>

                    {/* Verification Status Alerts */}
                    {verificationStatus === 'pending' && (
                        <Alert severity="info" icon={<HourglassEmpty fontSize="inherit" />}>
                            Your verification is pending. We are reviewing your ID.
                        </Alert>
                    )}
                    {verificationStatus === 'not_verified' && (
                        <Alert severity="warning" action={
                            <Button color="inherit" size="small" onClick={() => navigate('/profile/edit')}>
                                VERIFY NOW
                            </Button>
                        }>
                            Your profile is not verified. Verify now to find roommates.
                        </Alert>
                    )}


                    {/* --- ABOUT ME SECTION --- */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>About Me</Typography>
                        <Typography variant="body1" color="text.secondary">
                            {userDetails?.bio || "No bio added yet. Click edit to tell us about yourself!"}
                        </Typography>
                    </Paper>

                    {/* --- DETAILS SECTION (Corrected) --- */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography fontWeight="bold">Hometown</Typography>
                                <Typography color="text.secondary">{userDetails?.hometown || 'Not specified'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography fontWeight="bold">College</Typography>
                                <Typography color="text.secondary">{userDetails?.college || 'Not specified'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography fontWeight="bold">Course & Year</Typography>
                                <Typography color="text.secondary">{userDetails?.course && userDetails?.year ? `${userDetails.course}, ${userDetails.year}` : 'Not specified'}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* --- LIFESTYLE & HABITS SECTION --- */}
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Lifestyle & Habits</Typography>
                        <Stack spacing={2}>
                            <Box>
                                <Typography fontWeight="bold">Languages</Typography>
                                {userDetails?.languages?.length > 0 ? (
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt: 1}}>
                                        {userDetails.languages.map(lang => <Chip key={lang} label={lang} />)}
                                    </Stack>
                                ) : <Typography variant="body2" color="text.secondary">Not specified</Typography>}
                            </Box>
                             <Box>
                                <Typography fontWeight="bold">Smoking/Drinking</Typography>
                                <Typography variant="body2" color="text.secondary">{userDetails?.habits || 'Not specified'}</Typography>
                            </Box>
                            {userDetails?.languages?.includes('Haryanvi') && userDetails?.hookah && (
                                <Box>
                                    <Typography fontWeight="bold">Hookah</Typography>
                                    <Typography variant="body2" color="text.secondary">{userDetails.hookah}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>

                    {/* --- LOGOUT BUTTON --- */}
                    <Button
                        variant="contained"
                        onClick={handleLogout}
                        sx={{ backgroundColor: 'black', '&:hover': { backgroundColor: '#333' } }}
                    >
                        Log Out
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
};

export default StudentProfileScreen;
