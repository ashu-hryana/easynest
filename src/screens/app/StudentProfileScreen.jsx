// src/screens/app/StudentProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Avatar,
    Divider,
    Chip,
    Stack,
    CircularProgress,
    IconButton,
    Tooltip,
    Grid,
    Alert,
    Card,
    useTheme,
    alpha,
    Badge
} from '@mui/material';
import {
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Person,
    Email,
    Phone,
    BusinessCenter,
    School,
    Language,
    SmokingRooms,
    LocalBar,
    AccountCircle,
    PhoneVerified
} from '@mui/icons-material';
import { format } from 'date-fns';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { avatarService } from '../../services/avatarService.js';

const StudentProfileScreen = () => {
    const { currentUser } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState(null);
    [avatarPreview, setAvatarPreview] = useState(null);
    [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

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
            showNotification('Logged out successfully', 'info');
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
            showNotification('Failed to log out', 'error');
        }
    };

    const handleAvatarClick = () => {
        if (profileData.photoURL) {
            setAvatarPreview({
                file: null,
                preview: profileData.photoURL,
                name: 'profile.jpg'
            });
        }
        setAvatarDialogOpen(true);
    };

    const handleAvatarClose = () => {
        setAvatarDialogOpen(false);
        setAvatarPreview(null);
    };

    const handleAvatarSelect = async (file) => {
        if (!file) return;

        try {
            const processedFile = await avatarService.processImageForUpload(file);
            const preview = await avatarService.createAvatarPreview(processedFile);

            setAvatarPreview(preview);
            setAvatarFile(preview.file);
            setUserDetails(prev => ({ ...prev, photoURL: preview.preview }));
        } catch (error) {
            showNotification('Failed to process image. Please try a different image.', 'error');
        }
    };

    const handleAvatarSave = async () => {
        if (!avatarFile) {
            return;
        }

        try {
            const result = await avatarService.uploadAvatar(avatarFile, {
                folder: `avatars/${currentUser.uid}`,
                tags: ['profile', 'student'],
                transformation: avatarService.getTransformationOptions('profile'),
                tags: ['profile', 'student', 'user', 'verified']
            });

            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                ...userDetails,
                photoURL: result.url,
                avatarPublicId: result.public_id,
                avatarWidth: result.width,
                avatarHeight: result.height,
                avatarFormat: result.format,
                avatarSize: result.bytes
            }, { merge: true });

            showNotification('Avatar updated successfully!', 'success');
            setAvatarDialogOpen(false);
            setAvatarPreview(null);
        } catch (error) {
            showNotification('Failed to update avatar. Please try again.', 'error');
        }
    };

    const handleRemoveAvatar = async () => {
        if (!profileData.photoURL) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const avatarPublicId = avatarService.extractPublicIdFromUrl(profileData.photoURL);

        try {
            if (avatarPublicId) {
                await avatarService.deleteAvatar(avatarPublicId);
            }
            await updateDoc(userDocRef, {
                photoURL: '',
                avatarPublicId: ''
            }, { merge: true });

            setUserDetails(prev => ({ ...prev, photoURL: '', avatarPublicId: '' }));
            showNotification('Avatar removed successfully', 'info');
        } catch (error) {
            showNotification('Failed to remove avatar', 'error');
        }
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <CircularProgress size={40} />
            </Box>
        );
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
        <Box sx={{
            flexGrow: 1,
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pb: { xs: '80px', md: 0 }
        }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
                {/* Profile Header */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        <Box sx={{ position: 'relative' }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                                        }
                                    }
                                }}
                            >
                                <IconButton
                                    onClick={handleAvatarClick}
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                        },
                                    }}
                                >
                                    <PhotoCamera />
                                </IconButton>
                            </Badge>
                            <Avatar
                                src={userDetails?.photoURL || ''}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: '3px solid rgba(255, 255, 255, 0.3)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                {currentUser?.displayName?.[0] || 'U'}
                            </Avatar>
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                            {userDetails?.fullName || currentUser?.displayName || 'Student'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {currentUser?.email}
                            </Typography>
                            {userDetails?.phoneVerified && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneVerified sx={{ fontSize: 14 }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                        Verified
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        </Stack>

                        {/* Avatar Stats */}
                        {userDetails?.photoURL && (
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                    <Chip
                                        size="small"
                                        label={`${userDetails.avatarWidth || '200'}x${userDetails.avatarHeight || '200'}`}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                    <Chip
                                        size="small"
                                        label={userDetails.avatarFormat || 'webp' || 'jpg'}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        )}

                        {/* Edit Profile Button */}
                        <Button
                            variant="contained"
                            onClick={() => navigate('/profile/edit')}
                            startIcon={<EditIcon />}
                            sx={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.primary',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    color: 'text.primary',
                                },
                                px: 4,
                                py: 2,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Edit Profile
                        </Button>
                    </Stack>
                </Paper>

                {/* Verification Status */}
                {verificationStatus === 'pending' && (
                    <Alert
                        severity="info"
                        icon={<HourglassEmpty fontSize="inherit" />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            Your verification is pending. We are reviewing your ID.
                        </Typography>
                    </Alert>
                )}
                {verificationStatus === 'not_verified' && (
                    <Alert
                        severity="warning"
                        action={
                            <Button color="inherit" size="small" onClick={() => navigate('/profile/edit')}>
                                VERIFY NOW
                            </Button>
                        }
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            Your profile is not verified. Verify now to find roommates.
                        </Typography>
                    </Alert>
                )}

                {/* About Me Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        About Me
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {userDetails?.bio || "No bio added yet. Click edit to tell us about yourself!"}
                    </Typography>
                </Paper>

                {/* Personal Details Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Personal Details
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Person sx={{ color: 'text.secondary' }} />
                                <Typography fontWeight="bold" color="text.primary">
                                    {userDetails?.fullName || 'Not specified'}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Email sx={{ color: 'text.secondary' }} />
                                <Typography color="text.secondary">
                                    {currentUser?.email}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Phone sx={{ color: 'text.secondary' }} />
                                <Typography color="text.secondary">
                                    {userDetails?.phoneNumber || 'Not specified'}
                                </Typography>
                            </Box>
                        </Grid>

                        {userDetails?.dateOfBirth && (
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {format(new Date(userDetails.dateOfBirth, 'PPP')}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {userDetails?.nationality && (
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {phoneVerificationService.getNationalities().find(n => n.code === userDetails.nationality)?.name || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {userDetails?.gender && (
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Person sx={{ color: 'text.secondary' }} />
                                    <Typography color="text.secondary">
                                        {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Academic Details */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Academic Information
                    </Typography>

                    <Stack spacing={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <School sx={{ color: 'text.secondary' }} />
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.hometown || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <BusinessCenter sx={{ color: 'text.secondary' }} />
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.college || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Book sx={{ color: 'text.secondary' }} />
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.course && userDetails?.year
                                            ? `${userDetails.course}, ${userDetails.year}`
                                            : 'Not specified'
                                        }
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>

                {/* Lifestyle & Habits Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Lifestyle & Habits
                    </Typography>

                    <Stack spacing={3}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                Languages
                            </Typography>
                            {userDetails?.languages?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {userDetails.languages.map(lang => (
                                        <Chip
                                            key={lang}
                                            label={lang}
                                            size="small"
                                            color="primary"
                                            sx={{
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Not specified
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                Habits
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {userDetails?.habits || 'Not specified'}
                            </Typography>
                        </Box>

                        {userDetails?.languages?.includes('Haryanvi') && userDetails?.hookah && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                    Hookah
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {userDetails.hookah}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>

                {/* Contact Information Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Contact Information
                    </Typography>

                    <Stack spacing={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <LocationOn sx={{ color: 'text.secondary' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        Address
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {userDetails?.businessAddress || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <BusinessCenter sx={{ color: 'text.secondary' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        Business Type
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {userDetails?.businessType || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <CalendarToday sx={{ color: 'text.secondary' }} />
                                    <Typography variant="profile.body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        Member Since
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary'>
                                        {userDetails?.joinedAt ? format(new Date(userDetails.joinedAt, 'MMM dd, yyyy') : 'Not specified'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>

                {/* Stats Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'userVerificationStatus === 'verified' ? 'success' : 'info' }}>
                        Profile Stats
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.totalConnections || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Connections
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.totalListings || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Listings
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.wishlistCount || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary'>
                                    Wishlist Items
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.profileViews || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary'>
                                    Profile Views
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Action Button */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Button
                        variant="contained"
                        onClick={handleLogout}
                        startIcon={<AccountCircle />}
                        sx={{
                            background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                            },
                            color: 'white',
                            py: 2,
                            px: 4,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Log Out
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => navigate('/profile/edit')}
                        startIcon={<EditIcon />}
                        sx={{
                            borderRadius: 3,
                            px: 4,
                            py: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: 'divider'
                        }}
                    >
                        Edit Profile
                    </Button>
                </Stack>
            </Container>

            {/* Avatar Upload Dialog */}
            <Dialog
                open={avatarDialogOpen}
                onClose={handleAvatarClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Update Profile Picture
                    </Typography>
                    <IconButton
                        onClick={handleAvatarClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'text.secondary',
                            '&:hover': { color: 'text.primary' }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 1, pb: 1 }}>
                    {avatarPreview ? (
                        <>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={avatarPreview.preview}
                                        alt="Avatar Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '300px',
                                            borderRadius: 2
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {avatarPreview.size > 1024 * 1024 && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            Large image detected. Image will be optimized for web viewing.
                                        </Alert>
                                    )}
                                </Box>

                                {/* Upload Options */}
                                <Stack spacing={2}>
                                    <Button
                                        variant="contained"
                                        component="label"
                                        onClick={() => document.getElementById('avatar-upload-input')?.click()}
                                        startIcon={<CloudUpload />}
                                        disabled={isUploading}
                                        sx={{ py: 2, borderRadius: 2 }}
                                    >
                                        {isUploading ? (
                                            <>
                                                <CircularProgress size={20} color="inherit" />
                                                <span style={{ marginLeft: 8 }}>Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CloudUpload />
                                                <span style={{ marginLeft: 8 }}>Choose Photo</span>
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="text"
                                        onClick={handleAvatarClose}
                                        startIcon={<Close />}
                                        sx={{ py: 2, borderRadius: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                </Stack>

                                {/* Upload Progress */}
                                {isUploading && (
                                    <Box sx={{ width: '100%', mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: 2
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                            {uploadProgress}% uploaded
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                                {avatarPreview ? 'Avatar preview will appear here' : 'Choose a profile picture to upload'}
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleAvatarSelect(e.target.files[0])}
                                style={{ display: 'none' }}
                                id="avatar-upload-input"
                            />
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleAvatarClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleAvatarSave}
                            disabled={!avatarFile || isUploading}
                            startIcon={<CheckCircle />}
                            sx={{
                                background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)'
                            }}
                        >
                            {isUploading ? 'Saving...' : 'Save Avatar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default StudentProfileScreen;

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
