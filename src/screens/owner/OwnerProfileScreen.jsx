// src/screens/owner/OwnerProfileScreen.jsx

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Avatar, Paper, Stack, Divider, TextField, IconButton, CircularProgress, Chip } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// --- 1. IMPORT getAuth and signOut FROM FIREBASE ---
import { getAuth, signOut } from 'firebase/auth';
import { Edit, Save, PhotoCamera, CheckCircle, VpnKey } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext.jsx';

const OwnerProfileScreen = () => {
    // --- 2. NO LONGER NEED TO DESTRUCTURE logout HERE ---
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const profileData = docSnap.data();
                    setUserProfile(profileData);
                    setDisplayName(profileData.displayName || currentUser.displayName || '');
                    setPhoneNumber(profileData.phoneNumber || '');
                    setProfilePicUrl(profileData.photoURL || currentUser.photoURL || '');
                }
            }
            setLoading(false);
        };
        fetchUserProfile();
    }, [currentUser]);

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setPhoneNumber(value);
        }
    };
    
    const handleSaveProfile = async () => {
        if (!displayName || !phoneNumber) {
            return showNotification("Name and Phone Number are required.", "error");
        }
        if (phoneNumber.length !== 10) {
            return showNotification("Please enter a valid 10-digit phone number.", "error");
        }

        setIsSaving(true);
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const updatedData = {
                displayName,
                phoneNumber,
                photoURL: profilePicUrl,
            };
            await updateDoc(userDocRef, updatedData);
            
            setUserProfile(prev => ({...prev, ...updatedData}));
            showNotification('Profile updated successfully!', 'success');
            setEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            showNotification('Failed to update profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePicUrl(reader.result);
        };
        reader.readAsDataURL(file);
        showNotification("Image selected. Click 'Save Changes' to update.", "info");
    };

    // --- 3. CREATE A DEDICATED LOGOUT FUNCTION ---
    const handleLogout = async () => {
        const auth = getAuth();
        try {
            await signOut(auth);
            navigate('/owner-login');
        } catch (error) {
            console.error("Error logging out: ", error);
            showNotification("Failed to log out. Please try again.", "error");
        }
    };
    
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    const verificationStatus = userProfile?.verificationStatus || 'NOT_VERIFIED';

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', py: 4, minHeight: '100vh' }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Stack spacing={2} alignItems="center">
                        <Box sx={{ position: 'relative' }}>
                            <Avatar src={profilePicUrl} sx={{ width: 120, height: 120, fontSize: '4rem' }}>
                                {displayName ? displayName[0].toUpperCase() : 'O'}
                            </Avatar>
                             {editMode && (
                                <IconButton color="primary" component="label" sx={{ position: 'absolute', bottom: 5, right: 5, backgroundColor: 'white', '&:hover': { backgroundColor: '#f0f0f0' }}}>
                                    <PhotoCamera />
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                </IconButton>
                            )}
                        </Box>
                        
                        {editMode ? (
                            <Stack spacing={2} sx={{width: '100%'}}>
                                <TextField label="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} fullWidth />
                                <TextField 
                                    label="Phone Number" 
                                    value={phoneNumber} 
                                    onChange={handlePhoneNumberChange} 
                                    type="tel"
                                    inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                                    fullWidth 
                                />
                            </Stack>
                        ) : (
                           <>
                                <Typography variant="h4" fontWeight="bold">{displayName || 'Owner Name'}</Typography>
                                <Typography variant="body1" color="text.secondary"> 
                                    {phoneNumber || '(Phone not set)'} 
                                </Typography>
                                <Typography variant="body1" color="text.secondary"> {currentUser?.email} </Typography>
                            </>
                        )}

                        <Box sx={{my: 1}}>
                            {verificationStatus === 'VERIFIED' ? (
                                <Chip icon={<CheckCircle />} label="Verified Owner" color="success" />
                            ) : (
                                <Chip icon={<VpnKey />} label="Not Verified" color="warning" />
                            )}
                        </Box>
                        
                        <Divider sx={{ width: '100%', pt: 1 }} />
                        
                        {editMode ? (
                            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                <Button variant="outlined" fullWidth onClick={() => setEditMode(false)}> Cancel </Button>
                                <Button 
                                    variant="contained" 
                                    fullWidth 
                                    onClick={handleSaveProfile} 
                                    disabled={isSaving}
                                >
                                    {isSaving ? <CircularProgress size={24}/> : 'Save Changes'}
                                </Button>
                            </Stack>
                        ) : (
                           <Stack spacing={2} sx={{width: '100%'}}>
                                {verificationStatus !== 'VERIFIED' && (
                                    <Button variant="contained" fullWidth onClick={() => navigate('/owner/verify')}>
                                        Become a Verified Owner
                                    </Button>
                                )}
                                <Button 
                                    variant="outlined" 
                                    fullWidth 
                                    onClick={() => setEditMode(true)} 
                                    startIcon={<Edit />}
                                >
                                    Edit Profile
                                </Button>
                           </Stack>
                        )}
                         <Button 
                            variant="contained" 
                            color="error" 
                            fullWidth 
                            onClick={handleLogout} // 4. CALL THE NEW FUNCTION
                         >
                             Log Out
                         </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default OwnerProfileScreen;
